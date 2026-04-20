export const AUTH_URL = import.meta.env.VITE_AUTH_URL
export const SUPERVISION_URL = import.meta.env.VITE_SUPERVISION_URL
export const NOTIFICATION_URL = import.meta.env.VITE_NOTIFICATION_URL
export const REPORTING_URL = import.meta.env.VITE_REPORTING_URL
export const INTEGRATION_URL = import.meta.env.VITE_INTEGRATION_URL

export function jwtAuthHeader(token) {
  if (!token) return null
  return `Bearer ${token}`
}

export async function apiFetch(url, auth, init = {}) {
  const headers = { ...(init.headers || {}) }
  if (auth?.token) {
    headers['Authorization'] = jwtAuthHeader(auth.token)
    // Debug: Log token being sent (remove in production)
    console.log(`[API] Sending token for ${url}:`, headers['Authorization'].substring(0, 50) + '...')
  } else {
    console.log(`[API] No token available for ${url}`)
  }

  if (init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  console.log(`[API] Request to: ${url}`, { 
    method: init.method || 'GET',
    hasAuth: !!auth?.token,
    hasRole: auth?.role 
  })

  const res = await fetch(url, { ...init, headers })
  
  console.log(`[API] Response from ${url}:`, { 
    status: res.status, 
    statusText: res.statusText 
  })
  
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText))

  if (res.status === 204) return null

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return await res.json()
  }

  return await res.text()
}

