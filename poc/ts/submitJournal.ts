import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import * as readline from 'readline';
import { config as dotenvConfig } from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';

dotenvConfig();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID; // Not directly used in Node client config
if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
}

const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

const JOURNAL_DIR = "ai_journal";
const RAW_DIR = "ai_journal/raw";
const ATTACHMENT_DIR = "ai_journal/attachments";

const SUMMARIZE_PROMPT = `
Otrzymasz:

1. Zestaw pytań z dziennika AI oraz szczegółowe odpowiedzi na nie z bieżącego dnia.
2.Dodatkowe podsumowania z poprzednich dni (oznaczone jako "wczorajsze" lub "sprzed X dni"), które możesz traktować jedynie jako materiał referencyjny – nie są kluczowe, ale mogą pomóc w zrozumieniu kontekstu ewolucji myśli lub trendów.
Twoje zadanie:

Na podstawie otrzymanych bieżących pytań i odpowiedzi stwórz możliwie najbardziej wyczerpujące i precyzyjne podsumowanie zawartości.
Upewnij się, że w podsumowaniu nie pominiesz żadnego kluczowego faktu czy stwierdzenia – włącz wszystkie istotne informacje z bieżącego dnia.
Staraj się, aby rezultat był przydatny do dalszej analizy:
Zwróć uwagę na aspekty logiczne, zależności między pojęciami czy wnioskami.
Wskaż pojawiające się trendy, kontrowersje lub tematy wymagające dodatkowego zbadania.
Podsumowania z poprzednich dni wykorzystaj jedynie w charakterze uzupełnienia kontekstu. Nie musisz ich szczegółowo streszczać, ale możesz odnieść się do nich, jeśli pomaga to w lepszym zrozumieniu bieżących danych.
Styl i forma odpowiedzi:

Uporządkuj treść tematycznie lub logicznie, tak aby łatwo było prześledzić łańcuch wniosków.
Użyj precyzyjnego, klarownego języka i przedstaw fakty w sposób obiektywny, bez zbędnego wartościowania.
Jeśli to pomocne, stosuj listy punktowane, wypunktowania czy podział na sekcje.
Ostatecznie, w swojej odpowiedzi oczekuję wyważonego i kompletnego podsumowania, które stanie się przydatnym materiałem do dalszej, pogłębionej analizy zawartości dziennika AI.
Odpowiedź w języku polskim.
`;


function get_time_of_day(hour: number): string {
    if (hour < 12) {
        return "morning";
    } else if (hour < 19) {
        return "afternoon";
    } else {
        return "evening";
    }
}

function concatenate_recent_journal_entries(full_journal_path: string): string {
    const current_time = new Date();
    const journal_entries: string[] = [];

    const files = fs.readdirSync(full_journal_path);
    for (const filename of files) {
        const file_path = path.join(full_journal_path, filename);
        const stat = fs.statSync(file_path);
        if (stat.isFile()) {
            const match = filename.match(/(\d{4})-(\d{2})-(\d{2})\.md/);
            if (match) {
                const year = parseInt(match[1], 10);
                const month = parseInt(match[2], 10);
                const day = parseInt(match[3], 10);
                const file_date = new Date(year, month - 1, day);
                const diffTime = current_time.getTime() - file_date.getTime();
                const days_ago = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                // notes from 7 days ago exclude today
                if (0 < days_ago && days_ago <= 7) {
                    let days_ago_str: string;
                    if (days_ago === 1) {
                        days_ago_str = "yesterday";
                    } else {
                        days_ago_str = `${days_ago} days ago`;
                    }

                    const time_of_day = get_time_of_day(file_date.getHours());
                    const day_name = file_date.toLocaleDateString('en-US', { weekday: 'long' });

                    const content = fs.readFileSync(file_path, 'utf-8');
                    const annotated_content = `--- ${days_ago_str}, ${day_name}, ${time_of_day} ---\n${content}\n`;
                    journal_entries.push(annotated_content);
                }
            }
        }
    }

    return journal_entries.join("\n");
}

async function transcript(audio_file_path: string): Promise<string> {
    // For transcription using Whisper
    const response = await openai.createTranscription(
        fs.createReadStream(audio_file_path) as any, // cast if needed
        'whisper-1'
    );
    return response.data.text;
}

