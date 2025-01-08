import { OpenAIService } from './OpenAIService';
import { PromptService } from './PromptService';

export class ChatService {
    constructor(
        private openAIService: OpenAIService,
        private promptService: PromptService
    ) {}

    async chat(transcribedText: string): Promise<string> {
        const chatPrompt = await this.promptService.getPrompt('chat');
        const prompt = `${chatPrompt}\n\nUser: ${transcribedText}\n\nAssistant:`;
        return this.openAIService.makeOpenAIRequest(prompt);
    }
} 