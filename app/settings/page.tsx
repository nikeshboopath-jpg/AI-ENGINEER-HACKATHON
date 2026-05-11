'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Settings, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type ProfessorDifficulty = 'strict' | 'military' | 'brutal'

const difficultyOptions: Array<{
  value: ProfessorDifficulty
  title: string
  description: string
}> = [
  { value: 'strict', title: 'Level 1', description: 'Level 1 Proffessor' },
  { value: 'military', title: 'Level 2', description: 'Lv2 Professor' },
  { value: 'brutal', title: 'Level 3', description: 'Lv3  Final Boss' }
]

export default function SettingsPage() {
  const [apiStatus, setApiStatus] = useState('Checking backend...')
  const [model, setModel] = useState('Not loaded')
  const [difficulty, setDifficulty] = useState<ProfessorDifficulty>('strict')

  useEffect(() => {
    const savedDifficulty = window.localStorage.getItem('ag-professor-difficulty')
    if (savedDifficulty === 'strict' || savedDifficulty === 'military' || savedDifficulty === 'brutal') {
      setDifficulty(savedDifficulty)
    }

    async function loadHealth() {
      try {
        const res = await fetch('/api/health')
        const data = await res.json()
        setApiStatus(data.meta?.mode === 'openai' ? 'Live OpenAI mode' : 'Mock mode until OPENAI_API_KEY is added')
        setModel(data.meta?.model || 'Not configured')
      } catch {
        setApiStatus('Backend not reachable')
      }
    }

    loadHealth()
  }, [])

  function updateDifficulty(value: ProfessorDifficulty) {
    setDifficulty(value)
    window.localStorage.setItem('ag-professor-difficulty', value)
  }

  return (
    <div className="page-shell">
      <div className="max-w-5xl mx-auto space-y-10">
        <Card className="glass-panel p-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-300">
              <Settings className="h-6 w-6" />
              <span className="uppercase tracking-[0.24em] text-sm text-red-300">Settings</span>
            </div>
            <h1 className="text-4xl font-black text-white">AG Preferences</h1>
            <p className="text-slate-300 leading-7">
              Customize your demo experience with key study options and interface settings. AG keeps the app lean while giving you the feel of a polished productivity tool.
            </p>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass-panel p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-red-400">Theme</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Dark Futuristic</h2>
              </div>
              <ShieldCheck className="h-6 w-6 text-red-400" />
            </div>
            <p className="mt-4 text-slate-300 leading-7">
              The app uses a high-contrast black and red palette with glassmorphism cards for a premium hacker demo look.
            </p>
            <div className="mt-6 space-y-3 text-sm text-gray-400">
              <p>• Accent animations enabled</p>
              <p>• Smooth page transitions</p>
              <p>• Easy extension for extra theme modes</p>
            </div>
          </Card>

          <Card className="glass-panel p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-red-400">Study Mode</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Angry Professor</h2>
              </div>
              <Sparkles className="h-6 w-6 text-red-400" />
            </div>
            <p className="mt-4 text-slate-300 leading-7">
              Pick how hard AG pushes during tutor sessions. Your choice is saved in this browser and applied when you ask the Angry Professor a question.
            </p>
            <div className="mt-6 grid gap-3" role="radiogroup" aria-label="Angry Professor difficulty">
              {difficultyOptions.map((option) => {
                const selected = difficulty === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => updateDifficulty(option.value)}
                    className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                      selected
                        ? 'border-red-400 bg-red-500/15 text-white shadow-glow'
                        : 'border-white/10 bg-black/30 text-slate-300 hover:border-red-400/60 hover:bg-red-500/10'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{option.title}</span>
                    <span className="mt-1 block text-xs text-gray-400">{option.description}</span>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        <Card className="glass-panel p-8">
          <h2 className="text-2xl font-semibold text-white">Quick Links</h2>
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/30 p-5 text-sm text-slate-300">
            <p><span className="font-semibold text-white">Backend:</span> {apiStatus}</p>
            <p className="mt-2"><span className="font-semibold text-white">Model:</span> {model}</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link href="/dashboard">
              <Button className="w-full">Back to Dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full">Return Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
