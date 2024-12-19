import { App, TFile, Notice, MarkdownView, View } from 'obsidian';
import { JournalingAssistantSettings } from '../types';
import { OpenAIService } from './OpenAIService';
import { WhisperService } from './WhisperService';
import { TranscriptionService } from './TranscriptionService';
import { SummarizationService } from './SummarizationService';
import { PromptService } from './PromptService';

export class JournalService {
    private whisperService: WhisperService;
    private summarizationService: SummarizationService;
    private promptService: PromptService;

    constructor(
        private app: App,
        private settings: JournalingAssistantSettings,
        private openAIService: OpenAIService
    ) {
        this.whisperService = new WhisperService(this.app.vault, this.settings.openAIApiKey);
        this.summarizationService = new SummarizationService(this.openAIService);
        this.promptService = new PromptService(this.openAIService);
    }

    updateSettings(settings: JournalingAssistantSettings) {
        this.settings = settings;
        this.whisperService.setApiKey(settings.openAIApiKey);
    }

    private getTodayFileName(): string {
        const date = new Date();
        return date.toISOString().split('T')[0] + '.md'; // Format: YYYY-MM-DD.md
    }

    private async ensureFolder(folderPath: string): Promise<void> {
        if (!(await this.app.vault.adapter.exists(folderPath))) {
            await this.app.vault.createFolder(folderPath);
        }
    }

    private async getPastJournalEntries(count: number): Promise<string[]> {
        const folder = this.app.vault.getAbstractFileByPath(this.settings.journalFolder);
        if (!folder) return [];

        const files = this.app.vault.getMarkdownFiles()
            .filter(file => file.path.startsWith(this.settings.journalFolder + '/'))
            .sort((a, b) => b.stat.mtime - a.stat.mtime)
            .slice(0, count);

        const entries = await Promise.all(
            files.map(async file => {
                const content = await this.app.vault.read(file);
                return {
                    date: file.basename,
                    content: content
                };
            })
        );

        return entries.map(entry => `Date: ${entry.date}\n${entry.content}`);
    }

    async openTodaysJournal(): Promise<void> {
        try {
            await this.ensureFolder(this.settings.journalFolder);

            const fileName = this.getTodayFileName();
            const filePath = `${this.settings.journalFolder}/${fileName}`;
            
            let file = this.app.vault.getAbstractFileByPath(filePath);

            if (!file) {
                let initialContent = `# Journal Entry - ${new Date().toLocaleDateString()}\n\n`;
                file = await this.app.vault.create(filePath, initialContent);
                
                try {
                    const loadingNotice = new Notice('Generating journal prompt...', 0);
                    const pastEntries = await this.getPastJournalEntries(this.settings.numberOfPastEntries);
                    
                    // Create the file with initial content first
                    const leaf = this.app.workspace.getLeaf(false);
                    await leaf.openFile(file as TFile);
                    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                    
                    if (view) {
                        if (this.settings.useStreamingResponse) {
                            // Stream the AI response directly into the editor
                            await this.promptService.generatePrompt(pastEntries, (chunk) => {
                                const currentContent = view.editor.getValue();
                                view.editor.setValue(currentContent + chunk);
                            });
                        } else {
                            // Get the complete response and update the editor once
                            const aiPrompt = await this.promptService.generatePrompt(pastEntries);
                            view.editor.setValue(view.editor.getValue() + aiPrompt);
                        }
                        
                        // Add the response section after the prompt
                        const finalContent = view.editor.getValue();
                        view.editor.setValue(finalContent + '\n\n## Your Journal Response\n\n');
                    }
                    
                    loadingNotice.hide();
                    new Notice('Created new journal entry for today');
                } catch (error) {
                    new Notice('Error generating prompt: ' + error.message);
                    // Add empty response section if prompt generation fails
                    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                    if (view) {
                        view.editor.setValue(view.editor.getValue() + '\n\n## Your Journal Response\n\n');
                    }
                }
            } else {
                const leaf = this.app.workspace.getLeaf(false);
                await leaf.openFile(file as TFile);
            }

        } catch (error) {
            new Notice('Error opening today\'s journal: ' + error.message);
            console.error('Error opening today\'s journal:', error);
        }
    }

    async summarizeJournalingSession(): Promise<void> {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            new Notice('Please open a note first');
            return;
        }

        if (!activeView.file) {
            new Notice('No file is currently open');
            return;
        }

        try {
            // Save original content to inputs folder
            const originalContent = activeView.editor.getValue();
            const fileName = activeView.file.name;
            const inputPath = `${this.settings.inputsFolder}/${fileName}`;
            
            await this.ensureFolder(this.settings.inputsFolder);
            await this.app.vault.create(inputPath, originalContent);

            // Process content (transcribe recordings if any)
            let processedContent = await this.processContent(originalContent);

            // Extract user's response section
            const responseMatch = processedContent.match(/## Your Journal Response\n\n([\s\S]*$)/);
            if (!responseMatch) {
                new Notice('Could not find journal response section');
                return;
            }

            const userResponse = responseMatch[1];
            let summary: string;

            if (this.settings.useStreamingResponse) {
                // Create a temporary variable to store the streamed summary
                let streamedSummary = '';
                summary = await this.summarizationService.summarize(
                    userResponse,
                    true,
                    (chunk) => {
                        streamedSummary += chunk;
                        // Update the editor in real-time with the partial summary
                        const updatedContent = processedContent.replace(
                            /## Your Journal Response\n\n[\s\S]*$/,
                            `## Your Journal Response\n\n${streamedSummary}`
                        );
                        activeView.editor.setValue(updatedContent);
                    }
                );
            } else {
                // Get the complete summary at once
                summary = await this.summarizationService.summarize(userResponse);
            }

            // Update the note with the final summary
            const updatedContent = processedContent.replace(
                /## Your Journal Response\n\n[\s\S]*$/,
                `## Your Journal Response\n\n${summary}`
            );

            activeView.editor.setValue(updatedContent);
            new Notice('Journal session summarized');

        } catch (error) {
            new Notice(`Error: ${error.message}`);
            console.error('Summarization error:', error);
        }
    }

    private async processContent(content: string): Promise<string> {
        const recordingPattern = TranscriptionService.getRecordingEmbedPattern();
        const recordings = content.match(recordingPattern);

        if (!recordings) return content;

        let processedContent = content;

        for (const recording of recordings) {
            const fileName = recording.slice(3, -2);
            const file = this.app.metadataCache.getFirstLinkpathDest(fileName, "");
            
            if (file instanceof TFile) {
                const transcript = await this.whisperService.transcribeFile(file);
                processedContent = processedContent.replace(recording, transcript);
            }
        }

        return processedContent;
    }
} 