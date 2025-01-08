import { Notice } from 'obsidian';
import { OpenAIService } from '../ai/services/OpenAIService';
import { ISummarizationService } from '../../interfaces';
import { PromptService } from '../ai/services/PromptService';

export class SummarizationService implements ISummarizationService {
    constructor(
        private openAIService: OpenAIService,
        private promptService: PromptService
    ) {}

    async summarize(
        content: string, 
        useStreaming: boolean = false,
        onChunk?: (chunk: string) => void
    ): Promise<string> {
        try {
            const summaryPrompt = await this.promptService.getPrompt('summary');
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