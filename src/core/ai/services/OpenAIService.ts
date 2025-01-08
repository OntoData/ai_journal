import { Notice } from 'obsidian';
import OpenAI from 'openai';
import { JournalingAssistantSettings } from '../../../types';
import { IOpenAIService } from '../../../interfaces';

export class OpenAIService implements IOpenAIService {
    private client: OpenAI;
    private previousConfig: string = ''; // Track previous configuration

    constructor(private settings: JournalingAssistantSettings) {
        this.initializeClient();
    }

    private initializeClient() {
        if (!this.settings.openAIApiKey) {
            console.warn('OpenAI API key not configured');
            return;
        }

        const config = {
            apiKey: this.settings.openAIApiKey,
            dangerouslyAllowBrowser: true
        } as const;

        // Create a configuration signature for comparison
        let configSignature = 'standard';

        // Only add Helicone configuration if developer mode is enabled and Helicone API key is set
        if (this.settings.developerMode && this.settings.heliconeApiKey) {
            const headers: Record<string, string> = {
                "Helicone-Auth": `Bearer ${this.settings.heliconeApiKey}`
            };

            // Only add stream usage header if streaming is enabled
            if (this.settings.useStreamingResponse) {
                headers["helicone-stream-usage"] = "true";
                configSignature = 'helicone-streaming';
            } else {
                configSignature = 'helicone';
            }

            Object.assign(config, {
                baseURL: "https://oai.helicone.ai/v1",
                defaultHeaders: headers
            });
        }

        // Only log if configuration has changed
        if (this.previousConfig !== configSignature) {
            if (configSignature.startsWith('helicone')) {
                console.log(`🔍 OpenAI client initialized with Helicone monitoring${
                    configSignature === 'helicone-streaming' ? ' (stream usage enabled)' : ''
                }`);
            } else {
                if (this.settings.developerMode) {
                    console.log('🔍 Developer mode is enabled but Helicone API key is not configured');
                }
                console.log('🔍 OpenAI client initialized with standard configuration');
            }
            this.previousConfig = configSignature;
        }

        this.client = new OpenAI(config);
    }

    updateSettings(settings: JournalingAssistantSettings) {
        this.settings = settings;
        this.initializeClient();
    }
    

    async makeOpenAIRequest(prompt: string, onChunk?: (chunk: string) => void): Promise<string> {
        if (!this.settings.openAIApiKey) {
            new Notice('Please configure your OpenAI API key in settings');
            throw new Error('OpenAI API key not configured');
        }

        try {
            const response = await this.client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                stream: !!onChunk,
            });

            if (onChunk) {
                let fullResponse = '';
                const stream = response as AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
                
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        fullResponse += content;
                        onChunk(content);
                    }
                }
                
                return fullResponse;
            }

            // Handle regular response
            const completion = response as OpenAI.Chat.ChatCompletion;
            return completion.choices[0].message.content || '';

        } catch (error) {
            console.error('OpenAI API error:', error);
            if (error instanceof OpenAI.APIError) {
                throw new Error(`OpenAI API Error: ${error.message}`);
            }
            throw error;
        }
    }
} 