import { App, TFile, Notice, MarkdownView } from 'obsidian';
import { JournalingAssistantSettings } from '../../types';
import { IJournalService } from '../../interfaces';
import { OpenAIService } from '../ai/services/OpenAIService';
import { WhisperService } from '../ai/services/WhisperService';
import { TranscriptionService } from '../transcription/TranscriptionService';
import { SummarizationService } from '../summary/SummarizationService';
import { ChatService } from '../ai/services/ChatService';
import { JournalManager } from './JournalManager';
import { PromptService } from '../ai/services/PromptService';

export class JournalService implements IJournalService {
    private static readonly JOURNAL_RESPONSE_PATTERN = /## Your Journal Response\s*([\s\S]*$)/;
    private journalManager: JournalManager;
    private whisperService: WhisperService;
    private summarizationService: SummarizationService;
    private chatService: ChatService;
    private transcriptionService: TranscriptionService;

    constructor(
        private app: App,
        private settings: JournalingAssistantSettings,
        private openAIService: OpenAIService,
        private promptService: PromptService
    ) {
        this.journalManager = new JournalManager(this.app, this.settings);
        this.whisperService = new WhisperService(this.app.vault, this.settings.openAIApiKey);
        this.summarizationService = new SummarizationService(this.openAIService, this.promptService);
        this.chatService = new ChatService(this.openAIService, this.promptService);
        this.transcriptionService = new TranscriptionService(this.app, this.settings);
    }

    updateSettings(settings: JournalingAssistantSettings) {
        this.settings = settings;
        this.whisperService.setApiKey(settings.openAIApiKey);
        this.transcriptionService.updateSettings(settings);
        this.openAIService.updateSettings(settings);
    }

    async openTodaysJournal(): Promise<void> {
        try {
            await this.journalManager.ensureFolder(this.settings.journalFolder);
            
            const filePath = `${this.settings.journalFolder}/${this.journalManager.getTodayFileName()}`;
            let file = this.app.vault.getAbstractFileByPath(filePath);

            if (!file) {
                const loadingNotice = new Notice('Generating journal prompt...', 0);
                
                try {
                    // Create new journal entry
                    file = await this.journalManager.createNewJournalEntry();
                    
                    // Get past entries for context
                    const pastEntries = await this.journalManager.getPastJournalEntries(this.settings.numberOfPastEntries);
                    
                    // Open the file
                    const leaf = this.app.workspace.getLeaf(false);
                    await leaf.openFile(file as TFile);
                    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                    
                    if (view) {
                        if (this.settings.useStreamingResponse) {
                            // Stream the AI response
                            await this.openAIService.makeOpenAIRequest(
                                await this.createJournalPrompt(pastEntries),
                                (chunk) => {
                                    const currentContent = view.editor.getValue();
                                    view.editor.setValue(currentContent + chunk);
                                }
                            );
                        } else {
                            // Get complete response
                            const aiPrompt = await this.openAIService.makeOpenAIRequest(
                                await this.createJournalPrompt(pastEntries)
                            );
                            view.editor.setValue(view.editor.getValue() + aiPrompt);
                        }
                        
                        // Add response section
                        view.editor.setValue(view.editor.getValue() + '\n\n## Your Journal Response\n\n');
                    }
                    
                    loadingNotice.hide();
                    new Notice('Created new journal entry for today');
                } catch (error) {
                    new Notice('Error generating prompt: ' + error.message);
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

    private async createJournalPrompt(pastEntries: string[]): Promise<string> {
        const journalPrompt = await this.promptService.getPrompt('journal');
        const pastEntriesText = pastEntries.length > 0 
            ? `Past Entries:\n\n${pastEntries.join('\n\n---\n\n')}`
            : 'No past entries available.';

        return `${journalPrompt}\n\n${pastEntriesText}`;
    }

    async summarizeJournalingSession(): Promise<void> {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView || !activeView.file) {
            new Notice('Please open a note first');
            return;
        }

        try {
            // Save original content
            const originalContent = activeView.editor.getValue();
            const fileName = activeView.file.name;
            const inputPath = `${this.settings.inputsFolder}/${fileName}`;
            
            await this.journalManager.ensureFolder(this.settings.inputsFolder);
            await this.app.vault.create(inputPath, originalContent);

            // Process content (transcribe recordings if any)
            await this.transcriptionService.transcribeRecordings();
            const processedContent = activeView.editor.getValue();

            // Extract user's response section
            const responseMatch = processedContent.match(JournalService.JOURNAL_RESPONSE_PATTERN);
            if (!responseMatch) {
                new Notice('Could not find journal response section');
                return;
            }

            const userResponse = responseMatch[1].trim();

            if (this.settings.useStreamingResponse) {
                let streamedSummary = '';
                await this.summarizationService.summarize(
                    userResponse,
                    true,
                    (chunk) => {
                        streamedSummary += chunk;
                        // Update the editor with the streaming summary
                        const updatedContent = processedContent.replace(
                            JournalService.JOURNAL_RESPONSE_PATTERN,
                            `## Your Journal Response\n\n${streamedSummary}`
                        );
                        activeView.editor.setValue(updatedContent);
                    }
                );
            } else {
                const summary = await this.summarizationService.summarize(userResponse, false);
                const updatedContent = processedContent.replace(
                    JournalService.JOURNAL_RESPONSE_PATTERN,
                    `## Your Journal Response\n\n${summary}`
                );
                activeView.editor.setValue(updatedContent);
            }

            new Notice('Journal session summarized');

        } catch (error) {
            new Notice(`Error: ${error.message}`);
            console.error('Summarization error:', error);
        }
    }

    async chatWithAI(): Promise<void> {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            new Notice('Please open a note first');
            return;
        }

        try {
            // Transcribe any audio recordings
            await this.transcriptionService.transcribeRecordings();

            // Get updated content
            const content = activeView.editor.getValue();
            
            // Prepare the base content with AI Chat section
            const baseContent = content + '\n\n---\n## AI Chat\n\n';
            activeView.editor.setValue(baseContent);
            
            let chatResponse: string;
            if (this.settings.useStreamingResponse) {
                let streamedResponse = '';
                chatResponse = await this.chatService.chat(
                    content,
                    true,
                    (chunk) => {
                        streamedResponse += chunk;
                        // Update the editor with the streaming response
                        activeView.editor.setValue(
                            baseContent + streamedResponse + '\n\n---\n## Me\n'
                        );
                    }
                );
            } else {
                chatResponse = await this.chatService.chat(content, false);
                // Update the editor with the complete response
                activeView.editor.setValue(
                    baseContent + chatResponse + '\n\n---\n## Me\n'
                );
            }

            new Notice('AI responded in note');
        } catch (error: any) {
            new Notice(`Error during chat: ${error.message}`);
        }
    }
} 