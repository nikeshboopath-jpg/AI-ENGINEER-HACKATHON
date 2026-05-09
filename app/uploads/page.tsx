'use client'

import { useEffect, useState } from 'react'
import { UploadCloud, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type UploadedDoc = {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  summary?: string
}

export default function UploadsPage() {
  const [docs, setDocs] = useState<UploadedDoc[]>([])
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('Select a file and upload your study material.')

  async function fetchDocs() {
    try {
      const res = await fetch('/api/upload')
      const data = await res.json()
      setDocs(data.docs || [])
      if (data.meta?.message) setMessage(data.meta.message)
    } catch {
      setMessage('Could not reach the backend. Make sure the dev server is running.')
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [])

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(`Uploading ${file.name}...`)

    const formData = new FormData()
    formData.append('file', file)
    if (notes.trim()) formData.append('notes', notes.trim())

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (res.ok) {
      const data = await res.json()
      setMessage(data.meta?.message || 'Upload complete. AG is ready to analyze your docs.')
      setNotes('')
      await fetchDocs()
    } else {
      const data = await res.json().catch(() => ({}))
      setMessage(data.error || 'Upload failed. Try again with a smaller file.')
    }

    setUploading(false)
  }

  async function handleNotesSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!notes.trim()) return

    setUploading(true)
    setMessage('Saving pasted notes...')

    const formData = new FormData()
    formData.append('notes', notes.trim())

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (res.ok) {
      const data = await res.json()
      setMessage(data.meta?.message || 'Notes saved. AG is ready to analyze them.')
      setNotes('')
      await fetchDocs()
    } else {
      const data = await res.json().catch(() => ({}))
      setMessage(data.error || 'Could not save notes.')
    }

    setUploading(false)
  }

  return (
    <div className="page-shell">
      <div className="max-w-6xl mx-auto space-y-8">
        <Card className="glass-panel p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-red-400">Upload Center</p>
              <h1 className="mt-3 text-4xl font-black text-white">Upload your study files</h1>
            </div>
            <UploadCloud className="h-8 w-8 text-red-400" />
          </div>
          <p className="mt-4 text-slate-300 leading-7">AG stores your study content and uses it for exam prediction, flashcard generation, quiz building, and tutor responses. Paste notes for the most reliable local demo analysis.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/40 px-5 py-4 text-left cursor-pointer hover:border-red-400/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-white">Choose a text-based study file</p>
                  <p className="mt-1 text-sm text-gray-400">TXT, MD, CSV, exported notes, and text-readable files work best.</p>
                </div>
                <div className="rounded-full bg-red-500/10 p-3 text-red-300">
                  <FileText className="h-5 w-5" />
                </div>
                <input type="file" className="hidden" onChange={handleFileChange} disabled={uploading} />
              </label>
              <form onSubmit={handleNotesSubmit} className="rounded-3xl border border-white/10 bg-black/40 p-4">
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Paste lecture notes, a syllabus, textbook excerpts, or past-paper questions."
                  className="min-h-36 w-full resize-y rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-red-400/80 focus:ring-2 focus:ring-red-400/20"
                  disabled={uploading}
                />
                <div className="mt-3 flex justify-end">
                  <Button type="submit" disabled={uploading || !notes.trim()}>
                    Save Notes
                  </Button>
                </div>
              </form>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase text-red-300 tracking-[0.24em]">Status</p>
              <p className="mt-4 text-slate-300 leading-6">{message}</p>
              <div className="mt-6 flex items-center gap-3">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin text-red-400" /> : <CheckCircle2 className="h-5 w-5 text-green-400" />}
                <span className="text-sm text-gray-400">Ready for upload</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass-panel p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-red-400">Uploaded Documents</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Your study library</h2>
            </div>
            <Button className="h-12" onClick={fetchDocs}>Refresh</Button>
          </div>
          <div className="mt-6 space-y-3">
            {docs.length === 0 ? (
              <p className="text-slate-400">No uploads yet. Add a file to start building your knowledge base.</p>
            ) : (
              docs.map((doc) => (
                <div key={doc.id} className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-white">{doc.name}</span>
                    <span className="text-xs text-gray-500">{doc.type} · {(doc.size / 1024).toFixed(1)} KB</span>
                    <span className="text-sm text-slate-400">Uploaded {new Date(doc.uploadedAt).toLocaleString()}</span>
                    {doc.summary && <span className="mt-2 text-sm leading-6 text-slate-300">{doc.summary}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
