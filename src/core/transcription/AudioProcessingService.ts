import { TFile, Vault } from 'obsidian';

export class AudioProcessingService {
    constructor(private vault: Vault) {}

    async convertM4AtoWAV(file: TFile): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
        try {
            const arrayBuffer = await this.vault.readBinary(file);
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            const offlineContext = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );
            
            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineContext.destination);
            source.start(0);
            
            const renderedBuffer = await offlineContext.startRendering();
            return {
                buffer: this.createWAVFile(renderedBuffer),
                mimeType: 'audio/wav'
            };
        } catch (error) {
            console.error('Error converting M4A to WAV:', error);
            throw new Error('Failed to convert M4A to WAV format');
        }
    }

    private createWAVFile(audioBuffer: AudioBuffer): ArrayBuffer {
        const length = audioBuffer.length * 2;
        const outputBuffer = new ArrayBuffer(44 + length);
        const view = new DataView(outputBuffer);
        
        this.writeWAVHeader(view, length, audioBuffer);
        
        const data = new Float32Array(audioBuffer.getChannelData(0));
        let offset = 44;
        for (let i = 0; i < data.length; i++) {
            const sample = Math.max(-1, Math.min(1, data[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
        
        return outputBuffer;
    }

    private writeWAVHeader(view: DataView, length: number, audioBuffer: AudioBuffer): void {
        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, audioBuffer.numberOfChannels, true);
        view.setUint32(24, audioBuffer.sampleRate, true);
        view.setUint32(28, audioBuffer.sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length, true);
    }
} 