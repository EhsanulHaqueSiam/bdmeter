import { getStore } from '@netlify/blobs'

export async function checkRateLimit(req, limit = 30, windowMs = 60000) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const key = `rate:${ip}`
  const store = getStore('rate-limits')

  try {
    const data = await store.get(key, { type: 'json' }) || { count: 0, reset: 0 }
    const now = Date.now()

    if (now > data.reset) {
      data.count = 1
      data.reset = now + windowMs
    } else {
      data.count++
    }

    await store.setJSON(key, data)

    if (data.count > limit) {
      return { limited: true, remaining: 0 }
    }
    return { limited: false, remaining: limit - data.count }
  } catch {
    return { limited: false, remaining: limit }
  }
}
