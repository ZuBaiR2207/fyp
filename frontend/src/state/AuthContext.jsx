import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AUTH_URL } from '../api/api'

const AuthContext = createContext(null)
const STORAGE_KEY = 'fyp_auth_jwt'
const DEFAULT_TIMEOUT_MINUTES = 30
const parsedMinutes = Number(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES ?? DEFAULT_TIMEOUT_MINUTES)
const SESSION_TIMEOUT_MS = (Number.isFinite(parsedMinutes) && parsedMinutes > 0 ? parsedMinutes : DEFAULT_TIMEOUT_MINUTES) * 60 * 1000

function emptyState() {
  return { token: '', role: '', expiresAt: 0 }
}

function isAuthenticatedState(state) {
  return Boolean(state.token && state.role)
}

function withNewExpiry(state) {
  return { ...state, expiresAt: Date.now() + SESSION_TIMEOUT_MS }
}

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()

    const parsed = JSON.parse(raw)
    if (!isAuthenticatedState(parsed)) {
      localStorage.removeItem(STORAGE_KEY)
      return emptyState()
    }

    if (typeof parsed.expiresAt !== 'number') {
      const refreshed = withNewExpiry(parsed)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed))
      return refreshed
    }

    if (parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return emptyState()
    }

    return parsed
  } catch {
    return emptyState()
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(loadInitialState)
  const stateRef = useRef(state)
  const lastActivitySyncRef = useRef(0)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    if (!isAuthenticatedState(state)) return

    function clearAuth() {
      setState(emptyState())
      localStorage.removeItem(STORAGE_KEY)
    }

    function refreshActivity() {
      const current = stateRef.current
      if (!isAuthenticatedState(current)) return

      const now = Date.now()
      if (now - lastActivitySyncRef.current < 30_000) return
      lastActivitySyncRef.current = now

      const next = withNewExpiry(current)
      stateRef.current = next
      setState(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }

    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
    activityEvents.forEach((eventName) => window.addEventListener(eventName, refreshActivity, { passive: true }))

    const timer = window.setInterval(() => {
      const current = stateRef.current
      if (!isAuthenticatedState(current)) return
      if (current.expiresAt <= Date.now()) {
        clearAuth()
      }
    }, 15_000)

    return () => {
      window.clearInterval(timer)
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, refreshActivity))
    }
  }, [state.token, state.role])

  const value = useMemo(() => {
    return {
      token: state.token,
      role: state.role,
      isAuthenticated: isAuthenticatedState(state) && state.expiresAt > Date.now(),
      login: async (username, password) => {
        const res = await fetch(`${AUTH_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
        if (!res.ok) {
          throw new Error('Login failed. Check your credentials.')
        }
        const data = await res.json()
        const next = withNewExpiry({ token: data.token, role: data.role })
        setState(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return data.role
      },
      logout: () => {
        setState(emptyState())
        localStorage.removeItem(STORAGE_KEY)
      },
    }
  }, [state])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

