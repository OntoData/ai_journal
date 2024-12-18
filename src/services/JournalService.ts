import { App, TFile, Notice, MarkdownView, View } from 'obsidian';
import { JournalingAssistantSettings } from '../types';
import { OpenAIService } from './OpenAIService';
import { AudioTranscriber } from '../audioTranscriber';

export class JournalService {
    constructor(
        private app: App,
        private settings: JournalingAssistantSettings,
        private openAIService: OpenAIService
    ) {}

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
                
                try {
                    const loadingNotice = new Notice('Generating journal prompt...', 0);
                    
                    const pastEntries = await this.getPastJournalEntries(this.settings.numberOfPastEntries);
                    const aiPrompt = await this.openAIService.generatePrompt(pastEntries);
                    loadingNotice.hide();
                    
                    initialContent += `${aiPrompt}\n\n## Your Journal Response\n\n`;
                } catch (error) {
                    new Notice('Error generating prompt: ' + error.message);
                    initialContent += `## Your Journal Response\n\n`;
                }

                file = await this.app.vault.create(filePath, initialContent);
                new Notice('Created new journal entry for today');
                console.log(initialContent);
            }

            const leaf = this.app.workspace.getLeaf(false);
            await leaf.openFile(file as TFile);

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
            const summary = await this.openAIService.generateSummary(userResponse);

            // Replace response with summary
            const updatedContent = processedContent.replace(
                /## Your Journal Response\n\n[\s\S]*$/,
                `## Your Journal Response\n\n${summary}`
            );

            // Update the note
            activeView.editor.setValue(updatedContent);
            new Notice('Journal session summarized');

        } catch (error) {
            new Notice(`Error: ${error.message}`);
            console.error('Summarization error:', error);
        }
    }

    private async processContent(content: string): Promise<string> {
        const recordingPattern = AudioTranscriber.getRecordingEmbedPattern();
        const recordings = content.match(recordingPattern);

        if (!recordings) return content;

        const transcriber = new AudioTranscriber(this.app.vault, this.settings.openAIApiKey);
        let processedContent = content;

        for (const recording of recordings) {
            const fileName = recording.slice(3, -2);
            const file = this.app.metadataCache.getFirstLinkpathDest(fileName, "");
            
            if (file instanceof TFile) {
                const transcript = await transcriber.transcribeFile(file);
                processedContent = processedContent.replace(recording, transcript);
            }
        }

        return processedContent;
    }
} 