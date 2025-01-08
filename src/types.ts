export interface JournalingAssistantSettings {
    journalFolder: string;
    inputsFolder: string;
    openAIApiKey: string;
    numberOfPastEntries: number;
    useStreamingResponse: boolean;
    useCustomPrompts: boolean;
    language: 'en' | 'pl';
    customPromptPaths: {
        journal: string;
        chat: string;
        summary: string;
    };
}

export const DEFAULT_SETTINGS: JournalingAssistantSettings = {
    journalFolder: 'Journal',
    inputsFolder: 'Inputs',
    openAIApiKey: '',
    numberOfPastEntries: 3,
    useStreamingResponse: true,
    useCustomPrompts: false,
    language: 'en',
    customPromptPaths: {
        journal: '',
        chat: '',
        summary: ''
    }
}; 