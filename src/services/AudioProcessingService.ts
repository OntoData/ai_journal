import { TFile, Vault } from 'obsidian';

export class AudioProcessingService {
    constructor(private vault: Vault) {}

    /**
     * Checks if the file format is directly supported by Whisper API
     * @see https://platform.openai.com/docs/api-reference/audio/createTranscription
     */
    static isSupportedFormat(file: TFile): boolean {
        const supportedFormats = ['flac', 'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'ogg', 'wav', 'webm'];
        const extension = file.extension.toLowerCase();
        return supportedFormats.includes(extension);
    }

    /**
     * Prepares audio file for transcription
     * Returns a Blob in a supported format
     */
    async prepareAudioForTranscription(file: TFile): Promise<{ blob: Blob; mimeType: string }> {
        const arrayBuffer = await this.vault.readBinary(file);
        const extension = file.extension.toLowerCase();
        
        // Map file extensions to MIME types
        const mimeTypes: { [key: string]: string } = {
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

        const mimeType = mimeTypes[extension];
        if (!mimeType) {
            throw new Error(`Unsupported MIME type for extension: ${extension}`);
        }

        return {
            blob: new Blob([arrayBuffer], { type: mimeType }),
            mimeType
        };
    }
} 