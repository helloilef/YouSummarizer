from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import json
import re
import math

def chunk_transcript_for_mcq(transcript: str, video_duration_minutes: float):
    """Chunks transcript into proportional pieces: 2 chunks per hour."""
    num_chunks = max(1, int(math.ceil(2 * (video_duration_minutes / 60))))
    chunk_size = max(1, len(transcript) // num_chunks)
    return [
        transcript[i * chunk_size: (i + 1) * chunk_size]
        for i in range(num_chunks)
    ]

def generate_mcqs(llm, transcript: str, video_duration_minutes: float, num_questions_per_chunk: int = 4) -> list:
    chunks = chunk_transcript_for_mcq(transcript, video_duration_minutes)

    # Escape JSON braces by doubling them so PromptTemplate doesn't treat them as placeholders.
    prompt_template = """
You MUST output ONLY valid JSON (no markdown, no code fences).

Given the transcript chunk below, generate exactly {num_questions} multiple-choice questions.

Output schema (array of objects):
[
  {{
    "question": "string (one or two sentences)",
    "options": ["string","string","string","string"],   // exactly 4 options
    "answer_index": 0,                                 // integer 0-3
    "explanation": "string (1-2 sentences)"
  }}
]

Rules:
1. Exactly {num_questions} objects.
2. Exactly 4 distinct options per question. Do NOT prefix options with letters (A/B/C/D).
3. answer_index must be the zero-based index of the correct option.
4. Keep question, options, explanation concise.
5. Output ONLY the JSON array.

Transcript chunk:
{chunk}
"""

    # Make input_variables explicit to avoid surprises
    prompt = PromptTemplate(template=prompt_template, input_variables=["chunk", "num_questions"])
    chain = LLMChain(llm=llm, prompt=prompt)

    all_mcqs = []
    for chunk in chunks:
        # run with matching kwarg name
        raw = chain.run(chunk=chunk, num_questions=num_questions_per_chunk)

        # Try to extract the first JSON array from the model output (robust fallback)
        m = re.search(r'(\[\s*\{.*?\}\s*\])', raw, re.S)
        json_text = m.group(1) if m else raw

        try:
            parsed = json.loads(json_text)
        except Exception as e:
            # Debug output to help you see what the model returned
            print("Failed to parse MCQ JSON from LLM. Raw output below:")
            print(raw)
            raise

        # Validate and normalize to your frontend shape
        validated = []
        for i, item in enumerate(parsed):
            if (not isinstance(item, dict) or
                not isinstance(item.get("question"), str) or
                not isinstance(item.get("options"), list) or
                len(item["options"]) != 4 or
                not isinstance(item.get("answer_index"), int) or
                not 0 <= item["answer_index"] < 4):
                print(f"Skipping invalid MCQ at index {i}: {item}")
                continue
            validated.append({
                "question": item["question"].strip(),
                "options": [o.strip() for o in item["options"]],
                "correct": int(item["answer_index"]),
                "explanation": (item.get("explanation") or "").strip()
            })

        # append the validated MCQs for this chunk
        all_mcqs.append(validated)

    # Return list-of-lists (one list per chunk) to match how you already handle outputs
    return all_mcqs


def generate_flashcards(llm, transcript: str, video_duration_minutes: float, num_flashcards_per_chunk: int = 5) -> list:
    chunks = chunk_transcript_for_mcq(transcript, video_duration_minutes)

    prompt_template = """
Based on the transcript chunk below, generate exactly {num_flashcards} flashcards.
Format each as:
Q: <question>
A: <answer>

Rules:
- Exactly {num_flashcards} flashcards per chunk.
- Keep Q and A concise, factual, and directly tied to the chunk.
- Output plain text only, in the format shown (no extra commentary).

Transcript chunk:
{chunk}
"""

    prompt = PromptTemplate(template=prompt_template, input_variables=["chunk", "num_flashcards"])
    chain = LLMChain(llm=llm, prompt=prompt)

    all_flashcards = []
    for chunk in chunks:
        raw = chain.run(chunk=chunk, num_flashcards=num_flashcards_per_chunk)
        all_flashcards.append(raw.strip())

    return all_flashcards
