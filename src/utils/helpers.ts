import { TFile } from 'obsidian';

export const isSupportedAudioFormat = (file: TFile): boolean => {
    const supportedFormats = ['flac', 'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'ogg', 'wav', 'webm'];
    const extension = file.extension.toLowerCase();
    return supportedFormats.includes(extension);
};

export const getRecordingEmbedPattern = (): RegExp => {
    return /!\[\[.+\.(flac|mp3|mp4|mpeg|mpga|m4a|ogg|wav|webm)\]\]/g;
};

export const getTodayFileName = (): string => {
    const date = new Date();
    return date.toISOString().split('T')[0] + '.md'; // Format: YYYY-MM-DD.md
}; 