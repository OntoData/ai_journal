import { Notice } from 'obsidian';
import { OpenAIService } from './OpenAIService';
import summaryPrompt from '../prompts/summaryPrompt';

export class SummarizationService {
    constructor(private openAIService: OpenAIService) {}

    /**
     * Takes the user's journal response and returns a summary
     * @param content The content to summarize
     * @param useStreaming Whether to stream the response
     * @param onChunk Optional callback for streaming responses
     */
    async summarize(
        content: string, 
        useStreaming: boolean = false,
        onChunk?: (chunk: string) => void
    ): Promise<string> {
        try {
            const prompt = `${summaryPrompt}\n\n${content}`;
            return await this.openAIService.makeOpenAIRequest(
                prompt, 
                useStreaming ? onChunk : undefined
            );
        } catch (error: any) {
            new Notice(`Error during summarization: ${error.message}`);
            throw error;
        }
    }
} 