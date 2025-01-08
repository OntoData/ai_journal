import { App } from 'obsidian';
import { JournalingAssistantSettings } from '../../../types';

// Import default prompts
import enChatPrompt from '../prompts/en/chatPrompt';
import enJournalPrompt from '../prompts/en/journalPrompt';
import enSummaryPrompt from '../prompts/en/summaryPrompt';
import plChatPrompt from '../prompts/pl/chatPrompt';
import plJournalPrompt from '../prompts/pl/journalPrompt';
import plSummaryPrompt from '../prompts/pl/summaryPrompt';

type PromptType = 'chat' | 'journal' | 'summary';

export class PromptService {
    private defaultPrompts = {
        en: {
            chat: enChatPrompt,
            journal: enJournalPrompt,
            summary: enSummaryPrompt
        },
        pl: {
            chat: plChatPrompt,
            journal: plJournalPrompt,
            summary: plSummaryPrompt
        }
    };

    constructor(
        private app: App,
        private settings: JournalingAssistantSettings
    ) {}

    async getPrompt(type: PromptType): Promise<string> {
        if (this.settings.useCustomPrompts) {
            const path = this.settings.customPromptPaths[type];
            if (!path) {
                throw new Error(`Custom prompt path not set for ${type}`);
            }

            const file = this.app.vault.getAbstractFileByPath(path);
            if (!file) {
                throw new Error(`Custom prompt file not found: ${path}`);
            }

            try {
                return await this.app.vault.read(file as any);
            } catch (error) {
                throw new Error(`Failed to read custom prompt file: ${error.message}`);
            }
        }

        return this.defaultPrompts[this.settings.language][type];
    }

    updateSettings(settings: JournalingAssistantSettings) {
        this.settings = settings;
    }
} 