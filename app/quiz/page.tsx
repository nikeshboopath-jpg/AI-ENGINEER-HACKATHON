'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type QuizQuestion = {
  id: string
  question: string
  options?: string[]
  answer: string
  type: 'MCQ' | 'Short Answer' | 'Prediction'
}

export default function QuizPage() {
  const [quiz, setQuiz] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Ready to build a practice quiz.')

  async function loadQuiz() {
    setLoading(true)
    try {
      const res = await fetch('/api/quiz')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Quiz request failed.')
      setQuiz(data.quiz || [])
      setStatus(data.meta?.message || `Using ${data.meta?.mode || 'backend'} mode.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Quiz request failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuiz()
  }, [])

  return (
    <div className="page-shell">
      <div className="max-w-6xl mx-auto space-y-8">
        <Card className="glass-panel p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-red-400">Quiz Generator</p>
              <h1 className="mt-3 text-4xl font-black text-white">Practice with mock questions</h1>
            </div>
            <ClipboardList className="h-8 w-8 text-red-400" />
          </div>
          <p className="mt-4 text-slate-300 leading-7">AG builds a study quiz from your uploaded notes. Use it to review confidence, weak topics, and exam-style prompts.</p>
          <p className="mt-3 text-sm text-gray-400">{status}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="h-12" onClick={loadQuiz} disabled={loading}>{loading ? 'Generating...' : 'Regenerate Quiz'}</Button>
            <Button variant="ghost" className="h-12" onClick={() => window.location.assign('/uploads')}>Upload Files</Button>
          </div>
        </Card>

        <div className="space-y-6">
          {quiz.length === 0 ? (
            <Card className="glass-panel p-8 text-slate-300">No quiz questions yet. Upload your notes and refresh to generate a new set.</Card>
          ) : (
            quiz.map((item) => (
              <Card key={item.id} className="glass-panel p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.24em] text-red-300">{item.type}</span>
                  <p className="text-sm text-gray-400">Answer preview included</p>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-white">{item.question}</h2>
                {item.options && (
                  <div className="mt-4 space-y-2">
                    {item.options.map((option, index) => (
                      <div key={index} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-300">{option}</div>
                    ))}
                  </div>
                )}
                <div className="mt-4 rounded-3xl bg-white/5 p-4 text-sm text-slate-300">
                  <span className="font-medium text-white">Answer:</span> {item.answer}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
