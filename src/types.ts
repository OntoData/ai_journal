export interface JournalingAssistantSettings {
    journalFolder: string;
    inputsFolder: string;
    openAIApiKey: string;
    defaultJournalingPrompt: string;
    defaultSummarizationPrompt: string;
    numberOfPastEntries: number;
}

export const DEFAULT_SETTINGS: JournalingAssistantSettings = {
    journalFolder: 'Journal',
    inputsFolder: 'Inputs',
    openAIApiKey: '',
    defaultJournalingPrompt: 'Generate a thought-provoking journaling prompt for today.',
    defaultSummarizationPrompt: 'Summarize the key points and insights from this journal entry.',
    numberOfPastEntries: 3,
}; 