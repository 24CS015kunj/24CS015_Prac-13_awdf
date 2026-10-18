const { GoogleGenerativeAI } = require('@google/generative-ai')

/**
 * Calls Google Gemini API to generate an intelligent task description and priority suggestion.
 * @param {string} title Task title
 * @param {string} apiKey Gemini API Key
 * @returns {Promise<{ description: string, suggestedPriority: 'low' | 'medium' | 'high' }>}
 */
async function generateDescriptionWithGemini(title, apiKey) {
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const prompt = `You are a senior technical lead and AI assistant in a modern task management application.
Task Title: "${title.trim()}"

Generate:
1. A highly specific, professional, and actionable 1-2 sentence technical description detailing the concrete steps, tools, and best practices to complete this task. Avoid generic filler words.
2. An appropriate priority ("low", "medium", or "high") based on software project urgency, security, and complexity.

Respond ONLY with valid JSON in this exact structure:
{
  "description": "Specific actionable technical description here.",
  "suggestedPriority": "high"
}`

  const genAI = new GoogleGenerativeAI(apiKey.trim())
  const models = [
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite'
  ]
  let lastError = null

  // Try standard SDK models
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 250,
          responseMimeType: 'application/json'
        }
      })

      const result = await model.generateContent(prompt)
      const text = result?.response?.text()

      if (text) {
        const parsed = parseAiResponse(text)
        if (parsed.description) {
          return parsed
        }
      }
    } catch (err) {
      lastError = err
    }
  }

  // Fallback: Direct REST call to Generative Language API
  for (const modelName of ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite']) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 250 }
        })
      })

      if (response.ok) {
        const data = await response.json()
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (rawText) {
          const parsed = parseAiResponse(rawText)
          if (parsed.description) {
            return parsed
          }
        }
      }
    } catch (restErr) {
      lastError = restErr
    }
  }

  throw lastError || new Error('Gemini API failed to return content')
}

/**
 * Safely parse AI text into description and suggestedPriority
 */
function parseAiResponse(rawText) {
  try {
    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()
    const json = JSON.parse(cleaned)
    const validPriority = ['low', 'medium', 'high'].includes(json.suggestedPriority?.toLowerCase())
      ? json.suggestedPriority.toLowerCase()
      : 'medium'
    return {
      description: json.description || cleaned,
      suggestedPriority: validPriority
    }
  } catch {
    return {
      description: rawText.trim(),
      suggestedPriority: 'medium'
    }
  }
}

/**
 * Generates an intelligent, domain-aware, meaningful description and priority
 * when the external AI service is unreachable, denied access, or rate-limited.
 */
function generateFallbackDescription(title) {
  const clean = title.trim()
  const lower = clean.toLowerCase()

  // 1. Authentication / JWT / Security / Passwords / Roles
  if (
    lower.includes('jwt') ||
    lower.includes('auth') ||
    lower.includes('password') ||
    lower.includes('login') ||
    lower.includes('hash') ||
    lower.includes('token') ||
    lower.includes('oauth') ||
    lower.includes('signup') ||
    lower.includes('role')
  ) {
    return {
      description: 'Configure secure authentication by generating cryptographically signed JWT tokens with expiry, securely hashing user passwords using bcrypt/argon2, and protecting private API routes via authentication middleware.',
      suggestedPriority: 'high'
    }
  }

  // 2. Database / MongoDB / SQL / Query Optimization / Schema
  if (
    lower.includes('mongo') ||
    lower.includes('database') ||
    lower.includes('db') ||
    lower.includes('sql') ||
    lower.includes('schema') ||
    lower.includes('timeout') ||
    lower.includes('query')
  ) {
    return {
      description: 'Diagnose and optimize database operations: tune connection pool parameters, index frequently queried fields, and optimize query pipelines to prevent latency and connection timeouts.',
      suggestedPriority: 'high'
    }
  }

  // 3. Bugs / Fixes / Errors / Crashes / Exceptions
  if (
    lower.includes('fix') ||
    lower.includes('bug') ||
    lower.includes('error') ||
    lower.includes('crash') ||
    lower.includes('issue') ||
    lower.includes('exception') ||
    lower.includes('patch')
  ) {
    return {
      description: 'Investigate root cause using application logs and error traces, implement a targeted code patch, and write automated regression tests to verify resolution.',
      suggestedPriority: 'high'
    }
  }

  // 4. APIs / REST / Endpoints / Backend Routes / Controllers
  if (
    lower.includes('api') ||
    lower.includes('endpoint') ||
    lower.includes('rest') ||
    lower.includes('route') ||
    lower.includes('crud') ||
    lower.includes('backend') ||
    lower.includes('controller')
  ) {
    return {
      description: 'Develop and validate RESTful backend endpoints: enforce strict request body validation, handle edge-case error states with proper HTTP status codes, and test response serialization.',
      suggestedPriority: 'medium'
    }
  }

  // 5. UI / Frontend / CSS / Responsive Design / Components
  if (
    lower.includes('ui') ||
    lower.includes('frontend') ||
    lower.includes('css') ||
    lower.includes('design') ||
    lower.includes('responsive') ||
    lower.includes('react') ||
    lower.includes('component') ||
    lower.includes('landing') ||
    lower.includes('dashboard') ||
    lower.includes('layout')
  ) {
    return {
      description: 'Construct responsive, modern interface components with clean CSS styling, fluid hover transitions, and verified accessibility across desktop and mobile viewports.',
      suggestedPriority: 'medium'
    }
  }

  // 6. Testing / QA / Jest / Cypress / Unit Tests
  if (
    lower.includes('test') ||
    lower.includes('unit') ||
    lower.includes('qa') ||
    lower.includes('cypress') ||
    lower.includes('jest') ||
    lower.includes('coverage')
  ) {
    return {
      description: 'Write automated unit and integration test suites: cover core business logic, simulate failure modes and edge cases, and ensure high code coverage across critical application paths.',
      suggestedPriority: 'medium'
    }
  }

  // 7. DevOps / Docker / CI/CD / Deployment / Cloud
  if (
    lower.includes('deploy') ||
    lower.includes('docker') ||
    lower.includes('ci/cd') ||
    lower.includes('pipeline') ||
    lower.includes('production') ||
    lower.includes('server') ||
    lower.includes('build')
  ) {
    return {
      description: 'Configure production-ready deployment automation: set up containerized builds, configure environment variables, and verify automated CI/CD pipeline with zero-downtime release.',
      suggestedPriority: 'high'
    }
  }

  // 8. Performance / Caching / Speed / Latency / Redis
  if (
    lower.includes('optimize') ||
    lower.includes('performance') ||
    lower.includes('cache') ||
    lower.includes('speed') ||
    lower.includes('latency') ||
    lower.includes('redis')
  ) {
    return {
      description: 'Profile system performance under load: identify compute and network bottlenecks, introduce in-memory caching where appropriate, and measure latency reduction.',
      suggestedPriority: 'medium'
    }
  }

  // 9. Documentation / Guides / README
  if (
    lower.includes('doc') ||
    lower.includes('readme') ||
    lower.includes('guide') ||
    lower.includes('manual')
  ) {
    return {
      description: 'Author clear technical documentation: outline architectural diagrams, API contracts, environment setup instructions, and deployment troubleshooting guidelines.',
      suggestedPriority: 'low'
    }
  }

  // 10. Intelligent General Actionable Fallback
  return {
    description: `Define concrete technical requirements for "${clean}", implement core modular components following clean code standards, and verify deliverables against project specifications.`,
    suggestedPriority: 'medium'
  }
}

module.exports = {
  generateDescriptionWithGemini,
  generateFallbackDescription
}
