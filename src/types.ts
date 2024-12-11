export interface JournalingAssistantSettings {
    journalFolder: string;
    summariesFolder: string;
    openAIApiKey: string;
    whisperApiKey: string;
    defaultJournalingPrompt: string;
    defaultSummarizationPrompt: string;
    numberOfPastEntries: number;
}

export const DEFAULT_SETTINGS: JournalingAssistantSettings = {
    journalFolder: 'Journal',
    summariesFolder: 'Summaries',
    openAIApiKey: '',
    whisperApiKey: '',
    defaultJournalingPrompt: 'Generate a thought-provoking journaling prompt for today.',
    defaultSummarizationPrompt: 'Summarize the key points and insights from this journal entry.',
    numberOfPastEntries: 3,
}; 