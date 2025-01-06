import { TFile, Vault } from 'obsidian';
import { IWhisperService } from '../../../interfaces';
import { AudioProcessingService } from '../../transcription/AudioProcessingService';

export class WhisperService implements IWhisperService {
    private static readonly SUPPORTED_FORMATS = ['flac', 'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'ogg', 'wav', 'webm'];
    private static readonly MIME_TYPES: { [key: string]: string } = {
        'flac': 'audio/flac',
        'mp3': 'audio/mpeg',
        'mp4': 'audio/mp4',
        'mpeg': 'audio/mpeg',
        'mpga': 'audio/mpeg',
        'm4a': 'audio/mp4',
        'ogg': 'audio/ogg',
        'wav': 'audio/wav',
        'webm': 'audio/webm'
    };

    private audioProcessor: AudioProcessingService;

    constructor(
        private vault: Vault,
        private apiKey: string
    ) {
        this.audioProcessor = new AudioProcessingService(vault);
    }

    setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
    }

    private static isSupportedFormat(file: TFile): boolean {
        const extension = file.extension.toLowerCase();
        return WhisperService.SUPPORTED_FORMATS.includes(extension);
    }

    private async prepareAudioForTranscription(file: TFile): Promise<{ blob: Blob; mimeType: string }> {
        if (file.extension.toLowerCase() === 'm4a') {
            console.log('Converting M4A to WAV format...');
            const { buffer, mimeType } = await this.audioProcessor.convertM4AtoWAV(file);
            return {
                blob: new Blob([buffer], { type: mimeType }),
                mimeType
            };
        }
        
        const arrayBuffer = await this.vault.readBinary(file);
        const mimeType = WhisperService.MIME_TYPES[file.extension.toLowerCase()];
        
        if (!mimeType) {
            throw new Error(`Unsupported MIME type for extension: ${file.extension}`);
        }
        
        return {
            blob: new Blob([arrayBuffer], { type: mimeType }),
            mimeType
        };
    }

    async transcribeFile(audioFile: TFile): Promise<string> {
        try {
            if (!this.apiKey) {
                throw new Error('OpenAI API key is required for transcription');
            }

            if (!WhisperService.isSupportedFormat(audioFile)) {
                throw new Error(`Unsupported audio format: ${audioFile.extension}`);
            }

            const { blob, mimeType } = await this.prepareAudioForTranscription(audioFile);
            console.log(`Processing file: ${audioFile.name} with MIME type: ${mimeType}`);

            const formData = new FormData();
            const extension = audioFile.extension.toLowerCase() === 'm4a' ? 'wav' : audioFile.extension;
            formData.append('file', blob, `${audioFile.basename}.${extension}`);
            formData.append('model', 'whisper-1');

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('OpenAI API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                throw new Error(errorData.error?.message || `Transcription failed with status ${response.status}`);
            }

            const result = await response.json();
            return result.text;
        } catch (error) {
            console.error('Detailed transcription error:', {
                fileName: audioFile.name,
                extension: audioFile.extension,
                error: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack
                } : error
            });
            throw error;
        }
    }
} 