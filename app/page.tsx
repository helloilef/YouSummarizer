'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setHasResults(true);
    }, 3000);
  };

  if (hasResults) {
    return <ResultsView />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            NoteAI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost">Features</Button>
          <Button variant="ghost">Pricing</Button>
          <Button variant="outline">Sign In</Button>
        </div>
      </nav>

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
        <div className="grid md:grid-cols-3 gap-8 mb-20">
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

function ResultsView() {
  const [currentMCQ, setCurrentMCQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [studyProgress, setStudyProgress] = useState(65);

  const sampleMCQs = [
    {
      question: "What is the primary benefit of spaced repetition in learning?",
      options: [
        "It makes studying faster",
        "It improves long-term retention",
        "It reduces study time",
        "It makes content easier"
      ],
      correct: 1,
      explanation: "Spaced repetition leverages the spacing effect to combat forgetting and improve long-term retention by reviewing material at increasing intervals."
    },
    {
      question: "According to the video, what percentage of information is typically forgotten within 24 hours?",
      options: ["30%", "50%", "70%", "90%"],
      correct: 2,
      explanation: "Research shows that approximately 70% of new information is forgotten within 24 hours without reinforcement."
    }
  ];

  const currentQuestion = sampleMCQs[currentMCQ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">Learning with Spaced Repetition</h1>
              <p className="text-sm text-slate-600">Duration: 15:42 • Processed in 3.2s</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              View Notes
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
                        <h3 className="font-semibold text-slate-900 mb-2">Key Concepts</h3>
                        <ul className="space-y-2 text-slate-700">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            Spaced repetition is a learning technique that involves reviewing information at increasing intervals
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            The spacing effect shows that distributed practice is more effective than massed practice
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            Optimal intervals follow the forgetting curve to maximize retention efficiency
                          </li>
                        </ul>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Main Points</h3>
                        <div className="space-y-3 text-slate-700">
                          <p>
                            <strong>1. The Forgetting Curve:</strong> Hermann Ebbinghaus discovered that we forget approximately 
                            70% of new information within 24 hours without reinforcement.
                          </p>
                          <p>
                            <strong>2. Optimal Timing:</strong> The most effective review intervals are 1 day, 3 days, 1 week, 
                            2 weeks, and 1 month after initial learning.
                          </p>
                          <p>
                            <strong>3. Active Recall:</strong> Testing yourself instead of passive review significantly 
                            improves long-term retention and understanding.
                          </p>
                        </div>
                      </div>
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
                        {currentMCQ + 1} of {sampleMCQs.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
                        <div className="space-y-3">
                          {currentQuestion.options.map((option, index) => (
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
                              setCurrentMCQ(Math.min(sampleMCQs.length - 1, currentMCQ + 1));
                            }}
                            disabled={currentMCQ === sampleMCQs.length - 1}
                          >
                            Next Question
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>
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
                    <div className="text-center py-12">
                      <div className="w-64 h-40 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 border-2 border-dashed border-purple-300 rounded-lg flex items-center justify-center mb-6">
                        <div className="text-center">
                          <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                          <p className="text-sm text-purple-700">Click to flip card</p>
                        </div>
                      </div>
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                        Start Flashcard Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schedule" className="mt-6">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      Study Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-green-900">Today - Initial Review</p>
                            <p className="text-sm text-green-700">Completed</p>
                          </div>
                        </div>
                        <Badge className="bg-green-600">Done</Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            3
                          </div>
                          <div>
                            <p className="font-medium text-blue-900">3 Days - First Review</p>
                            <p className="text-sm text-blue-700">Due tomorrow</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-blue-600 text-blue-600">Due Soon</Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            7
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">1 Week - Second Review</p>
                            <p className="text-sm text-slate-600">Dec 28, 2024</p>
                          </div>
                        </div>
                        <Badge variant="secondary">Scheduled</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-6 text-center">
                <Zap className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-purple-900 mb-2">Ready for your next video?</h3>
                <p className="text-sm text-purple-700 mb-4">Process another YouTube video to continue learning</p>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
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