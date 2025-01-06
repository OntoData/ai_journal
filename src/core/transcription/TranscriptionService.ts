import { Notice, MarkdownView, TFile } from 'obsidian';
import { WhisperService } from '../ai/services/WhisperService';
import { ITranscriptionService } from '../../interfaces';
import { JournalingAssistantSettings } from '../../types';
import { getRecordingEmbedPattern, isSupportedAudioFormat } from '../../utils/helpers';
import type { App } from 'obsidian';

export class TranscriptionService implements ITranscriptionService {
    private whisperService: WhisperService;

    constructor(
        private app: App,
        private settings: JournalingAssistantSettings
    ) {
        this.whisperService = new WhisperService(this.app.vault, this.settings.openAIApiKey);
    }

    updateSettings(settings: JournalingAssistantSettings) {
        this.settings = settings;
        this.whisperService.setApiKey(settings.openAIApiKey);
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
        const recordingPattern = getRecordingEmbedPattern();
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
                const fileName = recording.slice(3, -2);
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