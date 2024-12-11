import { Notice, TFile, Vault } from 'obsidian';

export class AudioTranscriber {
    private vault: Vault;
    private apiKey: string;

    constructor(vault: Vault, apiKey: string) {
        this.vault = vault;
        this.apiKey = apiKey;
    }

    async transcribeFile(audioFile: TFile): Promise<string> {
        try {
            const arrayBuffer = await this.vault.readBinary(audioFile);
            const blob = new Blob([arrayBuffer], { type: 'audio/webm' });
            
            const formData = new FormData();
            formData.append('file', blob, audioFile.name);
            formData.append('model', 'whisper-1');

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
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

    static getRecordingEmbedPattern(): RegExp {
        return /!\[\[Recording \d{14}\.webm\]\]/g;
    }
} 