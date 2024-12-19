import { Notice } from 'obsidian';
import { JournalingAssistantSettings } from '../types';
import journalPrompt from '../prompts/journalPrompt';
import summaryPrompt from '../prompts/summaryPrompt';

export class OpenAIService {
    constructor(private settings: JournalingAssistantSettings) {}

    updateSettings(settings: JournalingAssistantSettings) {
        this.settings = settings;
    }

    async generatePrompt(pastEntries: string[]): Promise<string> {
        if (!this.settings.openAIApiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const pastEntriesText = pastEntries.length > 0 
            ? `Past Entries:\n\n${pastEntries.join('\n\n---\n\n')}`
            : 'No past entries available.';

        const prompt = `${journalPrompt}\n\n${pastEntriesText}`;
        return await this.makeOpenAIRequest(prompt);
    }

    async generateSummary(content: string): Promise<string> {
        const prompt = `${summaryPrompt}\n\n${content}`;
        return await this.makeOpenAIRequest(prompt);
    }

    private async makeOpenAIRequest(prompt: string): Promise<string> {
        if (!this.settings.openAIApiKey) {
            throw new Error('OpenAI API key not configured');
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.openAIApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || 'API request failed');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw error;
        }
    }
} 