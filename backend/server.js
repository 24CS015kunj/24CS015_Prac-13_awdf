require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const OpenAI = require('openai')
const Task = require('./models/Task')
const {
  generateDescriptionWithGemini,
  generateFallbackDescription
} = require('./geminiService')

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskmanager'

app.use(cors())
app.use(express.json())

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err.message))

// Rate limit store: Max 1 AI request per task title per minute (as per Practical 13 requirements)
const aiRateLimitMap = new Map()

// Cleanup old rate limit entries every 2 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamp] of aiRateLimitMap.entries()) {
    if (now - timestamp > 60000) {
      aiRateLimitMap.delete(key)
    }
  }
}, 120000)

/**
 * Health & AI configuration status route (Never exposes raw keys)
 */
app.get('/api/ai/status', (req, res) => {
  const hasGemini = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  )
  const hasOpenAi = Boolean(
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY.trim() !== '' &&
    process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'
  )

  res.status(200).json({
    activeProvider: hasGemini ? 'Google Gemini' : hasOpenAi ? 'OpenAI' : 'Fallback Template',
    hasGeminiKey: hasGemini,
    hasOpenAiKey: hasOpenAi,
    rateLimitPolicy: 'Max 1 request per task per minute',
    status: 'ready'
  })
})

/**
 * AI Description Generation Endpoint
 * Supports Gemini API with graceful degradation fallback
 */
app.post('/api/ai/generate-description', async (req, res) => {
  const { title } = req.body

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required for generating a description' })
  }

  const trimmedTitle = title.trim()
  const normalizedKey = trimmedTitle.toLowerCase()
  const now = Date.now()

  // Rate Limiting Check: 1 request per task title per 60 seconds
  const lastRequest = aiRateLimitMap.get(normalizedKey)
  if (lastRequest && (now - lastRequest < 60000)) {
    const remainingSeconds = Math.ceil((60000 - (now - lastRequest)) / 1000)
    return res.status(429).json({
      error: `Rate limit reached for this task. Please wait ${remainingSeconds} seconds before requesting AI assistance again.`,
      remainingSeconds,
      rateLimited: true
    })
  }

  // Register timestamp for rate limiting
  aiRateLimitMap.set(normalizedKey, now)

  const geminiKey = process.env.GEMINI_API_KEY
  const hasValidGeminiKey =
    geminiKey &&
    geminiKey.trim() !== '' &&
    geminiKey !== 'your_gemini_api_key_here'

  // Attempt 1: Google Gemini API (Primary requested AI provider)
  if (hasValidGeminiKey) {
    try {
      console.log(`[AI Request] Calling Google Gemini API for: "${trimmedTitle}"`)
      const aiResult = await generateDescriptionWithGemini(trimmedTitle, geminiKey)
      return res.status(200).json({
        description: aiResult.description,
        suggestedPriority: aiResult.suggestedPriority || 'medium',
        provider: 'gemini',
        fallback: false
      })
    } catch (err) {
      console.warn(`[AI Warning] Gemini API call failed: ${err.message}. Triggering graceful fallback.`)
      // Degrade gracefully as per lab requirements
      const fallback = generateFallbackDescription(trimmedTitle)
      return res.status(200).json({
        description: fallback.description,
        suggestedPriority: fallback.suggestedPriority,
        provider: 'fallback',
        fallback: true,
        reason: 'Gemini service returned an error or quota limit. Fallback template loaded.'
      })
    }
  }

  // Attempt 2: OpenAI API (Secondary provider if OPENAI_API_KEY is present)
  const openAiKey = process.env.OPENAI_API_KEY
  const hasValidOpenAiKey =
    openAiKey &&
    openAiKey.trim() !== '' &&
    openAiKey !== 'your_openai_api_key_here'

  if (hasValidOpenAiKey) {
    try {
      console.log(`[AI Request] Calling OpenAI API for: "${trimmedTitle}"`)
      const client = new OpenAI({ apiKey: openAiKey })
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an assistant for a task management app. Generate a clear, concise 1-2 sentence description for the given task title.'
          },
          {
            role: 'user',
            content: `Write a short task description for: ${trimmedTitle}`
          }
        ],
        max_tokens: 100
      })

      const generated = completion.choices[0].message.content.trim()
      return res.status(200).json({
        description: generated,
        suggestedPriority: 'medium',
        provider: 'openai',
        fallback: false
      })
    } catch (err) {
      console.warn(`[AI Warning] OpenAI API call failed: ${err.message}. Triggering graceful fallback.`)
    }
  }

  // Attempt 3: Graceful Fallback Mode (When no key or invalid key is configured)
  // Lab requirement: The core application must continue to function normally.
  console.log(`[AI Fallback] Generating offline smart template for: "${trimmedTitle}"`)
  const fallback = generateFallbackDescription(trimmedTitle)
  return res.status(200).json({
    description: fallback.description,
    suggestedPriority: fallback.suggestedPriority,
    provider: 'fallback',
    fallback: true,
    reason: 'No external AI API key configured in .env. Smart template generated.'
  })
})

/**
 * Task Management REST Endpoints
 */
app.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 })
    res.status(200).json(tasks)
  } catch (err) {
    next(err)
  }
})

app.post('/tasks', async (req, res, next) => {
  try {
    const { title, description, priority, isAiGenerated } = req.body
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      isAiGenerated: Boolean(isAiGenerated),
      completed: false
    })

    res.status(201).json(task)
  } catch (err) {
    next(err)
  }
})

app.put('/tasks/:id', async (req, res, next) => {
  try {
    const { completed, title, description, priority } = req.body
    const updateData = {}

    if (typeof completed === 'boolean') updateData.completed = completed
    if (title && title.trim()) updateData.title = title.trim()
    if (typeof description === 'string') updateData.description = description.trim()
    if (priority && ['low', 'medium', 'high'].includes(priority)) updateData.priority = priority

    const updated = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true })
    if (!updated) return res.status(404).json({ error: 'Task not found' })
    res.status(200).json(updated)
  } catch (err) {
    next(err)
  }
})

app.delete('/tasks/:id', async (req, res, next) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Task not found' })
    res.status(200).json({ message: 'Task deleted successfully' })
  } catch (err) {
    next(err)
  }
})

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message || 'Internal Server Error' })
})

app.listen(PORT, () => {
  console.log(`Server with Gemini AI integration running on port ${PORT}`)
})
