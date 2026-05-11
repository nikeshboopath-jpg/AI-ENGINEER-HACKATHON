import { NextResponse } from 'next/server'
import { tutorRespond } from '@/lib/ai'
import type { ProfessorDifficulty } from '@/lib/store'

const difficulties: ProfessorDifficulty[] = ['strict', 'military', 'brutal']

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const question = body.question?.trim()
    const difficulty = difficulties.includes(body.difficulty) ? body.difficulty : 'strict'
    if (!question) {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 })
    }

    const result = await tutorRespond(question, difficulty)
    return NextResponse.json({ ...result.data, meta: result.meta })
  } catch (error) {
    console.error('Tutor response failed', error)
    return NextResponse.json({ error: 'Tutor response failed.' }, { status: 500 })
  }
}
