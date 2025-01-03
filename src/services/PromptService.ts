import { OpenAIService } from './OpenAIService';
import { Notice } from 'obsidian';
import journalPrompt from '../prompts/journalPrompt';

export class PromptService {
    constructor(private openAIService: OpenAIService) {}

    /**
     * Generates a journal prompt based on past entries
     * @param pastEntries Array of past journal entries
     * @param onChunk Optional callback for streaming responses
     */
    async generatePrompt(pastEntries: string[], onChunk?: (chunk: string) => void): Promise<string> {
        try {
            const pastEntriesText = pastEntries.length > 0 
                ? `Past Entries:\n\n${pastEntries.join('\n\n---\n\n')}`
                : 'No past entries available.';

            const prompt = `${journalPrompt}\n\n${pastEntriesText}`;
            return await this.openAIService.makeOpenAIRequest(prompt, onChunk);
        } catch (error: any) {
            new Notice(`Error generating prompt: ${error.message}`);
            throw error;
        }
    }
} 