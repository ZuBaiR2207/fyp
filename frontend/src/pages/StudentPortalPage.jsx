import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../state/AuthContext'
import PortalLayout from '../components/PortalLayout.jsx'
import { INTEGRATION_URL, NOTIFICATION_URL, SUPERVISION_URL, AUTH_URL, apiFetch } from '../api/api'
import { useRealtime } from '../hooks/useRealtime'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout' },
  { id: 'progress', label: 'Thesis progress', icon: 'chart' },
  { id: 'reminders', label: 'Reminders', icon: 'bell' },
  { id: 'sessions', label: 'Sessions', icon: 'calendar' },
  { id: 'chat', label: 'Chat', icon: 'message' },
  { id: 'summarizer', label: 'Summarizer', icon: 'search' },
  { id: 'feed', label: 'Live status', icon: 'activity' },
]

function ProgressDonut({ value, label, helper, stroke }) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - clamped / 100)

  return (
    <div className="portal-card" style={{ display: 'grid', placeItems: 'center', minHeight: '220px' }}>
      <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden>
        <circle cx="75" cy="75" r={radius} fill="none" stroke="var(--surface-muted)" strokeWidth="12" />
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 75 75)"
        />
        <text x="75" y="70" textAnchor="middle" style={{ fill: 'var(--text-h)', fontSize: '1.85rem', fontWeight: 700 }}>
          {clamped}%
        </text>
        <text x="75" y="92" textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: '0.78rem' }}>
          complete
        </text>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div className="portal-card__title">{label}</div>
        <div className="portal-card__meta">{helper}</div>
      </div>
    </div>
  )
}

