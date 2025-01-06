import { App, Plugin, Notice, Menu } from 'obsidian';
import { JournalingAssistantSettings, DEFAULT_SETTINGS } from './src/types';
import { JournalService } from './src/core/journal/JournalService';
import { OpenAIService } from './src/core/ai/services/OpenAIService';
import { JournalingAssistantSettingTab } from './src/settings/SettingTab';
import { TranscriptionService } from './src/core/transcription/TranscriptionService';

export class JournalingAssistantPlugin extends Plugin {
    settings: JournalingAssistantSettings;
    private journalService: JournalService;
    private openAIService: OpenAIService;
    private transcriptionService: TranscriptionService;

    async onload() {
        await this.loadSettings();
        
        // Initialize services with the new structure
        this.openAIService = new OpenAIService(this.settings);
        this.transcriptionService = new TranscriptionService(this.app, this.settings);
        this.journalService = new JournalService(
            this.app, 
            this.settings, 
            this.openAIService
        );

        // Add settings tab
        this.addSettingTab(new JournalingAssistantSettingTab(this.app, this));

        // Add ribbon icon with menu
        this.addRibbonIcon('bot', 'Journaling Assistant', (evt: MouseEvent | PointerEvent) => {
            const menu = new Menu();
            menu.addItem((item) =>
                item
                    .setTitle("Open Today's Journal")
                    .setIcon('calendar-plus')
                    .onClick(() => {
                        this.journalService.openTodaysJournal();
                    })
            );
            menu.addItem((item) =>
                item
                    .setTitle("Chat with AI")
                    .setIcon('message-square')
                    .onClick(() => {
                        this.journalService.chatWithAI();
                    })
            );
            menu.addItem((item) =>
                item
                    .setTitle("Summarize Journaling Session")
                    .setIcon('book')
                    .onClick(() => {
                        this.journalService.summarizeJournalingSession();
                    })
            );
            menu.showAtMouseEvent(evt);
        });

        this.addCommands();
    }

    private addCommands() {
        // Command to open today's journal
        this.addCommand({
            id: 'open-todays-journal',
            name: 'Open Today\'s Journal',
            callback: async () => {
                await this.journalService.openTodaysJournal();
            },
        });

        // Command to transcribe recordings
        this.addCommand({
            id: 'transcribe-recordings',
            name: 'Transcribe Recordings',
            callback: async () => {
                await this.transcriptionService.transcribeRecordings();
            },
        });

        // Command to summarize journal
        this.addCommand({
            id: 'summarize-journal',
            name: 'Summarize Journaling Session',
            callback: async () => {
                await this.journalService.summarizeJournalingSession();
            },
        });

        // Command to chat with AI
        this.addCommand({
            id: 'chat-with-ai',
            name: 'Chat with AI',
            callback: async () => {
                await this.journalService.chatWithAI();
            },
        });
    }

    async loadSettings() {
        const data = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
    }

    async saveSettings() {
        await this.saveData(this.settings);
        // Update all services with new settings
        this.openAIService.updateSettings(this.settings);
        this.transcriptionService.updateSettings(this.settings);
        this.journalService.updateSettings(this.settings);
    }

    onunload() {
        console.log("Unloading Journaling Assistant Plugin...");
    }
}

export default JournalingAssistantPlugin;
