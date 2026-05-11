import OpenAI from 'openai'
import {
  ApiMeta,
  Flashcard,
  ProfessorDifficulty,
  QuizQuestion,
  TopicPrediction,
  UploadedDoc,
  generateId,
  getApiMeta,
  getStore
} from '@/lib/store'

type AiResult<T> = {
  data: T
  meta: ApiMeta
}

type TutorResult = {
  answer: string
  citation?: string
}

const PROFESSOR_STYLES: Record<ProfessorDifficulty, string> = {
  strict: 'Level 1 strict teacher: firm, clear, and corrective without being harsh.',
  military: 'Level 2 military coach: intense, concise, drill-sergeant energy, and focused on discipline.',
  brutal: 'Level 3 brutally honest mentor: blunt, demanding, and direct while staying useful and non-abusive.'
}

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'
const MAX_CONTEXT_CHARS = 12000

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function cleanText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function docsContext() {
  const store = getStore()
  return store.docs
    .map((doc, index) => {
      const body = cleanText(doc.text || doc.summary || '')
      return `Source ${index + 1}: ${doc.name}\n${body}`
    })
    .join('\n\n')
    .slice(0, MAX_CONTEXT_CHARS)
}

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    const match = value.match(/```json\s*([\s\S]*?)```/) || value.match(/(\[[\s\S]*\]|\{[\s\S]*\})/)
    if (!match) return fallback
    try {
      return JSON.parse(match[1]) as T
    } catch {
      return fallback
    }
  }
}

async function structuredResponse<T>({
  instructions,
  input,
  schema,
  fallback,
  maxOutputTokens = 900,
  temperature = 0.5
}: {
  instructions: string
  input: string
  schema: Record<string, unknown>
  fallback: T
  maxOutputTokens?: number
  temperature?: number
}): Promise<T> {
  const client = getClient()
  if (!client) return fallback

  const response = await client.responses.create({
    model: DEFAULT_MODEL,
    instructions,
    input,
    max_output_tokens: maxOutputTokens,
    temperature,
    text: {
      format: {
        type: 'json_schema',
        name: 'ag_study_payload',
        strict: true,
        schema
      }
    }
  })

  return safeJsonParse<T>(response.output_text ?? '', fallback)
}

function hasUsableDocs() {
  return getStore().docs.some((doc) => cleanText(doc.text).length > 20)
}

export async function getPredictions(): Promise<AiResult<TopicPrediction[]>> {
  const store = getStore()
  const fallback = store.topics.length > 0 ? store.topics : getMockPredictions()

  if (!getClient() || !hasUsableDocs()) {
    return {
      data: fallback,
      meta: getApiMeta(!getClient() ? 'Add OPENAI_API_KEY to enable live AI predictions.' : 'Upload more readable study text for live predictions.')
    }
  }

  const payload = await structuredResponse<{ topics: TopicPrediction[] }>({
    instructions: 'You are AG, a strict but useful exam prep analyst. Return only grounded, actionable predictions from the provided study sources.',
    input: `Analyze these study sources and predict likely exam topics.\n\n${docsContext()}`,
    fallback: { topics: fallback },
    temperature: 0.45,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['topics'],
      properties: {
        topics: {
          type: 'array',
          minItems: 4,
          maxItems: 6,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['topic', 'frequency', 'confidence', 'predictedQuestion', 'reason'],
            properties: {
              topic: { type: 'string' },
              frequency: { type: 'number' },
              confidence: { type: 'string' },
              predictedQuestion: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        }
      }
    }
  })

  store.topics = payload.topics
  return { data: store.topics, meta: getApiMeta('Generated from uploaded study material.') }
}

export async function generateFlashcards(): Promise<AiResult<Flashcard[]>> {
  const store = getStore()
  const fallback = store.flashcards.length > 0 ? store.flashcards : getMockFlashcards()

  if (!getClient() || !hasUsableDocs()) {
    store.flashcards = fallback
    return {
      data: store.flashcards,
      meta: getApiMeta(!getClient() ? 'Add OPENAI_API_KEY to generate custom flashcards.' : 'Upload more readable study text for custom flashcards.')
    }
  }

  const payload = await structuredResponse<{ flashcards: Omit<Flashcard, 'id'>[] }>({
    instructions: 'Create crisp active-recall flashcards from the supplied study sources. Keep answers short but complete.',
    input: `Build flashcards from these sources.\n\n${docsContext()}`,
    fallback: { flashcards: fallback },
    maxOutputTokens: 1000,
    temperature: 0.65,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['flashcards'],
      properties: {
        flashcards: {
          type: 'array',
          minItems: 6,
          maxItems: 10,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['front', 'back', 'difficulty', 'reviewed'],
            properties: {
              front: { type: 'string' },
              back: { type: 'string' },
              difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
              reviewed: { type: 'boolean' }
            }
          }
        }
      }
    }
  })

  store.flashcards = payload.flashcards.map((card) => ({
    id: generateId('flash'),
    front: card.front,
    back: card.back,
    difficulty: card.difficulty,
    reviewed: false
  }))

  return { data: store.flashcards, meta: getApiMeta('Generated from uploaded study material.') }
}

