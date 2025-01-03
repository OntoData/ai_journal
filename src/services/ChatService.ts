import { OpenAIService } from './OpenAIService';
import chatPrompt from '../prompts/chatPrompt';

export class ChatService {
    constructor(private openAIService: OpenAIService) {}

    /**
     * Sends the user’s note content (with any transcribed text) to OpenAI
     * and returns a friendly, conversational response.
     */
    async chat(transcribedText: string): Promise<string> {
        const prompt = `${chatPrompt}\n\nUser: ${transcribedText}\n\nAssistant:`;
        return this.openAIService.makeOpenAIRequest(prompt);
    }
} 