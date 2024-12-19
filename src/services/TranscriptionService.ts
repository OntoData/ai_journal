import { Notice, MarkdownView, TFile } from 'obsidian';
import { WhisperService } from './WhisperService';
import type { App } from 'obsidian';
import type { JournalingAssistantSettings } from '../types';

export class TranscriptionService {
    private whisperService: WhisperService;

    constructor(
        private app: App,
        private settings: JournalingAssistantSettings
    ) {
        this.whisperService = new WhisperService(this.app.vault, this.settings.openAIApiKey);
    }

    /**
     * Returns a RegExp pattern that matches Obsidian's embed syntax for supported audio formats
     * @see https://platform.openai.com/docs/api-reference/audio/createTranscription
     */
    static getRecordingEmbedPattern(): RegExp {
        return /!\[\[.+\.(flac|mp3|mp4|mpeg|mpga|m4a|ogg|wav|webm)\]\]/g;
    }

    async transcribeRecordings(): Promise<void> {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            new Notice('Please open a note first');
            return;
        }

        if (!this.settings.openAIApiKey) {
            new Notice('OpenAI API key not configured');
            return;
        }

        const editor = activeView.editor;
        const content = editor.getValue();
        const recordingPattern = TranscriptionService.getRecordingEmbedPattern();
        const recordings = content.match(recordingPattern);

        if (!recordings || recordings.length === 0) {
            new Notice('No recordings found in the current note');
            return;
        }

        new Notice('Starting transcription...');

        let updatedContent = content;
        let hasErrors = false;

        try {
            for (const recording of recordings) {
                const fileName = recording.slice(3, -2); // Remove ![[...]]
                const file = this.app.metadataCache.getFirstLinkpathDest(fileName, "");
                
                if (!(file instanceof TFile)) {
                    new Notice(`Could not find file: ${fileName}`);
                    hasErrors = true;
                    continue;
                }

                try {
                    const transcript = await this.whisperService.transcribeFile(file);
                    updatedContent = updatedContent.replace(recording, transcript);
                } catch (error) {
                    new Notice(`Failed to transcribe ${fileName}: ${error.message}`);
                    hasErrors = true;
                    continue;
                }
            }

            editor.setValue(updatedContent);
            
            if (hasErrors) {
                new Notice('Transcription completed with some errors');
            } else {
                new Notice('Transcription completed successfully');
            }
        } catch (error) {
            new Notice(`Transcription failed: ${error.message}`);
            console.error('Transcription error:', error);
        }
    }
} 