import { App, Plugin, MarkdownView, Notice } from 'obsidian';
import { JournalingAssistantSettings, DEFAULT_SETTINGS } from './src/types';
import { JournalService } from './src/services/JournalService';
import { OpenAIService } from './src/services/OpenAIService';
import { JournalingAssistantSettingTab } from './src/settings/SettingTab';
import { AudioTranscriber } from './src/audioTranscriber';
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
        this.addRibbonIcon('bot', 'Journal with AI', async () => {
            await this.journalService.openTodaysJournal();
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
    }

    async loadSettings() {
        const data = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
        console.log(this.settings);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    onunload() {
        console.log("Unloading Journaling Assistant Plugin...");
    }
}

export default JournalingAssistantPlugin;
