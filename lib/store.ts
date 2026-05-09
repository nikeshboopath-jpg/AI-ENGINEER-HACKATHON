export type UploadedDoc = {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  text: string
  summary?: string
}

export type TopicPrediction = {
  topic: string
  frequency: number
  confidence: string
  predictedQuestion: string
  reason: string
}

export type Flashcard = {
  id: string
  front: string
  back: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  reviewed: boolean
}

export type QuizQuestion = {
  id: string
  question: string
  options?: string[]
  answer: string
  type: 'MCQ' | 'Short Answer' | 'Prediction'
}

export type ApiMeta = {
  mode: 'openai' | 'mock'
  model: string
  message?: string
}

const store = {
  docs: [] as UploadedDoc[],
  topics: [] as TopicPrediction[],
  flashcards: [] as Flashcard[],
  quiz: [] as QuizQuestion[]
}

const globalStore = global as unknown as { agStore?: typeof store }
if (!globalStore.agStore) {
  globalStore.agStore = store
}

export const getStore = () => globalStore.agStore!

export function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function getApiMeta(message?: string): ApiMeta {
  return {
    mode: process.env.OPENAI_API_KEY ? 'openai' : 'mock',
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    message
  }
}
