import { NextResponse } from 'next/server'
import { getApiMeta, getStore } from '@/lib/store'

export async function GET() {
  const store = getStore()

  return NextResponse.json({
    ok: true,
    meta: getApiMeta(),
    counts: {
      docs: store.docs.length,
      topics: store.topics.length,
      flashcards: store.flashcards.length,
      quiz: store.quiz.length
    }
  })
}
