'use client'

import { useEffect, useState } from 'react'
import { BookOpen, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type Flashcard = {
  id: string
  front: string
  back: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  reviewed: boolean
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Ready to generate active-recall cards.')

  async function loadCards() {
    setLoading(true)
    try {
      const res = await fetch('/api/flashcards')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Flashcard request failed.')
      setCards(data.flashcards || [])
      setStatus(data.meta?.message || `Using ${data.meta?.mode || 'backend'} mode.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Flashcard request failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCards()
  }, [])

  return (
    <div className="page-shell">
      <div className="max-w-6xl mx-auto space-y-8">
        <Card className="glass-panel p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-red-400">Flashcards</p>
              <h1 className="mt-3 text-4xl font-black text-white">Spaced recall cards</h1>
            </div>
            <BookOpen className="h-8 w-8 text-red-400" />
          </div>
          <p className="mt-4 text-slate-300 leading-7">AG generates flashcards from uploaded material with difficulty labels so you can study the hardest concepts first.</p>
          <p className="mt-3 text-sm text-gray-400">{status}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="h-12" onClick={loadCards} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh Flashcards'}</Button>
            <Button variant="ghost" className="h-12" onClick={() => window.location.assign('/uploads')}>Upload More</Button>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.length === 0 ? (
            <Card className="glass-panel p-8 text-slate-300">No flashcards available yet. Add study documents and refresh to generate cards.</Card>
          ) : (
            cards.map((card) => (
              <Card key={card.id} className="glass-panel p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-white">{card.front}</h2>
                  <span className="text-xs uppercase tracking-[0.24em] text-red-300">{card.difficulty}</span>
                </div>
                <p className="mt-4 text-slate-300">{card.back}</p>
                <p className="mt-5 text-xs text-gray-500">Status: {card.reviewed ? 'Reviewed' : 'New'}</p>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
