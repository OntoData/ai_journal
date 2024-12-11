# main.py
import os
import re
import sys
import shlex
import subprocess
import shutil
from datetime import datetime
from openai import OpenAI
from prompts import SUMMARIZE_PROMPT

from dotenv import load_dotenv
load_dotenv()

OPENAI_API_KEY = os.getenv["OPENAI_API_KEY"]
OPENAI_PROJECT_ID = os.environ["OPENAI_PROJECT_ID"]
JOURNAL_DIR = "ai_journal"
RAW_DIR = "ai_journal/raw"
ATTACHMENT_DIR = "ai_journal/attachments"

def get_time_of_day(hour):
    if hour < 12:
        return "morning"
    elif hour < 19:
        return "afternoon"
    else:
        return "evening"

def concatenate_recent_journal_entries(full_journal_path):
    current_time = datetime.now()
    journal_entries = []


    for filename in os.listdir(full_journal_path):
        file_path = os.path.join(full_journal_path, filename)
        if os.path.isfile(file_path):
            # Extract date from filename
            match = re.match(r"(\d{4})-(\d{2})-(\d{2})\.md", filename)
            if match:
                year, month, day = map(int, match.groups())
                file_date = datetime(year, month, day)
                days_ago = (current_time - file_date).days
                # notes from 7 days ago exclude today
                if 0 < days_ago <= 7:
                    if days_ago == 1:
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


def transcript(audio_file_path):

    client = OpenAI(project=OPENAI_PROJECT_ID,
                    api_key=OPENAI_API_KEY)

    audio_file = open(audio_file_path, "rb")

    transcription = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file
    )

    return transcription.text


def m4a_to_mp3(m4a_file_path, mp3_file_path):
    try:
        # Safely escape file paths to prevent shell injection
        m4a_file_escaped = shlex.quote(m4a_file_path)
        mp3_file_escaped = shlex.quote(mp3_file_path)

        # Construct the ffmpeg command as a string
        command = (
            f'/opt/homebrew/bin/ffmpeg -y -i {m4a_file_escaped} -codec:a libmp3lame '
            f'-qscale:a 2 {mp3_file_escaped}'
        )
        print(command)
        # Execute the command using Popen with shell=True
        process = subprocess.Popen(
            command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate()

        # Check if the process was successful
        if process.returncode == 0:
            print(f"Conversion successful: {mp3_file_path}")
        else:
            error_message = stderr.decode()
            print(f"An error occurred during conversion:\n{error_message}")

    except FileNotFoundError:
        print("ffmpeg is not installed or not found in system PATH.")


def get_recordings(recording_loc_path, note_file_path):
    # Read the content of the file
    with open(note_file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Regular expression pattern to find the target strings
    pattern = r"!\[\[(Recording (\d{14})\.[a-z0-9]*)\]\]"

    # Find all matches in the text
    matches = re.findall(pattern, text)

    # Process each match
    for match in matches:
        filename = match[0]  # e.g., "Recording 20241013153440.webm"
        timestamp_str = match[1]  # e.g., "20241013153440"

        # Parse the timestamp
        timestamp = datetime.strptime(timestamp_str, "%Y%m%d%H%M%S")

        # Format the time as HH:MM:SS
        formatted_time = timestamp.strftime("%H:%M:%S")

        # Output the result
        yield os.path.join(recording_loc_path, filename), formatted_time


def get_concatenated_transcript(recording_path, note_file_path):
    """
    Returns a concatenated transcript of all recordings in a file with time annotations.
    
    Args:
        vault_path (str): Path to the vault directory
        file_path (str): Path to the note file relative to vault_path
        
    Returns:
        str: Concatenated transcript with time annotations
    """
    RECORDING_DIR = recording_path
    
    transcripts = []
    
    for rec, time in get_recordings(RECORDING_DIR, note_file_path):
        print(f"Processing {rec}")
        if rec.endswith('m4a'):
            m4a_to_mp3(rec, rec + ".mp3")
            rec += ".mp3"
        print("Sending to transcription")
        transcript_text = transcript(rec)
        transcripts.append(f"{time}:\n{transcript_text}\n")
    
    return "```\n" + "\n".join(transcripts) + "```"


def summarize_content(content):
    """
    Summarizes the content using OpenAI's API.
    
    Args:
        content (str): The content to summarize
        
    Returns:
        str: The summarized content
    """
    client = OpenAI(project=OPENAI_PROJECT_ID,
                   api_key=OPENAI_API_KEY)

    response = client.chat.completions.create(
        model="o1-mini",
        messages=[
            {"role": "user", "content": SUMMARIZE_PROMPT + "\n\n" + content},
        ]
    )

    return response.choices[0].message.content

if __name__ == "__main__":
    file_path = sys.argv[2]
    vault_path = sys.argv[1]
    # file_path = "ai_journal/2024-12-09.md"
    # vault_path = "/Users/bkolasa/Library/Mobile Documents/iCloud~md~obsidian/Documents/bkolasa"
    note_file_path = os.path.abspath(os.path.join(vault_path, file_path))
    journal_dir = os.path.join(vault_path, JOURNAL_DIR)
    attachment_dir = os.path.join(vault_path, ATTACHMENT_DIR)
    raw_file_path = os.path.join(vault_path, RAW_DIR)
    
    # Get the transcript
    print("Transcripting recordings")
    concatenated_transcript = get_concatenated_transcript(attachment_dir, note_file_path)
    print("Concatenating previous journals")
    previous_journals = concatenate_recent_journal_entries(journal_dir)
    shutil.copy2(note_file_path, raw_file_path)
    # Read the original file content
    with open(note_file_path, 'r', encoding='utf-8') as f:
        original_content = f.read()
    
    # Combine original content with transcript
    full_content = original_content + "\n\n" + concatenated_transcript + "\n\n" + previous_journals
    
    # Get the summary
    print("Summarizing content")
    summary = summarize_content(full_content)
    
    # Save to raw file
    print("Saving to raw file")
    with open(os.path.join(raw_file_path, os.path.basename(file_path)), 'w', encoding='utf-8') as target:
        target.write(full_content)

    with open(note_file_path, 'w', encoding='utf-8') as target:
        target.write(summary)


