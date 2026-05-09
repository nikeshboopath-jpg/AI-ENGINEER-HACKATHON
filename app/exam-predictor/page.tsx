'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type TopicPrediction = {
  topic: string
  frequency: number
  confidence: string
  predictedQuestion: string
  reason: string
}

export default function ExamPredictorPage() {
  const [topics, setTopics] = useState<TopicPrediction[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Ready to analyze your study material.')

  async function loadTopics() {
    setLoading(true)
    try {
      const res = await fetch('/api/predictions')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Prediction request failed.')
      setTopics(data.topics || [])
      setStatus(data.meta?.message || `Using ${data.meta?.mode || 'backend'} mode.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Prediction request failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTopics()
  }, [])

  return (
    <div className="page-shell">
      <div className="max-w-6xl mx-auto space-y-8">
        <Card className="glass-panel p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-red-400">Exam Predictor</p>
              <h1 className="mt-3 text-4xl font-black text-white">Likely exam topics</h1>
            </div>
            <TrendingUp className="h-8 w-8 text-red-400" />
          </div>
          <p className="mt-4 text-slate-300 leading-7">AG analyzes your uploaded materials to predict the topics and write sample exam questions. You can refresh any time after uploading more content.</p>
          <p className="mt-3 text-sm text-gray-400">{status}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="h-12" onClick={loadTopics} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh Predictions'}</Button>
            <Button variant="ghost" className="h-12" onClick={() => window.location.assign('/uploads')}>Go to Uploads</Button>
          </div>
        </Card>

        {topics.length === 0 ? (
          <Card className="glass-panel p-8 text-center text-slate-300">No predictions available yet. Upload study materials first.</Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {topics.map((topic) => (
              <Card key={topic.topic} className="glass-panel p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-white">{topic.topic}</h2>
                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-red-300">{topic.confidence}</span>
                </div>
                <p className="mt-4 text-slate-300 text-sm">Frequency: {topic.frequency}</p>
                <p className="mt-4 text-slate-200 font-medium">Predicted question:</p>
                <p className="mt-2 text-slate-300 text-sm">{topic.predictedQuestion}</p>
                <p className="mt-4 text-xs text-gray-500">{topic.reason}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
