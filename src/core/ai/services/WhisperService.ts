import { TFile, Vault } from 'obsidian';
import { IWhisperService } from '../../../interfaces';
import { isSupportedAudioFormat } from '../../../utils/helpers';

export class WhisperService implements IWhisperService {
    constructor(
        private vault: Vault,
        private apiKey: string
    ) {}

    setApiKey(apiKey: string) {
        this.apiKey = apiKey;
    }

    async transcribeFile(audioFile: TFile): Promise<string> {
        try {
            if (!this.apiKey) {
                throw new Error('OpenAI API key is required for transcription');
            }

            if (!isSupportedAudioFormat(audioFile)) {
                throw new Error(`Unsupported audio format: ${audioFile.extension}`);
            }

            const formData = new FormData();
            const arrayBuffer = await this.vault.readBinary(audioFile);
            const blob = new Blob([arrayBuffer], { type: `audio/${audioFile.extension}` });
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