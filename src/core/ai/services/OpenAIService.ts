import { Notice } from 'obsidian';
import { JournalingAssistantSettings } from '../../../types';
import { IOpenAIService } from '../../../interfaces';

export class OpenAIService implements IOpenAIService {
    constructor(private settings: JournalingAssistantSettings) {}

    updateSettings(settings: JournalingAssistantSettings) {
        this.settings = settings;
    }

    async makeOpenAIRequest(prompt: string, onChunk?: (chunk: string) => void): Promise<string> {
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
                    stream: !!onChunk,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }

            if (onChunk) {
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let fullResponse = '';

                if (!reader) throw new Error('Response body is null');

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim() !== '');

                    for (const line of lines) {
                        if (line.includes('[DONE]')) continue;
                        if (!line.startsWith('data:')) continue;

                        try {
                            const json = JSON.parse(line.slice(5));
                            const content = json.choices[0]?.delta?.content;
                            if (content) {
                                fullResponse += content;
                                onChunk(content);
                            }
                        } catch (e) {
                            console.warn('Failed to parse streaming response:', e);
                        }
                    }
                }

                return fullResponse;
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw error;
        }
    }
} 