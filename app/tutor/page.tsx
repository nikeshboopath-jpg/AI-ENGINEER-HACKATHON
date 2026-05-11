'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type ChatEntry = {
  role: 'user' | 'assistant'
  text: string
  citation?: string
}

type ProfessorDifficulty = 'strict' | 'military' | 'brutal'

const difficultyLabels: Record<ProfessorDifficulty, string> = {
  strict: 'Level 1: strict teacher',
  military: 'Level 2: military coach',
  brutal: 'Level 3: brutally honest mentor'
}

export default function TutorPage() {
  const [question, setQuestion] = useState('')
  const [chat, setChat] = useState<ChatEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Ask a question after uploading study material.')
  const [difficulty, setDifficulty] = useState<ProfessorDifficulty>('strict')

  useEffect(() => {
    const saved = window.localStorage.getItem('ag-professor-difficulty')
    if (saved === 'strict' || saved === 'military' || saved === 'brutal') {
      setDifficulty(saved)
      setStatus(`Angry Professor difficulty: ${difficultyLabels[saved]}.`)
    }
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!question.trim()) return

    const sentText = question.trim()
    setChat((prev) => [...prev, { role: 'user', text: sentText }])
    setQuestion('')
    setLoading(true)

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: sentText, difficulty })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Tutor request failed.')
      setChat((prev) => [...prev, { role: 'assistant', text: data.answer || 'I could not answer that.', citation: data.citation }])
      setStatus(`${data.meta?.message || `Using ${data.meta?.mode || 'backend'} mode.`} Difficulty: ${difficultyLabels[data.meta?.difficulty as ProfessorDifficulty] || difficultyLabels[difficulty]}.`)
    } catch (error) {
      setChat((prev) => [...prev, { role: 'assistant', text: error instanceof Error ? error.message : 'Tutor request failed.' }])
      setStatus('Tutor request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="max-w-5xl mx-auto space-y-8">
        <Card className="glass-panel p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-red-400">AG Tutor</p>
              <h1 className="mt-3 text-4xl font-black text-white">Ask the Angry Professor</h1>
            </div>
            <MessageSquare className="h-8 w-8 text-red-400" />
          </div>
          <p className="mt-4 text-slate-300 leading-7">Ask AG a study question and receive a grounded response based on your uploaded materials or a safe fallback if the source is missing.</p>
          <p className="mt-3 text-sm text-gray-400">{status}</p>
        </Card>

        <Card className="glass-panel p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask AG about a topic, concept, or exam strategy."
              className="w-full rounded-3xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none focus:border-red-400/80 focus:ring-2 focus:ring-red-400/20"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <p className="text-sm text-gray-400">AG will answer only from your uploaded documents when possible.</p>
              <Button className="flex items-center gap-2" type="submit" disabled={loading || !question.trim()}>{loading ? 'Thinking...' : 'Send'} <Send className="h-4 w-4" /></Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          {chat.length === 0 ? (
            <Card className="glass-panel p-8 text-slate-300">Start your first study conversation and AG will respond with a direct, source-aware answer.</Card>
          ) : (
            chat.map((entry, index) => (
              <Card key={index} className="glass-panel p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-red-300">{entry.role === 'user' ? 'You' : 'AG'}</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">{entry.text}</p>
                {entry.citation && <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gray-500">{entry.citation}</p>}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
