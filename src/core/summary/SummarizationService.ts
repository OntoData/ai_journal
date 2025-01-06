import { Notice } from 'obsidian';
import { OpenAIService } from '../ai/services/OpenAIService';
import { ISummarizationService } from '../../interfaces';
import summaryPrompt from '../ai/prompts/summaryPrompt';

export class SummarizationService implements ISummarizationService {
    constructor(private openAIService: OpenAIService) {}

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