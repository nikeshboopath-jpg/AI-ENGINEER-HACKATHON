import { NextResponse } from 'next/server'
import { getPredictions } from '@/lib/ai'

export async function GET() {
  try {
    const result = await getPredictions()
    return NextResponse.json({ topics: result.data, meta: result.meta })
  } catch (error) {
    console.error('Prediction generation failed', error)
    return NextResponse.json({ error: 'Prediction generation failed.' }, { status: 500 })
  }
}
