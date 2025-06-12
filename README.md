# Youtube Smart Note Summarizer

Turn any YouTube video into structured study notes, MCQs, and spaced repetition flashcards — instantly.

## Features

- 🧠 AI-generated summaries and bullet notes
- ❓ Auto-generated MCQs for active recall
- ⏱️ Spaced repetition scheduling
- 📥 Export to Markdown, Notion, or PDF
- 📺 Works with any YouTube link (lecture, podcast, tutorial, etc.)

- ## 🛠 Tech Stack (Open Source & Free)

- **Frontend**: Next.js + Tailwind CSS
- **Backend**: Django + Django REST Framework
- **AI**:
  - Summarizer: Hugging Face `T5` / `BART` via transformers
  - MCQ Generator: `qg-transformers` or custom logic with SpaCy/NLTK
  - Transcription: `youtube-transcript-api`
- **Database**: PostgreSQL
- **Export**: WeasyPrint (PDF), Markdown, Notion (optional)
