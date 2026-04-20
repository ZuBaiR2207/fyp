import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function LoginPage() {
  const nav = useNavigate()
  const { login } = useAuth()

  const [username, setUsername] = useState(null)
  const [password, setPassword] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const role = await login(username, password)
      if (role === 'STUDENT') nav('/student')
      else nav('/university')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <div className="login-card__logo" aria-hidden />
          <div className="login-card__titles">
            <h1>Final Year Project Portal</h1>
            <p>Supervision, reminders, and program insights in one place.</p>
          </div>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <label>
            Username
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? <div className="login-form__error">{error}</div> : null}
          <button className="login-form__submit" disabled={loading} type="submit">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* <div className="login-card__footer">
          Demo: <code>student1</code> / <code>student123</code> · <code>supervisor1</code> /{' '}
          <code>supervisor123</code> · <code>admin1</code> / <code>admin123</code>
        </div> */}
      </div>
    </div>
  )
}
