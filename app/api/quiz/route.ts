import { NextResponse } from 'next/server'
import { generateQuiz } from '@/lib/ai'

export async function GET() {
  try {
    const result = await generateQuiz()
    return NextResponse.json({ quiz: result.data, meta: result.meta })
  } catch (error) {
    console.error('Quiz generation failed', error)
    return NextResponse.json({ error: 'Quiz generation failed.' }, { status: 500 })
  }
}

export async function POST() {
  return GET()
}
