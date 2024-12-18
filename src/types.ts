export interface JournalingAssistantSettings {
    journalFolder: string;
    inputsFolder: string;
    openAIApiKey: string;
    numberOfPastEntries: number;
}

export const DEFAULT_SETTINGS: JournalingAssistantSettings = {
    journalFolder: 'Journal',
    inputsFolder: 'Inputs',
    openAIApiKey: '',
    numberOfPastEntries: 3,
}; 