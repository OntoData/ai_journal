import { Notice, TFile, Vault } from 'obsidian';
import { AudioProcessingService } from './AudioProcessingService';

export class WhisperService {
    private audioProcessor: AudioProcessingService;

    constructor(
        private vault: Vault,
        private apiKey: string
    ) {
        if (!apiKey) {
            throw new Error('OpenAI API key is required');
        }
        this.audioProcessor = new AudioProcessingService(vault);
    }

    async transcribeFile(audioFile: TFile): Promise<string> {
        try {
            if (!AudioProcessingService.isSupportedFormat(audioFile)) {
                throw new Error(`Unsupported audio format: ${audioFile.extension}`);
            }

            const { blob, mimeType } = await this.audioProcessor.prepareAudioForTranscription(audioFile);
            
            const formData = new FormData();
            formData.append('file', blob, `${audioFile.basename}.${audioFile.extension}`);
            formData.append('model', 'whisper-1');

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Transcription failed');
            }

            const result = await response.json();
            return result.text;
        } catch (error) {
            console.error('Transcription error:', error);
            throw error;
        }
    }
} 