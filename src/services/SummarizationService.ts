import { Notice } from 'obsidian';
import { OpenAIService } from './OpenAIService';
import summaryPrompt from '../prompts/summaryPrompt';

export class SummarizationService {
    constructor(private openAIService: OpenAIService) {}

    /**
     * Takes the user's journal response and returns a summary
     */
    async summarize(content: string): Promise<string> {
        try {
            const prompt = `${summaryPrompt}\n\n${content}`;
            return await this.openAIService.makeOpenAIRequest(prompt);
        } catch (error: any) {
            new Notice(`Error during summarization: ${error.message}`);
            throw error;
        }
    }
} 