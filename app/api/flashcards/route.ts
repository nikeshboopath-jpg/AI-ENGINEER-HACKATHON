import { NextResponse } from 'next/server'
import { generateFlashcards } from '@/lib/ai'

export async function GET() {
  try {
    const result = await generateFlashcards()
    return NextResponse.json({ flashcards: result.data, meta: result.meta })
  } catch (error) {
    console.error('Flashcard generation failed', error)
    return NextResponse.json({ error: 'Flashcard generation failed.' }, { status: 500 })
  }
}

export async function POST() {
  return GET()
}