export default function StudentPortalPage() {
  const { token, logout, role } = useAuth()
  const auth = { token }

  const { latestReminders, statusEvents, chatMessages } = useRealtime()

  const [sessions, setSessions] = useState([])
  const [myReminders, setMyReminders] = useState([])
  const [feedbackBySession, setFeedbackBySession] = useState({})
  const [activeFeedbackSessionId, setActiveFeedbackSessionId] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [summaryTitle, setSummaryTitle] = useState('')
  const [summaryAbstract, setSummaryAbstract] = useState('')
  const [summaryResult, setSummaryResult] = useState(null)
  const [summarizing, setSummarizing] = useState(false)
  const [assistantPrompt, setAssistantPrompt] = useState('')
  const [assistantReply, setAssistantReply] = useState('')
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('100')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [myProfile, setMyProfile] = useState(null)
  const username = myProfile?.username || ''
  const [photoUploading, setPhotoUploading] = useState(false)
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    if (!token) return

    apiFetch(`${SUPERVISION_URL}/api/sessions`, auth)
      .then(setSessions)
      .catch(console.error)

    apiFetch(`${AUTH_URL}/api/auth/me`, auth)
      .then(setMyProfile)
      .catch(console.error)

    apiFetch(`${NOTIFICATION_URL}/api/announcements`, auth)
      .then((items) => setAnnouncements(Array.isArray(items) ? items : []))
      .catch(console.error)

    apiFetch(`${NOTIFICATION_URL}/api/notifications/me`, auth)
      .then(setMyReminders)
      .catch(console.error)

    apiFetch(`${NOTIFICATION_URL}/api/chat/messages`, auth)
      .then((messages) => setChatHistory(Array.isArray(messages) ? messages : []))
      .catch(console.error)
  }, [token])

  useEffect(() => {
    if (!latestReminders.length) return
    setMyReminders((prev) => {
      const mine = latestReminders.filter((r) => r.recipientUsername === username)
      const merged = [...prev]
      const byId = new Map(merged.map((r) => [r.id, r]))
      for (const r of mine) byId.set(r.id, r)
      return Array.from(byId.values()).sort((a, b) => (b.dueAt ?? '').localeCompare(a.dueAt ?? ''))
    })
  }, [latestReminders, username])

  useEffect(() => {
    if (!chatMessages.length) return
    setChatHistory((prev) => {
      const byId = new Map(prev.map((message) => [message.id, message]))
      for (const message of chatMessages) {
        if (message?.id) {
          byId.set(message.id, message)
        }
      }
      return Array.from(byId.values()).sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''))
    })
  }, [chatMessages])

  async function createStripeCheckoutSession() {
    const amountValue = Number(paymentAmount)
    if (!amountValue || amountValue <= 0) {
      setPaymentError('Enter a valid MYR amount.')
      return
    }

    setPaymentLoading(true)
    setPaymentError('')
    try {
      const response = await apiFetch(`${INTEGRATION_URL}/api/integrations/payment/create-session`, auth, {
        method: 'POST',
        body: JSON.stringify({
          amount: amountValue,
          currency: 'myr',
          description: 'Student portal payment'
        })
      })

      if (response?.url) {
        window.location.href = response.url
      } else {
        setPaymentError('Unable to create payment session. Please try again.')
      }
    } catch (error) {
      setPaymentError(error.message || 'Payment initialization failed.')
    } finally {
      setPaymentLoading(false)
    }
  }

  async function loadFeedback(sessionId) {
    setActiveFeedbackSessionId(sessionId)
    try {
      const res = await apiFetch(`${SUPERVISION_URL}/api/sessions/${sessionId}/feedback`, auth)
      setFeedbackBySession((prev) => ({ ...prev, [sessionId]: res }))
    } catch (e) {
      console.error(e)
      setFeedbackBySession((prev) => ({ ...prev, [sessionId]: [] }))
    }
  }

  async function sendChatMessage() {
    const text = chatInput.trim()
    if (!text) return

    try {
      const sent = await apiFetch(`${NOTIFICATION_URL}/api/chat/messages`, auth, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
      setChatInput('')
      if (sent?.id) {
        setChatHistory((prev) => {
          const byId = new Map(prev.map((message) => [message.id, message]))
          byId.set(sent.id, sent)
          return Array.from(byId.values()).sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''))
        })
      }
    } catch (e) {
      console.error(e)
      alert('Failed to send chat message.')
    }
  }

  async function summarizePaper() {
    if (!summaryAbstract.trim()) return
    setSummarizing(true)
    try {
      const result = await apiFetch(`${INTEGRATION_URL}/api/integrations/summarize`, auth, {
        method: 'POST',
        body: JSON.stringify({
          title: summaryTitle.trim() || 'Untitled paper',
          abstractText: summaryAbstract,
          maxSentences: 3,
        }),
      })
      setSummaryResult(result)
    } catch (e) {
      console.error(e)
      setSummaryResult(null)
      alert('Failed to summarize paper.')
    } finally {
      setSummarizing(false)
    }
  }

  function handleProfilePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const photoData = ev.target.result
      setPhotoUploading(true)
      try {
        const updated = await apiFetch(`${AUTH_URL}/api/auth/me`, auth, {
          method: 'PATCH',
          body: JSON.stringify({ photoData }),
        })
        setMyProfile(updated)
      } catch (err) {
        console.error(err)
        alert('Failed to update photo: ' + err.message)
      } finally {
        setPhotoUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  async function askAssistant() {
    const message = assistantPrompt.trim()
    if (!message) return

    setAssistantLoading(true)
    try {
      const res = await apiFetch(`${INTEGRATION_URL}/api/ai/chat`, auth, {
        method: 'POST',
        body: JSON.stringify({ message }),
      })
      setAssistantReply(res?.reply ?? 'No response from assistant.')
    } catch (e) {
      console.error(e)
      setAssistantReply('Assistant is unavailable right now. Please try again.')
    } finally {
      setAssistantLoading(false)
    }
  }

  const thesisProgress = useMemo(() => {
    const total = sessions.length
    const byStatus = {
      PLANNED: sessions.filter((session) => session.status === 'PLANNED').length,
      ACTIVE: sessions.filter((session) => session.status === 'ACTIVE').length,
      COMPLETED: sessions.filter((session) => session.status === 'COMPLETED').length,
    }
    const feedbackReady = sessions.filter((session) => session.feedbackCount > 0).length
    const statusWeight = { PLANNED: 25, ACTIVE: 65, COMPLETED: 100 }
    const weightedTotal = sessions.reduce((sum, session) => sum + (statusWeight[session.status] ?? 0), 0)
    const completion = total ? Math.round(weightedTotal / total) : 0
    const feedbackCoverage = total ? Math.round((feedbackReady / total) * 100) : 0
    const upcomingDeadline = sessions
      .filter((session) => session.feedbackDeadlineAt)
      .sort((a, b) => a.feedbackDeadlineAt.localeCompare(b.feedbackDeadlineAt))[0]?.feedbackDeadlineAt

    const statusBreakdown = [
      { label: 'Planned', value: byStatus.PLANNED, color: '#c17c74' },
      { label: 'Active', value: byStatus.ACTIVE, color: '#d64545' },
      { label: 'Completed', value: byStatus.COMPLETED, color: '#6f8b5d' },
    ].map((item) => ({
      ...item,
      percent: total ? Math.round((item.value / total) * 100) : 0,
    }))

    return {
      total,
      completion,
      feedbackCoverage,
      feedbackReady,
      upcomingDeadline,
      statusBreakdown,
    }
  }, [sessions])

  const roleLabel = role === 'STUDENT' ? 'Student' : role

  const dashboardStats = useMemo(() => {
    const total = sessions.length
    const completed = sessions.filter((session) => session.status === 'COMPLETED').length
    const active = sessions.filter((session) => session.status === 'ACTIVE').length
    const planned = sessions.filter((session) => session.status === 'PLANNED').length
    const pendingReminders = myReminders.filter((reminder) => reminder.status === 'PENDING').length
    const nearestDeadline = myReminders
      .filter((reminder) => reminder.dueAt)
      .sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''))[0]?.dueAt

    return { total, completed, active, planned, pendingReminders, nearestDeadline }
  }, [sessions, myReminders])

  const assistantSidePanel = (
    <div className="portal-panel">
      <div className="portal-section__header" style={{ marginBottom: '0.85rem' }}>
        <h2 className="portal-section__title" style={{ fontSize: '1.05rem' }}>AI assistant</h2>
        <p className="portal-section__hint">Ask thesis questions from anywhere.</p>
      </div>
      <div className="portal-card" style={{ marginBottom: '0.85rem', minHeight: '170px' }}>
        <div className="portal-card__title">Assistant response</div>
        <div className="portal-card__body">{assistantReply || 'Your AI response will appear here.'}</div>
      </div>
      <div className="portal-field">
        <label htmlFor="assistant-prompt-side">Your question</label>
        <textarea
          id="assistant-prompt-side"
          rows={5}
          value={assistantPrompt}
          onChange={(e) => setAssistantPrompt(e.target.value)}
          placeholder="Example: Suggest a stronger methodology section for my FYP."
        />
      </div>
      <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="portal-btn portal-btn--primary"
          disabled={assistantLoading || !assistantPrompt.trim()}
          onClick={askAssistant}
        >
          {assistantLoading ? 'Thinking…' : 'Ask AI'}
        </button>
      </div>
    </div>
  )

  return (
    <PortalLayout
      brand="FYP Portal"
      title="Student"
      subtitle="Your supervision schedule, reminders, and real-time workflow updates."
      navItems={NAV}
      username={username}
      roleLabel={roleLabel}
      onLogout={logout}
      activeSection={activeSection}
      onNavClick={setActiveSection}
      sidePanel={assistantSidePanel}
    >
      {activeSection === 'dashboard' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">Dashboard</h2>
          <p className="portal-section__hint">Central hub for thesis status, deadlines, and recent activities.</p>
        </div>

        {/* ── Student profile card ── */}
        <div className="portal-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              border: '3px solid var(--accent)',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--surface-muted)',
            }}>
              {myProfile?.photoData
                ? <img src={myProfile.photoData} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '2.2rem' }}>👤</span>
              }
            </div>
            {/* Overlay change-photo button */}
            <label
              htmlFor="student-photo-input"
              title="Change photo"
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--accent)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.3)',
                opacity: photoUploading ? 0.5 : 1,
              }}
            >
              {photoUploading ? '…' : '✎'}
            </label>
            <input
              id="student-photo-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleProfilePhotoChange}
              disabled={photoUploading}
            />
          </div>

          {/* Profile info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-h)', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {myProfile?.fullName ?? username}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '0.4rem' }}>@{username}</div>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {myProfile?.studentId && (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>🪪 {myProfile.studentId}</span>
              )}
              {myProfile?.courseName && (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>📚 {myProfile.courseName}</span>
              )}
              {myProfile?.email && (
                <a href={`mailto:${myProfile.email}`} style={{ fontSize: '0.82rem', color: 'var(--accent)', textDecoration: 'none' }}>✉ {myProfile.email}</a>
              )}
            </div>
          </div>
        </div>
        <div className="portal-stats">
          <div className="portal-stat">
            <div className="portal-stat__value">{dashboardStats.total}</div>
            <div className="portal-stat__label">Total sessions</div>
          </div>
          <div className="portal-stat">
            <div className="portal-stat__value">{dashboardStats.active}</div>
            <div className="portal-stat__label">Active sessions</div>
          </div>
          <div className="portal-stat">
            <div className="portal-stat__value">{dashboardStats.pendingReminders}</div>
            <div className="portal-stat__label">Pending reminders</div>
          </div>
          <div className="portal-stat">
            <div className="portal-stat__value">{dashboardStats.completed}</div>
            <div className="portal-stat__label">Completed milestones</div>
          </div>
        </div>
        <div className="portal-grid" style={{ marginTop: '1rem' }}>
          <div className="portal-card">
            <div className="portal-card__title">Upcoming deadline</div>
            <div className="portal-card__body">{dashboardStats.nearestDeadline ?? 'No deadlines available'}</div>
            <div className="portal-card__meta">Keep this in check to avoid overdue submissions.</div>
          </div>
          <div className="portal-card">
            <div className="portal-card__title">Quick access</div>
            <div className="portal-card__body" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" className="portal-btn portal-btn--secondary" onClick={() => setActiveSection('progress')}>Progress</button>
              <button type="button" className="portal-btn portal-btn--secondary" onClick={() => setActiveSection('chat')}>Chat advisor</button>
              <button type="button" className="portal-btn portal-btn--secondary" onClick={() => setActiveSection('summarizer')}>Paper summarizer</button>
            </div>
          </div>
          <div className="portal-card">
            <div className="portal-card__title">Pay fees (MYR)</div>
            <div className="portal-card__body">
              <div className="portal-field" style={{ marginBottom: '0.85rem' }}>
                <label htmlFor="payment-amount">Payment amount</label>
                <input
                  id="payment-amount"
                  type="number"
                  min="1"
                  step="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="100"
                />
              </div>
              <button
                type="button"
                className="portal-btn portal-btn--primary"
                onClick={createStripeCheckoutSession}
                disabled={paymentLoading}
              >
                {paymentLoading ? 'Redirecting to Stripe…' : 'Pay with Stripe'}
              </button>
              {paymentError ? (
                <div className="portal-card__meta" style={{ marginTop: '0.75rem', color: 'var(--danger)' }}>
                  {paymentError}
                </div>
              ) : null}
            </div>
            <div className="portal-card__meta">Secure Malaysian payment via Stripe Checkout.</div>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <div className="portal-section__header" style={{ marginBottom: '0.85rem' }}>
            <h3 className="portal-section__title" style={{ fontSize: '1.05rem' }}>Announcements & ads</h3>
            <p className="portal-section__hint">Latest updates from university admins.</p>
          </div>
          <div className="portal-grid">
            {announcements.length ? (
              announcements.slice(0, 6).map((announcement) => (
                <div key={announcement.id} className="portal-card" style={{ overflow: 'hidden' }}>
                  {announcement.imageUrl ? (
                    <div
                      style={{
                        height: '140px',
                        borderRadius: '0.9rem',
                        marginBottom: '0.85rem',
                        backgroundImage: `url(${announcement.imageUrl})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                  ) : null}
                  <div className="portal-card__row" style={{ alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div className="portal-card__title" style={{ flex: 1 }}>{announcement.title}</div>
                    {announcement.pinned ? <span className="portal-badge">Pinned</span> : null}
                  </div>
                  <div className="portal-card__meta" style={{ marginTop: '0.35rem' }}>
                    Posted by {announcement.createdByUsername} · {new Date(announcement.createdAt).toLocaleString()}
                  </div>
                  <div className="portal-card__body" style={{ marginTop: '0.75rem' }}>{announcement.content}</div>
                  {announcement.linkUrl ? (
                    <div style={{ marginTop: '0.9rem' }}>
                      <a href={announcement.linkUrl} target="_blank" rel="noreferrer" className="portal-btn portal-btn--secondary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                        Open link
                      </a>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="portal-empty">No announcements yet.</div>
            )}
          </div>
        </div>
      </section>
      )}

      {activeSection === 'progress' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">Thesis progress</h2>
          <p className="portal-section__hint">A quick visual view of your current supervision progress.</p>
        </div>
        <div className="portal-grid" style={{ alignItems: 'stretch' }}>
          <ProgressDonut
            value={thesisProgress.completion}
            label="Overall thesis progress"
            helper={thesisProgress.total ? `${thesisProgress.total} supervision milestone(s) tracked` : 'No sessions yet'}
            stroke="var(--accent)"
          />
          <ProgressDonut
            value={thesisProgress.feedbackCoverage}
            label="Feedback coverage"
            helper={thesisProgress.total ? `${thesisProgress.feedbackReady}/${thesisProgress.total} sessions with feedback` : 'Waiting for first review'}
            stroke="#6f8b5d"
          />
          <div className="portal-card" style={{ minHeight: '220px' }}>
            <div className="portal-card__title">Progress breakdown</div>
            <div className="portal-card__meta" style={{ marginTop: '0.35rem' }}>
              Next deadline · {thesisProgress.upcomingDeadline ?? 'Not scheduled yet'}
            </div>
            <div style={{ display: 'grid', gap: '0.9rem', marginTop: '1rem' }}>
              {thesisProgress.statusBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="portal-card__row" style={{ marginBottom: '0.35rem' }}>
                    <span className="portal-card__meta">{item.label}</span>
                    <span className="portal-card__meta">{item.value} · {item.percent}%</span>
                  </div>
                  <div style={{ height: '10px', borderRadius: '999px', background: 'var(--surface-muted)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${item.percent}%`,
                        height: '100%',
                        borderRadius: '999px',
                        background: item.color,
                        transition: 'width 0.25s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      {activeSection === 'reminders' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">Real-time reminders</h2>
          <p className="portal-section__hint">Pushed when workflows run</p>
        </div>
        <div className="portal-grid">
          {myReminders.length ? (
            myReminders.slice(0, 10).map((r) => (
              <div key={r.id} className="portal-card">
                <div className="portal-card__row">
                  <span className="portal-badge">{r.status}</span>
                </div>
                <div className="portal-card__body">{r.message}</div>
                <div className="portal-card__meta">Due · {r.dueAt}</div>
              </div>
            ))
          ) : (
            <div className="portal-empty">No reminders yet — you&apos;re all caught up.</div>
          )}
        </div>
      </section>
      )}

      {activeSection === 'sessions' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">Supervision sessions</h2>
          <p className="portal-section__hint">Programs and feedback from your supervisor</p>
        </div>
        <div className="portal-grid">
          {sessions.length ? (
            sessions.map((s) => (
              <div key={s.id} className="portal-card">
                <div className="portal-card__row">
                  <div>
                    <div className="portal-card__title">{s.programName ?? 'Program'}</div>
                    <div className="portal-card__meta">Supervisor · {s.supervisorUsername}</div>
                  </div>
                  <span className="portal-badge">{s.status}</span>
                </div>
                <div className="portal-card__meta" style={{ marginTop: '0.5rem' }}>
                  Scheduled {s.scheduledAt}
                  {s.feedbackDeadlineAt ? ` · Feedback due ${s.feedbackDeadlineAt}` : ''}
                </div>

                {s.feedbackCount > 0 ? (
                  <div style={{ marginTop: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="portal-btn portal-btn--secondary"
                      onClick={() =>
                        activeFeedbackSessionId === s.id ? setActiveFeedbackSessionId(null) : loadFeedback(s.id)
                      }
                    >
                      {activeFeedbackSessionId === s.id ? 'Hide feedback' : 'View feedback'}
                    </button>
                    <span className="portal-card__meta">{s.feedbackCount} item(s)</span>
                  </div>
                ) : null}

                {activeFeedbackSessionId === s.id && feedbackBySession[s.id]?.length ? (
                  <div className="portal-grid" style={{ marginTop: '0.85rem' }}>
                    {feedbackBySession[s.id].map((f) => (
                      <div key={f.id} className="portal-card" style={{ background: 'var(--surface-muted)' }}>
                        <span className="portal-badge">{f.status}</span>
                        <div className="portal-card__meta" style={{ marginTop: '0.35rem' }}>
                          {f.submittedByUsername} · {f.submittedAt}
                        </div>
                        <div className="portal-card__body">{f.feedbackText}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="portal-empty">No sessions found.</div>
          )}
        </div>
      </section>
      )}

      {activeSection === 'chat' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">Advisor chat</h2>
          <p className="portal-section__hint">Collaborate with advisors using real-time text messages.</p>
        </div>
        <div className="portal-panel">
          <div className="portal-field">
            <label htmlFor="chat-input">Message</label>
            <textarea
              id="chat-input"
              rows={3}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Write your update or question…"
            />
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="portal-btn portal-btn--primary" onClick={sendChatMessage}>
              Send message
            </button>
          </div>
        </div>
        <div className="portal-grid" style={{ marginTop: '1rem' }}>
          {chatHistory.length ? (
            chatHistory.slice(0, 20).map((message) => (
              <div key={message.id} className="portal-card">
                <div className="portal-card__row">
                  <span className="portal-card__title">{message.fromUsername}</span>
                  <span className="portal-card__meta">{message.sentAt}</span>
                </div>
                <div className="portal-card__body">{message.text}</div>
              </div>
            ))
          ) : (
            <div className="portal-empty">No chat messages yet.</div>
          )}
        </div>
      </section>
      )}

      {activeSection === 'summarizer' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">Research paper summarization</h2>
          <p className="portal-section__hint">Generate quick abstract summaries to support thesis writing.</p>
        </div>
        <div className="portal-panel">
          <div className="portal-field">
            <label htmlFor="summary-title">Paper title</label>
            <input
              id="summary-title"
              value={summaryTitle}
              onChange={(e) => setSummaryTitle(e.target.value)}
              placeholder="Paper title"
            />
          </div>
          <div className="portal-field" style={{ marginTop: '0.75rem' }}>
            <label htmlFor="summary-abstract">Abstract / content</label>
            <textarea
              id="summary-abstract"
              rows={6}
              value={summaryAbstract}
              onChange={(e) => setSummaryAbstract(e.target.value)}
              placeholder="Paste abstract or selected content..."
            />
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="portal-btn portal-btn--primary"
              onClick={summarizePaper}
              disabled={summarizing || !summaryAbstract.trim()}
            >
              {summarizing ? 'Summarizing…' : 'Generate summary'}
            </button>
          </div>
        </div>

        {summaryResult ? (
          <div className="portal-card" style={{ marginTop: '1rem' }}>
            <div className="portal-card__title">{summaryResult.title}</div>
            <div className="portal-card__body">{summaryResult.summary}</div>
            <div className="portal-card__meta">
              {summaryResult.sentencesUsed} sentence(s) · {summaryResult.note}
            </div>
          </div>
        ) : null}
      </section>
      )}

      {activeSection === 'feed' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">Workflow status feed</h2>
          <p className="portal-section__hint">Live updates from the notification service</p>
        </div>
        <div className="portal-grid">
          {statusEvents.length ? (
            statusEvents.slice(0, 12).map((ev, idx) => (
              <div key={`${ev.sessionId}-${ev.timestamp}-${idx}`} className="portal-card">
                <div className="portal-card__title">{ev.type}</div>
                <div className="portal-card__body">{ev.message}</div>
                <div className="portal-card__meta">{ev.timestamp}</div>
              </div>
            ))
          ) : (
            <div className="portal-empty">Waiting for events…</div>
          )}
        </div>
      </section>
      )}
    </PortalLayout>
  )
}