export async function generateQuiz(): Promise<AiResult<QuizQuestion[]>> {
  const store = getStore()
  const fallback = store.quiz.length > 0 ? store.quiz : getMockQuiz()

  if (!getClient() || !hasUsableDocs()) {
    store.quiz = fallback
    return {
      data: store.quiz,
      meta: getApiMeta(!getClient() ? 'Add OPENAI_API_KEY to generate custom quizzes.' : 'Upload more readable study text for custom quizzes.')
    }
  }

  const payload = await structuredResponse<{ quiz: Omit<QuizQuestion, 'id'>[] }>({
    instructions: 'Create exam-practice questions from the study sources. Include a balanced mix of recall, application, and prediction questions.',
    input: `Generate a quiz from these sources.\n\n${docsContext()}`,
    fallback: { quiz: fallback },
    maxOutputTokens: 1200,
    temperature: 0.6,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['quiz'],
      properties: {
        quiz: {
          type: 'array',
          minItems: 6,
          maxItems: 8,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['question', 'options', 'answer', 'type'],
            properties: {
              question: { type: 'string' },
              options: {
                type: 'array',
                items: { type: 'string' }
              },
              answer: { type: 'string' },
              type: { type: 'string', enum: ['MCQ', 'Short Answer', 'Prediction'] }
            }
          }
        }
      }
    }
  })

  store.quiz = payload.quiz.map((item) => ({
    id: generateId('quiz'),
    question: item.question,
    options: item.options?.length ? item.options : undefined,
    answer: item.answer,
    type: item.type
  }))

  return { data: store.quiz, meta: getApiMeta('Generated from uploaded study material.') }
}

export async function tutorRespond(message: string, difficulty: ProfessorDifficulty = 'strict'): Promise<AiResult<TutorResult>> {
  const store = getStore()
  const professorStyle = PROFESSOR_STYLES[difficulty] || PROFESSOR_STYLES.strict
  const fallback = {
    answer: store.docs.length
      ? `${professorStyle} I need your OpenAI API key before I can reason over those uploads. For now, your materials are saved and ready.`
      : `${professorStyle} I don't have enough uploaded material to answer that confidently.`,
    citation: store.docs[0]?.name ? `Source: ${store.docs[0].name}` : undefined
  }

  const client = getClient()
  if (!client || !hasUsableDocs()) {
    const metaMessage = !client ? 'Add OPENAI_API_KEY to enable the live tutor.' : 'Upload readable study text so AG can cite it.'
    return {
      data: fallback,
      meta: { ...getApiMeta(metaMessage), difficulty }
    }
  }

  const response = await client.responses.create({
    model: DEFAULT_MODEL,
    instructions: `You are AG, a motivating academic tutor. Use this Angry Professor difficulty: ${professorStyle} Answer only from the provided study sources. If the sources do not support an answer, say you don't have enough uploaded material. Cite the source name you used.`,
    input: `Study sources:\n${docsContext()}\n\nStudent question: ${message}`,
    temperature: 0.45,
    max_output_tokens: 700
  })

  return {
    data: {
      answer: response.output_text?.trim() || fallback.answer,
      citation: store.docs[0]?.name ? `Source: ${store.docs[0].name}` : undefined
    },
    meta: { ...getApiMeta('Answered from uploaded study material.'), difficulty }
  }
}

export async function summarizeUpload(doc: UploadedDoc): Promise<string> {
  const client = getClient()
  const text = cleanText(doc.text)
  if (!client || text.length < 80) return text.slice(0, 220)

  const response = await client.responses.create({
    model: DEFAULT_MODEL,
    instructions: 'Summarize this uploaded study material in 2 concise sentences for a dashboard preview.',
    input: text.slice(0, 8000),
    temperature: 0.3,
    max_output_tokens: 180
  })

  return response.output_text?.trim() || text.slice(0, 220)
}

function getMockPredictions(): TopicPrediction[] {
  return [
    { topic: 'Core Definitions', frequency: 12, confidence: '88%', predictedQuestion: 'Define the key terms and explain how they connect.', reason: 'Mock mode uses broad study patterns until your OpenAI key is added.' },
    { topic: 'Process Comparison', frequency: 9, confidence: '82%', predictedQuestion: 'Compare two major methods and justify when each should be used.', reason: 'Comparison questions are common across technical and theory exams.' },
    { topic: 'Applied Scenario', frequency: 7, confidence: '78%', predictedQuestion: 'Apply the main concept to a realistic case and explain the tradeoffs.', reason: 'Application questions test deeper understanding.' },
    { topic: 'Exam Strategy', frequency: 5, confidence: '72%', predictedQuestion: 'How should an answer be structured under time pressure?', reason: 'Answer planning improves marks even before content improves.' }
  ]
}

function getMockFlashcards(): Flashcard[] {
  return [
    { id: 'card_1', front: 'What should every strong exam answer include?', back: 'A direct claim, supporting evidence, and a short explanation of why it matters.', difficulty: 'Easy', reviewed: false },
    { id: 'card_2', front: 'Why compare related concepts while revising?', back: 'Comparison exposes the boundaries between ideas and makes application questions easier.', difficulty: 'Medium', reviewed: false },
    { id: 'card_3', front: 'What is active recall?', back: 'Testing yourself from memory before looking at notes, then correcting gaps immediately.', difficulty: 'Medium', reviewed: false },
    { id: 'card_4', front: 'What makes a topic likely to appear on an exam?', back: 'High frequency in notes, lecturer emphasis, past-paper recurrence, and conceptual centrality.', difficulty: 'Hard', reviewed: false }
  ]
}

function getMockQuiz(): QuizQuestion[] {
  return [
    { id: 'q1', question: 'What is the best first step after uploading study material?', options: ['Skip revision', 'Generate predictions', 'Delete notes', 'Memorize randomly'], answer: 'Generate predictions', type: 'MCQ' },
    { id: 'q2', question: 'Explain why active recall beats passive rereading.', options: [], answer: 'It forces retrieval, reveals weak spots, and strengthens memory through effort.', type: 'Short Answer' },
    { id: 'q3', question: 'Predict a likely exam question style for a high-frequency topic.', options: [], answer: 'A compare, explain, or apply question is likely because it tests conceptual command.', type: 'Prediction' }
  ]
}
