import { App, TFile, Vault } from 'obsidian';
import { JournalingAssistantSettings } from '../types';

export interface IJournalService {
    updateSettings(settings: JournalingAssistantSettings): void;
    openTodaysJournal(): Promise<void>;
    summarizeJournalingSession(): Promise<void>;
    chatWithAI(): Promise<void>;
}

export interface IOpenAIService {
    updateSettings(settings: JournalingAssistantSettings): void;
    makeOpenAIRequest(prompt: string, onChunk?: (chunk: string) => void): Promise<string>;
}

export interface IWhisperService {
    setApiKey(apiKey: string): void;
    transcribeFile(audioFile: TFile): Promise<string>;
}

export interface ITranscriptionService {
    updateSettings(settings: JournalingAssistantSettings): void;
    transcribeRecordings(): Promise<void>;
}

export interface ISummarizationService {
    summarize(content: string, useStreaming?: boolean, onChunk?: (chunk: string) => void): Promise<string>;
} 