# main.py
import os
import re
import sys
from datetime import datetime

from dotenv import load_dotenv
from openai import OpenAI
load_dotenv()

OPENAI_API_KEY = os.getenv["OPENAI_API_KEY"]
OPENAI_PROJECT_ID = os.environ["OPENAI_PROJECT_ID"]
AI_JOURNAL_DIR = "ai_journal"

INITIAL_PROMPT = """
Pełnisz rolę mojego przyjaciela i asystenta do refleksji w dzienniku. Chcę, abyś zadał mi serię pytań (około 10), które pomogą mi spojrzeć na dzisiejszy dzień z wielu perspektyw. W swojej odpowiedzi:

Zadaj 3 pytania dotyczące moich bieżących emocji i samopoczucia.
Zadaj 3 pytania związane z ważnymi wydarzeniami dzisiejszego dnia – za co jestem wdzięczny, co było smutne, co ekscytujące.
Zadaj 2 pytania nawiązujące do treści z poprzednich dni mojego dziennika, tak aby pomóc mi zobaczyć ciągłość lub zmiany w moich przeżyciach.
Zadaj 2 pytania kreatywne, które pomogą mi z innej perspektywy spojrzeć na te doświadczenia (np. wyobrażenie sobie przyszłości, hipotetyczne scenariusze).
Pamiętaj, by brzmieć serdecznie, personalnie i empatycznie.
"""

def reflect_on_journal(previous_notes_content, model_name='gpt-4o'):
    client = OpenAI(api_key=OPENAI_API_KEY, project=OPENAI_PROJECT_ID)
    prompt = INITIAL_PROMPT + "\n\n" + previous_notes_content

    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "user", "content": prompt}
        ],
        max_tokens=2000,
        temperature=0.7
    )

    return response.choices[0].message.content

def get_time_of_day(hour):
    if hour < 12:
        return "morning"
    elif hour < 19:
        return "afternoon"
    else:
        return "evening"

def concatenate_recent_journal_entries(vault_file_path):
    current_time = datetime.now()
    journal_entries = []

    # Construct the full path to the AI_JOURNAL_DIR within the vault
    full_journal_path = os.path.join(vault_file_path, AI_JOURNAL_DIR)

    for filename in os.listdir(full_journal_path):
        file_path = os.path.join(full_journal_path, filename)
        if os.path.isfile(file_path):
            # Extract date from filename
            match = re.match(r"(\d{4})-(\d{2})-(\d{2})\.md", filename)
            if match:
                year, month, day = map(int, match.groups())
                file_date = datetime(year, month, day)
                days_ago = (current_time - file_date).days

                if days_ago <= 7:
                    if days_ago == 0:
                        days_ago_str = "today"
                    elif days_ago == 1:
                        days_ago_str = "yesterday"
                    else:
                        days_ago_str = f"{days_ago} days ago"

                    time_of_day = get_time_of_day(file_date.hour)
                    day_name = file_date.strftime("%A")

                    with open(file_path, "r", encoding='utf-8') as file:
                        content = file.read()
                        annotated_content = f"--- {days_ago_str}, {day_name}, {time_of_day} ---\n{content}\n"
                        journal_entries.append(annotated_content)

    return "\n".join(journal_entries)



if __name__ == "__main__":
    # Assuming the vault path is provided or set somewhere in your application
    # vault_path = "/Users/bkolasa/Library/Mobile Documents/iCloud~md~obsidian/Documents/bkolasa"
    vault_path = sys.argv[1]
    current_note_path = sys.argv[2]
    
    # Prepend vault_path to current_note_path
    full_current_note_path = os.path.join(vault_path, current_note_path)
    
    recent_journal_entries = concatenate_recent_journal_entries(vault_path)
    #Get the reflection
    reflection = reflect_on_journal(recent_journal_entries)
    #Write the reflection to the current note
    with open(full_current_note_path, "w", encoding='utf-8') as file:
        file.write(reflection)
        file.write("\n\n")
        file.write("------ ODPOWIEDZI ------\n")
