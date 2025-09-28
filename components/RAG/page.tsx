'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RAGQuery({ transcript }: { transcript: string }) {
  const [question, setQuestion] = useState('');
  const [ragAnswer, setRagAnswer] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleRAGQuery = async () => {
    if (!question.trim()) return; // don’t send empty queries
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
      const res = await fetch(`${base}/rag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, query: question }),
      });
      const data = await res.json();
      setRagAnswer(data.answer || 'No answer returned.');
    } catch (err) {
      setRagAnswer('Error calling RAG pipeline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-2">
        <Input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about the transcript..."
        />
        <Button
          onClick={handleRAGQuery}
          disabled={loading}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg"
        >
          {loading ? "Thinking..." : "Ask AI"}
        </Button>
      </div>

      {ragAnswer && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900 whitespace-pre-line">{ragAnswer}</p>
        </div>
      )}
    </div>
  );
}
