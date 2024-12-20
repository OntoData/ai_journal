import { App, Plugin, MarkdownView, Notice, Menu } from 'obsidian';
import { JournalingAssistantSettings, DEFAULT_SETTINGS } from './src/types';
import { JournalService } from './src/services/JournalService';
import { OpenAIService } from './src/services/OpenAIService';
import { JournalingAssistantSettingTab } from './src/settings/SettingTab';
import { TranscriptionService } from './src/services/TranscriptionService';

export class JournalingAssistantPlugin extends Plugin {
    settings: JournalingAssistantSettings;
    private journalService: JournalService;
    private openAIService: OpenAIService;
    private transcriptionService: TranscriptionService;

    async onload() {
        await this.loadSettings();
        
        this.openAIService = new OpenAIService(this.settings);
        this.journalService = new JournalService(this.app, this.settings, this.openAIService);
        this.transcriptionService = new TranscriptionService(this.app, this.settings);

        // Add settings tab
        this.addSettingTab(new JournalingAssistantSettingTab(this.app, this));

        // Add ribbon icon
        this.addRibbonIcon('bot', 'Journaling Assistant', (evt: MouseEvent | PointerEvent) => {
            const menu = new Menu();
            menu.addItem((item) =>
                item
                    .setTitle("Open Today's Journal")
                    .onClick(() => {
                        this.journalService.openTodaysJournal();
                    })
            );
            menu.addItem((item) =>
                item
                    .setTitle("Chat with AI")
                    .onClick(() => {
                        this.journalService.chatWithAI();
                    })
            );
            menu.addItem((item) =>
                item
                    .setTitle("Summarize Journaling Session")
                    .onClick(() => {
                        this.journalService.summarizeJournalingSession();
                    })
            );
            menu.showAtMouseEvent(evt);
        });

        this.addCommands();
    }

    private addCommands() {
        this.addCommand({
            id: 'open-todays-journal',
            name: 'Open Today\'s Journal',
            callback: async () => {
                await this.journalService.openTodaysJournal();
            },
        });

        this.addCommand({
            id: 'transcribe-recordings',
            name: 'Transcribe Recordings',
            callback: async () => {
                await this.transcriptionService.transcribeRecordings();
            },
        });

        this.addCommand({
            id: 'summarize-journal',
            name: 'Summarize Journaling Session',
            callback: async () => {
                await this.journalService.summarizeJournalingSession();
            },
        });

        // New Chat with AI command
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
        console.log(this.settings);
    }

    async saveSettings() {
        await this.saveData(this.settings);
        // Update services with new settings
        this.openAIService = new OpenAIService(this.settings);
        this.transcriptionService.updateSettings(this.settings);
        this.journalService.updateSettings(this.settings);
    }

    onunload() {
        console.log("Unloading Journaling Assistant Plugin...");
    }
}

export default JournalingAssistantPlugin;
