'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Navbar from "@/components/Navbar/page";
import RAGQuery from '@/components/RAG/page';
import { supabase } from '@/lib/supabaseClient';
import jsPDF from "jspdf";
import { useRouter } from 'next/navigation';
import { 
  Brain, 
  FileText, 
  Download, 
  Play, 
  Clock, 
  CheckCircle, 
  BookOpen,
  Target,
  Zap,
  Youtube,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Users,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function extractVideoId(url: string): string | null {
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : null;
}

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [mcqs, setMcqs] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [user, setUser] = useState<{ email: string; picture?: string } | null>(null);

  // SUPABASE auth helpers (client-side)
  useEffect(() => {
    // check existing session on mount
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const session = data?.session;
      if (session?.user) {
        setUser({
          email: session.user.email || '',
          picture: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || ''
        });
      }
    }).catch(() => { /* ignore */ });

    // subscribe to auth changes (sign in / sign out)
    const listenerPromise = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email || '',
          picture: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || ''
        });
      } else {
        setUser(null);
      }
    });

    // handle unsubscribe for v2/v1 shape
    let unsubscribe: (() => void) | null = null;
    try {
      // v2 returns { data: { subscription } }
      // v1 returns { subscription }
      const maybe = (listenerPromise as any);
      const sub = maybe?.data?.subscription || maybe?.subscription;
      if (sub?.unsubscribe) {
        unsubscribe = () => sub.unsubscribe();
      } else if (sub?.unsubscribe === undefined && sub) {
        // fallback: try calling remove()
        unsubscribe = () => sub.remove && sub.remove();
      }
    } catch (e) {
      // ignore
    }

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
    });
    if (error) {
      setError(error.message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

 // REPLACE your existing handleSubmit with this
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  if (!youtubeUrl.trim()) return;

  setIsProcessing(true);
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) {
    setError('Invalid YouTube URL');
    setIsProcessing(false);
    return;
  }

  try {
    // Require a signed-in user
    const sessionResp = await supabase.auth.getSession();
    const token = sessionResp?.data?.session?.access_token;

    if (!token) {
      // Kick off Google OAuth sign-in if not signed in.
      // This will redirect the user; stop processing.
      setIsProcessing(false);
      setError('You must sign in with Google to generate notes. Redirecting to sign-in...');
      await signInWithGoogle();
      return;
    }

    // If token exists, include it
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    const headers: Record<string,string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 1) Get summary/transcript
    const res = await fetch(`${base}/transcript`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ video_id: videoId }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setIsProcessing(false);
      return;
    }
    setTranscript(data.transcript || '');
    setSummary(data.summary || '');

    // 2) Get MCQs + flashcards
    const mcqFlashRes = await fetch(`${base}/mcq-flashcards`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ video_id: videoId }),
    });
    const mcqFlashData = await mcqFlashRes.json();
    if (mcqFlashData.error) {
      setError(mcqFlashData.error);
      setIsProcessing(false);
      return;
    }
    setMcqs(mcqFlashData.mcqs || []);
    setFlashcards(mcqFlashData.flashcards || []);

    setHasResults(true);
    setIsProcessing(false);
  } catch (err) {
    console.error(err);
    setError('An error occurred while processing the video.');
    setIsProcessing(false);
  }
};


  if (hasResults) {
    return <ResultsView summary={summary} transcript={transcript} mcqs={mcqs} flashcards={flashcards}/>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="text-center py-20 px-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Badge variant="secondary" className="px-4 py-2 bg-purple-100 text-purple-700 border-purple-200">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Learning
          </Badge>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent">
          Turn YouTube Videos into
          <br />
          <span className="text-slate-900">Smart Study Notes</span>
        </h1>
        
        <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          Transform any YouTube video into structured study notes, interactive MCQs, and spaced repetition flashcards. 
          Master any subject with AI-powered learning tools designed for modern students.
        </p>

        {/* URL Input */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="flex justify-end mb-3">
            {user ? (
              <div className="flex items-center gap-3">
                {user.picture && <img src={user.picture} alt={user.email} className="w-8 h-8 rounded-full" />}
                <div className="text-sm text-slate-700 mr-2">{user.email}</div>
                <Button size="sm" variant="outline" onClick={signOut}>Sign out</Button>
              </div>
            ) : (
              <Button size="sm" onClick={signInWithGoogle}>Sign in with Google</Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-4 p-2 bg-white rounded-2xl shadow-lg border border-slate-200">
            <Input
              type="url"
              placeholder="Paste any YouTube URL here..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="flex-1 border-0 focus-visible:ring-0 text-lg px-6 py-4 bg-transparent"
              disabled={isProcessing}
            />
            <Button 
              type="submit" 
              size="lg" 
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isProcessing || !youtubeUrl.trim()}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  Generate Notes
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
          
          <p className="text-sm text-slate-500 mt-3">
            Works with lectures, podcasts, tutorials, and any educational content
          </p>
        </div>

        {/* Feature Cards */}
        <div id="features" className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className="text-left hover:shadow-lg transition-shadow duration-200 border-0 bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">AI Summaries</CardTitle>
              <CardDescription>
                Get structured bullet points and key insights extracted from any video content
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-left hover:shadow-lg transition-shadow duration-200 border-0 bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Smart MCQs</CardTitle>
              <CardDescription>
                Practice with auto-generated multiple choice questions for active recall learning
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-left hover:shadow-lg transition-shadow duration-200 border-0 bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Spaced Repetition</CardTitle>
              <CardDescription>
                Flashcards with intelligent scheduling to maximize long-term retention
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900 mb-2">10K+</div>
            <div className="text-slate-600">Videos Processed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900 mb-2">98%</div>
            <div className="text-slate-600">Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900 mb-2">5K+</div>
            <div className="text-slate-600">Happy Students</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ResultsView({summary, transcript, mcqs,flashcards}: {summary: string, transcript: string, mcqs: any[], flashcards: any[]}) {
  const [currentMCQ, setCurrentMCQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [studyProgress, setStudyProgress] = useState(65);
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
   const router = useRouter();

  const handleDownloadPDF = () => {
  const doc = new jsPDF();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  console.log("hello")
  doc.text("AI-Generated Summary", 10, 10);
  const lines = doc.splitTextToSize(summary, 180); // wrap text within page width
  doc.text(lines, 10, 20);

  doc.save("summary.pdf");
};
  // Schedule state
  const [tasks, setTasks] = useState([
    // Example initial tasks
    { title: "Initial Review", date: "Today", status: "Done" },
    { title: "First Review", date: "3 Days", status: "Due Soon" },
    { title: "Second Review", date: "1 Week", status: "Scheduled" }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('Scheduled');

  // Add new task handler
  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    setTasks([
      ...tasks,
      { title: newTaskTitle, date: newTaskDate || "No Date", status: newTaskStatus }
    ]);
    setNewTaskTitle('');
    setNewTaskDate('');
    setNewTaskStatus('Scheduled');
  };
    // ----- Helper functions & persistence (paste here) -----
  // Normalize incoming date to ISO (if possible) and return an ISO date string or the original string
  function normalizeDateInput(dateStr) {
    if (!dateStr) return '';
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString(); // store ISO so comparisons/sorting work reliably
    }
    // fallback: try to accept human-friendly tokens like "Today", "Tomorrow"
    const lowered = dateStr.toLowerCase().trim();
    if (lowered === 'today') return new Date().toISOString();
    if (lowered === 'tomorrow') { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString(); }
    return dateStr; // give up, keep raw
  }

  // Compute useful stats used by the schedule UI
  function computeStats(tasksList) {
    const total = tasksList.length;
    const doneTasks = tasksList.filter(t => t.status === 'Done');
    const doneCount = doneTasks.length;
    const completionPercentage = total === 0 ? 0 : (doneCount / total) * 100;

    // Upcoming within next 7 days (works when dates are ISO or parseable)
    const now = new Date();
    const upcoming = tasksList
      .map(t => ({ ...t, _parsed: new Date(t.date) }))
      .filter(t => !isNaN(t._parsed) && (t._parsed - now) / (1000*60*60*24) >= 0 && (t._parsed - now) / (1000*60*60*24) <= 7)
      .sort((a,b) => a._parsed - b._parsed);

    // Streak (consecutive days up to today with at least one Done)
    const datesWithDone = Array.from(new Set(
      doneTasks
        .map(t => {
          const d = new Date(t.date);
          return isNaN(d.getTime()) ? null : d.toISOString().slice(0,10);
        })
        .filter(Boolean)
    )).sort().reverse();

    let streak = 0;
    let day = new Date();
    while (true) {
      const key = day.toISOString().slice(0,10);
      if (datesWithDone.includes(key)) {
        streak++;
        day.setDate(day.getDate() - 1);
      } else {
        break;
      }
    }

    // donePerDay: last 7 days counts
    const donePerDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      const count = tasksList.filter(t => {
        const d2 = new Date(t.date);
        return !isNaN(d2.getTime()) && d2.toISOString().slice(0,10) === key && t.status === 'Done';
      }).length;
      donePerDay.push({ day: d.toLocaleDateString(undefined, { weekday: 'short' }), done: count });
    }

    return {
      total,
      doneCount,
      completionPercentage,
      upcoming,
      streakDays: streak,
      donePerDay
    };
  }

  // Persist tasks to localStorage & load them on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('you_summarizer_tasks_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTasks(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load saved tasks', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('you_summarizer_tasks_v1', JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save tasks', e);
    }
  }, [tasks]);

  // Optional: improve addTask to normalize stored date
  const addTaskNormalized = () => {
    if (!newTaskTitle.trim()) return;
    const normalizedDate = normalizeDateInput(newTaskDate);
    setTasks([
      ...tasks,
      { title: newTaskTitle.trim(), date: normalizedDate || "No Date", status: newTaskStatus }
    ]);
    setNewTaskTitle('');
    setNewTaskDate('');
    setNewTaskStatus('Scheduled');
  };
  // You can either switch your Add button to call addTaskNormalized, or keep addTask.
  // (To switch: replace onClick={addTask} with onClick={addTaskNormalized} on the Add button.)
  // ----- end helper block -----


  const normalizedQuestions = mcqs.map((q: any) => {
    const correctIndex =
      typeof q.correct === 'number'
        ? q.correct
        : Array.isArray(q.options)
        ? q.options.findIndex((opt: string) => opt === (q.Answer || q.answer))
        : -1;
    return {
      question: q.Question || q.question,
      options: q.options || [],
      correct: correctIndex,
      explanation: q.Explanation || q.explanation || '',
    };
  });

  const questions = normalizedQuestions; // No fallback!);

  const currentQuestion = questions[currentMCQ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
                <TabsTrigger value="summary" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="mcq" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  MCQs
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Cards
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Schedule
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-6">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      AI-Generated Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose max-w-none">
  <div className="space-y-4">
    <div>
      {(() => {
        const lines = summary.split('\n');
        const paragraphLines = lines.filter(line => !line.trim().startsWith('-') && !line.trim().startsWith('•') && line.trim() !== '');
        const bulletPoints = lines.filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
        return (
          <>
            {paragraphLines.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
            {bulletPoints.length > 0 && (
              <ul>
                {bulletPoints.map((point, idx) => (
                  <li key={idx}>{point.replace(/^[-•]\s*/, '')}</li>
                ))}
              </ul>
            )}
          </>
        );
      })()}
    </div>
    <Separator />
     {/* TODO: Implement RAGQuery or import it if available */}
     {/* <RAGQuery transcript={transcript} /> */}
     <RAGQuery transcript={transcript} />
  </div>
</CardContent>
                </Card>
              </TabsContent>

<TabsContent value="mcq" className="mt-6">
  <Card className="bg-white shadow-sm">
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Practice Questions
        </CardTitle>
        <Badge variant="outline">
          {questions.length > 0 ? `${currentMCQ + 1} of ${questions.length}` : "No MCQs"}
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      {questions.length === 0 ? (
        <div className="text-center text-slate-500">No MCQs generated.</div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
            <div className="space-y-3">
              {currentQuestion.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedAnswer(index);
                    setShowExplanation(true);
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedAnswer === null
                      ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      : selectedAnswer === index
                      ? index === currentQuestion.correct
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-red-500 bg-red-50 text-red-800'
                      : index === currentQuestion.correct
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                  disabled={selectedAnswer !== null}
                >
                  <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              ))}
            </div>
          </div>
          {showExplanation && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Explanation</h4>
              <p className="text-blue-800">{currentQuestion.explanation}</p>
            </div>
          )}
          {selectedAnswer !== null && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedAnswer(null);
                  setShowExplanation(false);
                  setCurrentMCQ(Math.max(0, currentMCQ - 1));
                }}
                disabled={currentMCQ === 0}
              >
                Previous
              </Button>
              <Button
                onClick={() => {
                  setSelectedAnswer(null);
                  setShowExplanation(false);
                  setCurrentMCQ(Math.min(questions.length - 1, currentMCQ + 1));
                }}
                disabled={currentMCQ === questions.length-1 }
              >
                Next Question
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>

<TabsContent value="flashcards" className="mt-6">
  <Card className="bg-white shadow-sm">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-purple-600" />
        Flashcards
      </CardTitle>
    </CardHeader>
    <CardContent>
      {flashcards.length === 0 ? (
        <div className="text-center text-slate-500">No flashcards generated.</div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          {/* Increased width & height */}
          <div className="w-96 md:w-[40rem] h-56 md:h-72 bg-gradient-to-br from-purple-100 to-blue-100 border-2 border-dashed border-purple-300 rounded-lg flex flex-col justify-start items-start p-6 mb-2">
            <div className="font-semibold text-lg md:text-2xl mb-3 w-full">
              {flashcards[currentFlashcard].question}
            </div>

            {showAnswer ? (
              <div className="text-slate-700 p-4 min-h-[140px] md:min-h-[220px] w-full overflow-auto text-base md:text-lg">
                {flashcards[currentFlashcard].answer}
              </div>
            ) : (
              <div className="w-full flex justify-center mt-4">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => setShowAnswer(true)}>
                  Show Answer
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              disabled={currentFlashcard === 0}
              onClick={() => {
                setCurrentFlashcard(currentFlashcard - 1);
                setShowAnswer(false);
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={currentFlashcard === flashcards.length - 1}
              onClick={() => {
                setCurrentFlashcard(currentFlashcard + 1);
                setShowAnswer(false);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>



              <TabsContent value="schedule" className="mt-6">
  <Card className="bg-white shadow-sm">
    <CardHeader className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-green-600" />
        Study Schedule
      </CardTitle>

      {/* Stats header */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-600">
          <div>Total: <span className="font-semibold">{tasks.length}</span></div>
          <div>Done: <span className="font-semibold">{tasks.filter(t=>t.status==='Done').length}</span></div>
        </div>
        <div className="w-28 h-28">
          {/* Simple circular progress (tailwind + inline style) */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="absolute" viewBox="0 0 36 36" width="112" height="112">
              <path stroke="#e6e6e6" strokeWidth="4" fill="none" d="M18 2.0845a15.9155 15.9155 0 1 0 0 31.831 15.9155 15.9155 0 1 0 0-31.831"/>
              <path stroke="#10b981" strokeWidth="4" strokeLinecap="round" fill="none"
                    strokeDasharray={`${(computeStats(tasks).completionPercentage/100)*100} 100`} d="M18 2.0845a15.9155 15.9155 0 1 0 0 31.831 15.9155 15.9155 0 1 0 0-31.831"/>
            </svg>
            <div className="relative text-center">
              <div className="text-sm text-slate-500">Done</div>
              <div className="text-lg font-semibold">{Math.round(computeStats(tasks).completionPercentage)}%</div>
            </div>
          </div>
        </div>
      </div>
    </CardHeader>

    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Add Task + list */}
        <div className="md:col-span-2 space-y-4">
          {/* Add Task Form: same as yours */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Task name"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Date/Time"
              value={newTaskDate}
              onChange={e => setNewTaskDate(e.target.value)}
              className="w-36"
            />
            <select
              value={newTaskStatus}
              onChange={e => setNewTaskStatus(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Due Soon">Due Soon</option>
              <option value="Done">Done</option>
            </select>
            <Button onClick={addTask} size="sm" className="bg-green-600 text-white">
              Add
            </Button>
          </div>

          {/* Task list (kept your rendering but slightly tightened) */}
          {tasks.map((task, idx) => (
            <div key={idx} className={`flex items-center justify-between p-4 rounded-lg
              ${task.status === "Done" ? "bg-green-50 border border-green-200" : ""}
              ${task.status === "Due Soon" ? "bg-blue-50 border border-blue-200" : ""}
              ${task.status === "Scheduled" ? "bg-slate-50 border border-slate-200" : ""}
            `}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center
                  ${task.status === "Done" ? "bg-green-600 text-white" : ""}
                  ${task.status === "Due Soon" ? "bg-blue-600 text-white" : ""}
                  ${task.status === "Scheduled" ? "bg-slate-400 text-white" : ""}
                `}>
                  {task.status === "Done" ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                </div>
                <div>
                  <p className={`font-medium ${task.status === "Done" ? "text-green-900" : task.status === "Due Soon" ? "text-blue-900" : "text-slate-700"}`}>
                    {task.date} - {task.title}
                  </p>
                  <p className={`text-sm ${task.status === "Done" ? "text-green-700" : task.status === "Due Soon" ? "text-blue-700" : "text-slate-600"}`}>
                    {task.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={task.status}
                  onChange={e => {
                    const updatedTasks = [...tasks];
                    updatedTasks[idx] = { ...task, status: e.target.value };
                    setTasks(updatedTasks);
                  }}
                  className="border rounded px-2 py-1"
                >
                  <option value="Done">Done</option>
                  <option value="Due Soon">Due Soon</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
                <Badge className={
                  task.status === "Done" ? "bg-green-600" :
                  task.status === "Due Soon" ? "border-blue-600 text-blue-600" :
                  "bg-slate-200 text-slate-700"
                }>
                  {task.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Right: small stats + chart */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-slate-500">Streak</div>
            <div className="text-xl font-semibold">{computeStats(tasks).streakDays} days</div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="text-sm text-slate-500 mb-2">Upcoming (next 7 days)</div>
            <ul className="text-sm space-y-2">
              {computeStats(tasks).upcoming.slice(0,5).map((t,i) => (
                <li key={i} className="text-slate-700">{t.date} — {t.title}</li>
              ))}
              {computeStats(tasks).upcoming.length === 0 && <li className="text-slate-400">No upcoming tasks</li>}
            </ul>
          </div>

          <div className="p-2 border rounded-lg h-44">
            <div className="text-sm text-slate-500 mb-2">Done per day (last 7)</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={computeStats(tasks).donePerDay}>
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="done" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/*}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Study Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Progress</span>
                      <span>{studyProgress}%</span>
                    </div>
                    <Progress value={studyProgress} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">8</div>
                      <div className="text-xs text-slate-600">Cards Mastered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">12</div>
                      <div className="text-xs text-slate-600">Still Learning</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card> 

            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Markdown
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Send to Notion
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>*/}

            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-6 text-center">
                <Zap className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-purple-900 mb-2">Ready for your next video?</h3>
                <p className="text-sm text-purple-700 mb-4">Process another YouTube video to continue learning</p>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => router.push('/')}>
                  
      Add New Video
      </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}