function m4a_to_mp3(m4a_file_path: string, mp3_file_path: string) {
    const m4a_file_escaped = `'${m4a_file_path.replace(/'/g, "'\\''")}'`;
    const mp3_file_escaped = `'${mp3_file_path.replace(/'/g, "'\\''")}'`;

    const command = `/opt/homebrew/bin/ffmpeg -y -i ${m4a_file_escaped} -codec:a libmp3lame -qscale:a 2 ${mp3_file_escaped}`;
    console.log(command);

    try {
        const { stdout, stderr } = child_process.execSync(command, { stdio: 'pipe' });
        console.log(`Conversion successful: ${mp3_file_path}`);
    } catch (error: any) {
        console.error("An error occurred during conversion:\n", error.stderr?.toString() || error.message);
    }
}

function* get_recordings(recording_loc_path: string, note_file_path: string): Generator<[string, string], void, unknown> {
    const text = fs.readFileSync(note_file_path, 'utf-8');
    const pattern = /!\[\[(Recording (\d{14})\.[a-z0-9]*)\]\]/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
        const filename = match[1];
        const timestamp_str = match[2];
        const timestamp = new Date(
            parseInt(timestamp_str.slice(0, 4), 10),
            parseInt(timestamp_str.slice(4, 6), 10) - 1,
            parseInt(timestamp_str.slice(6, 8), 10),
            parseInt(timestamp_str.slice(8, 10), 10),
            parseInt(timestamp_str.slice(10, 12), 10),
            parseInt(timestamp_str.slice(12, 14), 10)
        );

        const formatted_time = timestamp.toLocaleTimeString('en-US', { hour12: false });
        yield [path.join(recording_loc_path, filename), formatted_time];
    }
}

async function get_concatenated_transcript(recording_path: string, note_file_path: string): Promise<string> {
    /**
     * Returns a concatenated transcript of all recordings in a file with time annotations.
     */
    const transcripts: string[] = [];

    for (const [rec, time] of get_recordings(recording_path, note_file_path)) {
        console.log(`Processing ${rec}`);
        let recFile = rec;
        if (rec.endsWith('m4a')) {
            const mp3Path = rec + ".mp3";
            m4a_to_mp3(rec, mp3Path);
            recFile = mp3Path;
        }
        console.log("Sending to transcription");
        const transcript_text = await transcript(recFile);
        transcripts.push(`${time}:\n${transcript_text}\n`);
    }

    return "```\n" + transcripts.join("\n") + "```";
}

async function summarize_content(content: string): Promise<string> {
    const response = await openai.createChatCompletion({
        model: "o1-mini", // Ensure this model is valid or choose a known model like "gpt-3.5-turbo"
        messages: [
            { role: "user", content: SUMMARIZE_PROMPT + "\n\n" + content }
        ]
    });

    return response.data.choices?.[0]?.message?.content ?? '';
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("Usage: node main.js <vault_path> <file_path>");
        process.exit(1);
    }

    const vault_path = args[0];
    const file_path = args[1];

    const note_file_path = path.resolve(path.join(vault_path, file_path));
    const journal_dir = path.join(vault_path, JOURNAL_DIR);
    const attachment_dir = path.join(vault_path, ATTACHMENT_DIR);
    const raw_file_path = path.join(vault_path, RAW_DIR);

    console.log("Transcripting recordings");
    const concatenated_transcript = await get_concatenated_transcript(attachment_dir, note_file_path);

    console.log("Concatenating previous journals");
    const previous_journals = concatenate_recent_journal_entries(journal_dir);

    fs.copyFileSync(note_file_path, path.join(raw_file_path, path.basename(file_path)));

    const original_content = fs.readFileSync(note_file_path, 'utf-8');

    const full_content = original_content + "\n\n" + concatenated_transcript + "\n\n" + previous_journals;

    console.log("Summarizing content");
    const summary = await summarize_content(full_content);

    console.log("Saving to raw file");
    fs.writeFileSync(path.join(raw_file_path, path.basename(file_path)), full_content, { encoding: 'utf-8' });

    fs.writeFileSync(note_file_path, summary, { encoding: 'utf-8' });
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
