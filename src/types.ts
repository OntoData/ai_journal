export interface JournalingAssistantSettings {
    journalFolder: string;
    inputsFolder: string;
    openAIApiKey: string;
    numberOfPastEntries: number;
    useStreamingResponse: boolean;
}

export const DEFAULT_SETTINGS: JournalingAssistantSettings = {
    journalFolder: 'Journal',
    inputsFolder: 'Inputs',
    openAIApiKey: '',
    numberOfPastEntries: 3,
    useStreamingResponse: true,
}; 