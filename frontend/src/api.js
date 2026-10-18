const BASE_URL = 'http://localhost:5000'

export const getAiStatus = async () => {
  const res = await fetch(`${BASE_URL}/api/ai/status`)
  if (!res.ok) throw new Error('Failed to fetch AI status')
  return res.json()
}

export const generateAiDescription = async (title) => {
  const res = await fetch(`${BASE_URL}/api/ai/generate-description`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  })

  const data = await res.json()

  if (!res.ok) {
    if (res.status === 429) {
      const error = new Error(data.error || 'Rate limit reached')
      error.status = 429
      error.remainingSeconds = data.remainingSeconds
      throw error
    }
    throw new Error(data.error || 'Failed to reach AI service')
  }

  return data
}

export const getTasks = async () => {
  const res = await fetch(`${BASE_URL}/tasks`)
  if (!res.ok) throw new Error('Failed to fetch tasks')
  return res.json()
}

export const createTask = async (taskData) => {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create task')
  }
  return res.json()
}

export const updateTask = async (id, updateData) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  })
  if (!res.ok) throw new Error('Failed to update task')
  return res.json()
}

export const deleteTask = async (id) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete task')
  return res.json()
}
