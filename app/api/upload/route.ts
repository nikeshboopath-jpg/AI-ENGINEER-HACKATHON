import { NextResponse } from 'next/server'
import { summarizeUpload } from '@/lib/ai'
import { getStore, generateId, UploadedDoc, getApiMeta } from '@/lib/store'

export async function GET() {
  return NextResponse.json({ docs: getStore().docs, meta: getApiMeta() })
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const notes = formData.get('notes')?.toString().trim() || ''

    if (!file && !notes) {
      return NextResponse.json({ error: 'Upload a file or paste study notes.' }, { status: 400 })
    }

    const fileText = file ? await file.text() : ''
    const text = [notes, fileText].filter(Boolean).join('\n\n').slice(0, 20000)
    const doc: UploadedDoc = {
      id: generateId('doc'),
      name: file?.name || `Pasted notes ${new Date().toLocaleString()}`,
      type: file?.type || 'text/plain',
      size: file?.size || new Blob([notes]).size,
      uploadedAt: new Date().toISOString(),
      text,
      summary: text.slice(0, 220)
    }

    doc.summary = await summarizeUpload(doc)

    const store = getStore()
    store.docs.unshift(doc)
    store.topics = []
    store.flashcards = []
    store.quiz = []

    return NextResponse.json({ doc, meta: getApiMeta('Upload saved and ready for analysis.') })
  } catch (error) {
    console.error('Upload failed', error)
    return NextResponse.json({ error: 'Upload failed. Try a text-based file or paste notes directly.' }, { status: 500 })
  }
}
