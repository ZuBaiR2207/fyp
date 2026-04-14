import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../state/AuthContext'
import PortalLayout from '../components/PortalLayout.jsx'
import { INTEGRATION_URL, NOTIFICATION_URL, REPORTING_URL, SUPERVISION_URL, apiFetch } from '../api/api'
import { useRealtime } from '../hooks/useRealtime'

const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:8081'

const NAV = [
  { id: 'dashboard', label: 'Overview', icon: 'layout' },
  { id: 'theses', label: 'Theses', icon: 'book' },
  { id: 'sessions', label: 'Sessions', icon: 'calendar' },
  { id: 'feedback', label: 'Feedback', icon: 'message' },
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'chat', label: 'Chat', icon: 'message' },
  { id: 'analytics', label: 'Analytics', icon: 'chart' },
  { id: 'integrations', label: 'Integrations', icon: 'search' },
  { id: 'feed', label: 'Live status', icon: 'activity' },
]

const THESIS_STATUS_COLORS = {
  TOPIC_PROPOSED: '#94a3b8',
  TOPIC_APPROVED: '#60a5fa',
  PROPOSAL_SUBMITTED: '#a78bfa',
  PROPOSAL_UNDER_REVIEW: '#f59e0b',
  PROPOSAL_REVISION_REQUIRED: '#f97316',
  PROPOSAL_APPROVED: '#22c55e',
  LITERATURE_REVIEW: '#8b5cf6',
  METHODOLOGY: '#06b6d4',
  DATA_COLLECTION: '#14b8a6',
  DATA_ANALYSIS: '#10b981',
  WRITING: '#3b82f6',
  DRAFT_SUBMITTED: '#6366f1',
  DRAFT_UNDER_REVIEW: '#f59e0b',
  REVISION_IN_PROGRESS: '#f97316',
  FINAL_SUBMITTED: '#8b5cf6',
  DEFENSE_SCHEDULED: '#ec4899',
  COMPLETED: '#22c55e',
  FAILED: '#ef4444',
}

const MILESTONE_STATUS_COLORS = {
  NOT_STARTED: '#9ca3af',
  IN_PROGRESS: '#3b82f6',
  SUBMITTED: '#f59e0b',
  UNDER_REVIEW: '#a855f7',
  REVISION_REQUIRED: '#f97316',
  APPROVED: '#22c55e',
}

export default function UniversityPortalPage() {
  const { token, logout, role } = useAuth()
  const auth = { token }
  const { statusEvents, chatMessages } = useRealtime()

  // User management state
  const [supervisors, setSupervisors] = useState([])
  const [students, setStudents] = useState([])
  const [showCreateSupervisor, setShowCreateSupervisor] = useState(false)
  const [showCreateStudent, setShowCreateStudent] = useState(false)
  const [newSupervisorUsername, setNewSupervisorUsername] = useState('')
  const [newSupervisorPassword, setNewSupervisorPassword] = useState('')
  const [newStudentUsername, setNewStudentUsername] = useState('')
  const [newStudentPassword, setNewStudentPassword] = useState('')
  const [newStudentFullName, setNewStudentFullName] = useState('')
  const [newStudentEmail, setNewStudentEmail] = useState('')
  const [newStudentStudentId, setNewStudentStudentId] = useState('')
  const [newStudentCourseName, setNewStudentCourseName] = useState('')
  const [newStudentPhoto, setNewStudentPhoto] = useState('')  // base64 data URL
  const [editingUserId, setEditingUserId] = useState(null)
  const [editingPassword, setEditingPassword] = useState('')
  const [editingUser, setEditingUser] = useState(null) // full user object being edited
  const [editUserForm, setEditUserForm] = useState({
    fullName: '',
    email: '',
    studentId: '',
    courseName: '',
    password: '',
    photoData: '',
  })

  const [programs, setPrograms] = useState([])
  const [newProgramName, setNewProgramName] = useState('')
  const [creatingProgram, setCreatingProgram] = useState(false)
  const [sessions, setSessions] = useState([])
  const [studentFilter, setStudentFilter] = useState('')
  const [sessionDraft, setSessionDraft] = useState({
    programId: '',
    studentUsername: '',
    supervisorUsername: '',
    scheduledAt: '',
    feedbackDeadlineAt: '',
    notes: '',
  })
  const [creatingSession, setCreatingSession] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [assistantPrompt, setAssistantPrompt] = useState('')
  const [assistantReply, setAssistantReply] = useState('')
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [myProfile, setMyProfile] = useState(null)
  const username = myProfile?.username || ''
  const [photoUploading, setPhotoUploading] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [announcementDraft, setAnnouncementDraft] = useState({
    title: '',
    content: '',
    imageUrl: '',
    linkUrl: '',
    pinned: false,
  })
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false)

  const [reportSummary, setReportSummary] = useState(null)
  const [accreditationSummary, setAccreditationSummary] = useState(null)
  const [academicQuery, setAcademicQuery] = useState('')
  const [academicResults, setAcademicResults] = useState([])
  const [fundingQuery, setFundingQuery] = useState('')
  const [fundingResults, setFundingResults] = useState([])
  const [libraryQuery, setLibraryQuery] = useState('')
  const [libraryResults, setLibraryResults] = useState([])
  const [libraryIsbn, setLibraryIsbn] = useState('')
  const [librarySearchMode, setLibrarySearchMode] = useState('keyword')

  // Thesis management state
  const [theses, setTheses] = useState([])
  const [thesesLoading, setThesesLoading] = useState(false)
  const [selectedThesis, setSelectedThesis] = useState(null)
  const [thesisMilestones, setThesisMilestones] = useState([])
  const [thesisSubmissions, setThesisSubmissions] = useState([])
  const [thesisFilter, setThesisFilter] = useState({ status: '', studentUsername: '' })
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    description: '',
    dueDate: '',
    weightPercentage: 10,
  })
  const [feedbackingMilestone, setFeedbackingMilestone] = useState(null)
  const [milestoneFeedback, setMilestoneFeedback] = useState('')
  const [submissionReviewModal, setSubmissionReviewModal] = useState(null)
  const [submissionReview, setSubmissionReview] = useState({ comments: '', approved: false })
  const [scheduleDefenseModal, setScheduleDefenseModal] = useState(false)
  const [defenseForm, setDefenseForm] = useState({
    scheduledAt: '',
    venue: '',
    examiners: '',
  })

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

  async function fetchPrograms() {
    try {
      const res = await apiFetch(`${SUPERVISION_URL}/api/programs`, auth)
      setPrograms(Array.isArray(res) ? res : [])
    } catch (e) {
      console.error(e)
      setPrograms([])
    }
  }

  async function fetchSessions() {
    const url = new URL(`${SUPERVISION_URL}/api/sessions`)
    if (studentFilter.trim()) url.searchParams.set('studentUsername', studentFilter.trim())
    const res = await apiFetch(url.toString(), auth)
    setSessions(res)
  }

  async function fetchChatHistory() {
    try {
      const res = await apiFetch(`${NOTIFICATION_URL}/api/chat/messages`, auth)
      setChatHistory(Array.isArray(res) ? res : [])
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchAnnouncements() {
    try {
      const res = await apiFetch(`${NOTIFICATION_URL}/api/announcements`, auth)
      setAnnouncements(Array.isArray(res) ? res : [])
    } catch (e) {
      console.error(e)
      setAnnouncements([])
    }
  }

  async function createAnnouncement() {
    if (role !== 'UNIVERSITY_ADMIN' || !announcementDraft.title.trim() || !announcementDraft.content.trim()) return

    setCreatingAnnouncement(true)
    try {
      const created = await apiFetch(`${NOTIFICATION_URL}/api/announcements`, auth, {
        method: 'POST',
        body: JSON.stringify({
          title: announcementDraft.title.trim(),
          content: announcementDraft.content.trim(),
          imageUrl: announcementDraft.imageUrl.trim() || null,
          linkUrl: announcementDraft.linkUrl.trim() || null,
          pinned: announcementDraft.pinned,
        }),
      })
      setAnnouncements((prev) => [created, ...prev].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
      }))
      setAnnouncementDraft({ title: '', content: '', imageUrl: '', linkUrl: '', pinned: false })
    } catch (e) {
      console.error(e)
      alert('Error creating announcement: ' + e.message)
    } finally {
      setCreatingAnnouncement(false)
    }
  }

  async function deleteAnnouncement(announcementId) {
    try {
      await apiFetch(`${NOTIFICATION_URL}/api/announcements/${announcementId}`, auth, { method: 'DELETE' })
      setAnnouncements((prev) => prev.filter((item) => item.id !== announcementId))
    } catch (e) {
      console.error(e)
      alert('Error deleting announcement: ' + e.message)
    }
  }

  async function fetchSupervisors() {
    try {
      const res = await apiFetch(`${AUTH_URL}/api/auth/users?role=SUPERVISOR`, auth)
      setSupervisors(res)
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchStudents() {
    try {
      const res = await apiFetch(`${AUTH_URL}/api/auth/users?role=STUDENT`, auth)
      setStudents(res)
    } catch (e) {
      console.error(e)
    }
  }

  async function createSupervisor() {
    if (!newSupervisorUsername.trim() || !newSupervisorPassword.trim()) return
    try {
      await apiFetch(`${AUTH_URL}/api/auth/users`, auth, {
        method: 'POST',
        body: JSON.stringify({
          username: newSupervisorUsername,
          password: newSupervisorPassword,
          role: 'SUPERVISOR',
        }),
      })
      setNewSupervisorUsername('')
      setNewSupervisorPassword('')
      setShowCreateSupervisor(false)
      fetchSupervisors()
    } catch (e) {
      console.error(e)
      alert('Error creating supervisor: ' + e.message)
    }
  }

  async function createStudent() {
    if (!newStudentUsername.trim() || !newStudentPassword.trim()) return
    try {
      await apiFetch(`${AUTH_URL}/api/auth/users`, auth, {
        method: 'POST',
        body: JSON.stringify({
          username: newStudentUsername.trim(),
          password: newStudentPassword,
          role: 'STUDENT',
          fullName: newStudentFullName.trim() || null,
          email: newStudentEmail.trim() || null,
          studentId: newStudentStudentId.trim() || null,
          courseName: newStudentCourseName.trim() || null,
          photoData: newStudentPhoto || null,
        }),
      })
      setNewStudentUsername('')
      setNewStudentPassword('')
      setNewStudentFullName('')
      setNewStudentEmail('')
      setNewStudentStudentId('')
      setNewStudentCourseName('')
      setNewStudentPhoto('')
      setShowCreateStudent(false)
      fetchStudents()
    } catch (e) {
      console.error(e)
      alert('Error creating student: ' + e.message)
    }
  }

  function handleStudentPhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setNewStudentPhoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function createProgram() {
    if (role !== 'UNIVERSITY_ADMIN' || !newProgramName.trim()) return

    setCreatingProgram(true)
    try {
      const created = await apiFetch(`${SUPERVISION_URL}/api/programs`, auth, {
        method: 'POST',
        body: JSON.stringify({ name: newProgramName.trim() }),
      })
      setNewProgramName('')
      setPrograms((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setSessionDraft((prev) => ({ ...prev, programId: prev.programId || created.id }))
    } catch (e) {
      console.error(e)
      alert('Error creating program: ' + e.message)
    } finally {
      setCreatingProgram(false)
    }
  }

  async function createSession() {
    const payload = {
      programId: sessionDraft.programId,
      studentUsername: sessionDraft.studentUsername.trim(),
      supervisorUsername: (sessionDraft.supervisorUsername || username).trim(),
      scheduledAt: sessionDraft.scheduledAt,
      feedbackDeadlineAt: sessionDraft.feedbackDeadlineAt || null,
      notes: sessionDraft.notes.trim(),
    }

    if (!payload.programId || !payload.studentUsername || !payload.supervisorUsername || !payload.scheduledAt) {
      return
    }

    setCreatingSession(true)
    try {
      await apiFetch(`${SUPERVISION_URL}/api/sessions`, auth, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setSessionDraft((prev) => ({
        ...prev,
        studentUsername: '',
        scheduledAt: '',
        feedbackDeadlineAt: '',
        notes: '',
      }))
      fetchSessions().catch(console.error)
    } catch (e) {
      console.error(e)
      alert('Error logging session: ' + e.message)
    } finally {
      setCreatingSession(false)
    }
  }

  async function updateUserPassword(userId, newPassword) {
    if (!newPassword.trim()) return
    try {
      await apiFetch(`${AUTH_URL}/api/auth/users/${userId}`, auth, {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword }),
      })
      setEditingUserId(null)
      setEditingPassword('')
      if (role === 'UNIVERSITY_ADMIN') {
        fetchSupervisors()
      }
      if (role === 'UNIVERSITY_ADMIN' || role === 'SUPERVISOR') {
        fetchStudents()
      }
    } catch (e) {
      console.error(e)
      alert('Error updating password: ' + e.message)
    }
  }

  function startEditingUser(user) {
    setEditingUser(user)
    setEditUserForm({
      fullName: user.fullName || '',
      email: user.email || '',
      studentId: user.studentId || '',
      courseName: user.courseName || '',
      password: '',
      photoData: user.photoData || '',
    })
  }

  function cancelEditingUser() {
    setEditingUser(null)
    setEditUserForm({ fullName: '', email: '', studentId: '', courseName: '', password: '', photoData: '' })
  }

  async function saveUserChanges() {
    if (!editingUser) return
    try {
      const payload = {}
      if (editUserForm.fullName !== (editingUser.fullName || '')) payload.fullName = editUserForm.fullName
      if (editUserForm.email !== (editingUser.email || '')) payload.email = editUserForm.email
      if (editUserForm.studentId !== (editingUser.studentId || '')) payload.studentId = editUserForm.studentId
      if (editUserForm.courseName !== (editingUser.courseName || '')) payload.courseName = editUserForm.courseName
      if (editUserForm.password.trim()) payload.password = editUserForm.password
      if (editUserForm.photoData !== (editingUser.photoData || '')) payload.photoData = editUserForm.photoData

      if (Object.keys(payload).length === 0) {
        alert('No changes to save')
        return
      }

      await apiFetch(`${AUTH_URL}/api/auth/users/${editingUser.id}`, auth, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      cancelEditingUser()
      if (role === 'UNIVERSITY_ADMIN') {
        fetchSupervisors()
      }
      if (role === 'UNIVERSITY_ADMIN' || role === 'SUPERVISOR') {
        fetchStudents()
      }
    } catch (e) {
      console.error(e)
      alert('Error updating user: ' + e.message)
    }
  }

  function handleEditUserPhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setEditUserForm((prev) => ({ ...prev, photoData: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await apiFetch(`${AUTH_URL}/api/auth/users/${userId}`, auth, {
        method: 'DELETE',
      })
      if (role === 'UNIVERSITY_ADMIN') {
        fetchSupervisors()
      }
      if (role === 'UNIVERSITY_ADMIN' || role === 'SUPERVISOR') {
        fetchStudents()
      }
    } catch (e) {
      console.error(e)
      alert('Error deleting user: ' + e.message)
    }
  }

  // ===================== THESIS MANAGEMENT FUNCTIONS =====================

  async function fetchTheses() {
    setThesesLoading(true)
    try {
      const url = new URL(`${SUPERVISION_URL}/api/theses`)
      if (thesisFilter.status) url.searchParams.set('status', thesisFilter.status)
      if (thesisFilter.studentUsername) url.searchParams.set('studentUsername', thesisFilter.studentUsername)
      // For supervisors, only show their supervised theses
      if (role === 'SUPERVISOR' && username) {
        url.searchParams.set('supervisorUsername', username)
      }
      const res = await apiFetch(url.toString(), auth)
      setTheses(Array.isArray(res) ? res : [])
    } catch (e) {
      console.error(e)
      setTheses([])
    } finally {
      setThesesLoading(false)
    }
  }

  async function fetchThesisDetails(thesisId) {
    try {
      const thesis = await apiFetch(`${SUPERVISION_URL}/api/theses/${thesisId}`, auth)
      setSelectedThesis(thesis)
      // Fetch milestones and submissions
      const [milestones, submissions] = await Promise.all([
        apiFetch(`${SUPERVISION_URL}/api/theses/${thesisId}/milestones`, auth),
        apiFetch(`${SUPERVISION_URL}/api/theses/${thesisId}/submissions`, auth),
      ])
      setThesisMilestones(Array.isArray(milestones) ? milestones : [])
      setThesisSubmissions(Array.isArray(submissions) ? submissions : [])
    } catch (e) {
      console.error(e)
      alert('Failed to load thesis details: ' + e.message)
    }
  }

  async function updateThesisStatus(thesisId, status) {
    try {
      const updated = await apiFetch(`${SUPERVISION_URL}/api/theses/${thesisId}`, auth, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      setSelectedThesis(updated)
      fetchTheses()
    } catch (e) {
      console.error(e)
      alert('Failed to update thesis status: ' + e.message)
    }
  }

  async function assignSupervisor(thesisId, supervisorUsername) {
    try {
      const updated = await apiFetch(`${SUPERVISION_URL}/api/theses/${thesisId}/assign-supervisor?supervisorUsername=${supervisorUsername}`, auth, {
        method: 'POST',
      })
      setSelectedThesis(updated)
      fetchTheses()
    } catch (e) {
      console.error(e)
      alert('Failed to assign supervisor: ' + e.message)
    }
  }

  async function createMilestone() {
    if (!selectedThesis?.id || !milestoneForm.name.trim()) {
      alert('Please enter a milestone name')
      return
    }
    try {
      await apiFetch(`${SUPERVISION_URL}/api/theses/${selectedThesis.id}/milestones`, auth, {
        method: 'POST',
        body: JSON.stringify({
          name: milestoneForm.name,
          description: milestoneForm.description,
          dueDate: milestoneForm.dueDate || null,
          weightPercentage: milestoneForm.weightPercentage,
          orderIndex: thesisMilestones.length,
        }),
      })
      setShowMilestoneModal(false)
      setMilestoneForm({ name: '', description: '', dueDate: '', weightPercentage: 10 })
      const milestones = await apiFetch(`${SUPERVISION_URL}/api/theses/${selectedThesis.id}/milestones`, auth)
      setThesisMilestones(Array.isArray(milestones) ? milestones : [])
    } catch (e) {
      console.error(e)
      alert('Failed to create milestone: ' + e.message)
    }
  }

  async function updateMilestoneStatus(milestoneId, status) {
    if (!selectedThesis?.id) return
    try {
      await apiFetch(`${SUPERVISION_URL}/api/theses/${selectedThesis.id}/milestones/${milestoneId}`, auth, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      const milestones = await apiFetch(`${SUPERVISION_URL}/api/theses/${selectedThesis.id}/milestones`, auth)
      setThesisMilestones(Array.isArray(milestones) ? milestones : [])
    } catch (e) {
      console.error(e)
      alert('Failed to update milestone: ' + e.message)
    }
  }

  async function submitMilestoneFeedback() {
    if (!selectedThesis?.id || !feedbackingMilestone?.id || !milestoneFeedback.trim()) {
      alert('Please enter feedback')
      return
    }
    try {
      await apiFetch(`${SUPERVISION_URL}/api/theses/${selectedThesis.id}/milestones/${feedbackingMilestone.id}/feedback`, auth, {
        method: 'POST',
        body: JSON.stringify({ feedback: milestoneFeedback }),
      })
      setFeedbackingMilestone(null)
      setMilestoneFeedback('')
      const milestones = await apiFetch(`${SUPERVISION_URL}/api/theses/${selectedThesis.id}/milestones`, auth)
      setThesisMilestones(Array.isArray(milestones) ? milestones : [])
    } catch (e) {
      console.error(e)
      alert('Failed to submit feedback: ' + e.message)
    }
  }

  async function reviewSubmission() {
    if (!selectedThesis?.id || !submissionReviewModal?.id) return
    try {
      await apiFetch(`${SUPERVISION_URL}/api/theses/${selectedThesis.id}/submissions/${submissionReviewModal.id}/review`, auth, {
        method: 'POST',
        body: JSON.stringify({
          comments: submissionReview.comments,
          approved: submissionReview.approved,
        }),
      })
      setSubmissionReviewModal(null)
      setSubmissionReview({ comments: '', approved: false })
      const submissions = await apiFetch(`${SUPERVISION_URL}/api/theses/${selectedThesis.id}/submissions`, auth)
      setThesisSubmissions(Array.isArray(submissions) ? submissions : [])
    } catch (e) {
      console.error(e)
      alert('Failed to review submission: ' + e.message)
    }
  }

  async function scheduleDefense() {
    if (!selectedThesis?.id || !defenseForm.scheduledAt) {
      alert('Please select a defense date/time')
      return
    }
    try {
      await apiFetch(`${SUPERVISION_URL}/api/theses/${selectedThesis.id}/defense`, auth, {
        method: 'POST',
        body: JSON.stringify({
          scheduledAt: defenseForm.scheduledAt,
          venue: defenseForm.venue,
          examiners: defenseForm.examiners,
        }),
      })
      setScheduleDefenseModal(false)
      setDefenseForm({ scheduledAt: '', venue: '', examiners: '' })
      fetchThesisDetails(selectedThesis.id)
    } catch (e) {
      console.error(e)
      alert('Failed to schedule defense: ' + e.message)
    }
  }

  async function recordDefenseOutcome(outcome, comments, finalGrade) {
    if (!selectedThesis?.id) return
    try {
      await apiFetch(`${SUPERVISION_URL}/api/theses/${selectedThesis.id}/defense/outcome`, auth, {
        method: 'POST',
        body: JSON.stringify({ outcome, comments, finalGrade }),
      })
      fetchThesisDetails(selectedThesis.id)
    } catch (e) {
      console.error(e)
      alert('Failed to record defense outcome: ' + e.message)
    }
  }

  useEffect(() => {
    if (!token) return
    fetchPrograms().catch(console.error)
    fetchSessions().catch(console.error)
    fetchChatHistory().catch(console.error)
    fetchAnnouncements().catch(console.error)
    fetchTheses().catch(console.error) // Fetch theses for dashboard stats
    apiFetch(`${AUTH_URL}/api/auth/me`, auth).then(setMyProfile).catch(console.error)
    if (role === 'UNIVERSITY_ADMIN') {
      fetchSupervisors()
    }
    if (role === 'UNIVERSITY_ADMIN' || role === 'SUPERVISOR') {
      fetchStudents()
    }
  }, [token, role, studentFilter])

  // Fetch theses when viewing theses section
  useEffect(() => {
    if (activeSection === 'theses' && token) {
      fetchTheses()
    }
  }, [activeSection, token, thesisFilter.status, thesisFilter.studentUsername, username])

  useEffect(() => {
    if (!programs.length) return
    setSessionDraft((prev) => ({
      ...prev,
      programId: prev.programId || programs[0].id,
    }))
  }, [programs])

  useEffect(() => {
    if (role !== 'SUPERVISOR') return
    setSessionDraft((prev) => ({
      ...prev,
      supervisorUsername: username,
    }))
  }, [role, username])

  useEffect(() => {
    if (role !== 'UNIVERSITY_ADMIN' || !supervisors.length) return
    setSessionDraft((prev) => ({
      ...prev,
      supervisorUsername: prev.supervisorUsername || supervisors[0].username,
    }))
  }, [role, supervisors])

  useEffect(() => {
    if (!students.length) return
    setSessionDraft((prev) => ({
      ...prev,
      studentUsername: prev.studentUsername || students[0].username,
    }))
  }, [students])

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

  const dashboard = useMemo(() => {
    const total = sessions.length
    const completed = sessions.filter((s) => s.status === 'COMPLETED').length
    const active = sessions.filter((s) => s.status === 'ACTIVE').length
    const planned = sessions.filter((s) => s.status === 'PLANNED').length
    const weighted = sessions.reduce((sum, session) => {
      if (session.status === 'COMPLETED') return sum + 100
      if (session.status === 'ACTIVE') return sum + 60
      if (session.status === 'PLANNED') return sum + 20
      return sum
    }, 0)
    const progressPercent = total ? Math.round(weighted / total) : 0
    return { total, completed, active, planned, progressPercent }
  }, [sessions])

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

  async function loadReport() {
    try {
      const url = new URL(`${REPORTING_URL}/api/reports/summary`)
      const res = await apiFetch(url.toString(), auth)
      setReportSummary(res)
    } catch (e) {
      console.error(e)
      setReportSummary(null)
    }
  }

  async function loadAccreditation() {
    try {
      const url = new URL(`${REPORTING_URL}/api/reports/accreditation/summary`)
      const res = await apiFetch(url.toString(), auth)
      setAccreditationSummary(res)
    } catch (e) {
      console.error(e)
      setAccreditationSummary(null)
    }
  }

  async function loadAcademic() {
    try {
      const url = new URL(`${INTEGRATION_URL}/api/integrations/academic`)
      if (academicQuery.trim()) url.searchParams.set('query', academicQuery.trim())
      const res = await apiFetch(url.toString(), auth)
      setAcademicResults(Array.isArray(res) ? res : [])
    } catch (e) {
      console.error(e)
      setAcademicResults([])
    }
  }

  async function loadFunding() {
    try {
      const url = new URL(`${INTEGRATION_URL}/api/integrations/funding`)
      if (fundingQuery.trim()) url.searchParams.set('query', fundingQuery.trim())
      const res = await apiFetch(url.toString(), auth)
      setFundingResults(Array.isArray(res) ? res : [])
    } catch (e) {
      console.error(e)
      setFundingResults([])
    }
  }

  async function loadLibrary() {
    try {
      const url = new URL(`${INTEGRATION_URL}/api/integrations/library`)
      if (libraryQuery.trim()) url.searchParams.set('query', libraryQuery.trim())
      const res = await apiFetch(url.toString(), auth)
      setLibraryResults(Array.isArray(res) ? res : [])
    } catch (e) {
      console.error(e)
      setLibraryResults([])
    }
  }

  async function loadLibraryByIsbn() {
    if (!libraryIsbn.trim()) {
      alert('Please enter an ISBN number')
      return
    }
    try {
      const url = new URL(`${INTEGRATION_URL}/api/integrations/library/isbn`)
      url.searchParams.set('isbn', libraryIsbn.trim())
      const res = await apiFetch(url.toString(), auth)
      setLibraryResults(Array.isArray(res) ? res : [])
    } catch (e) {
      console.error(e)
      setLibraryResults([])
    }
  }

  const canFeedback = role === 'SUPERVISOR' || role === 'UNIVERSITY_ADMIN'
  const canManageStudents = role === 'SUPERVISOR' || role === 'UNIVERSITY_ADMIN'
  const canManageSupervisors = role === 'UNIVERSITY_ADMIN'
  const canCreatePrograms = role === 'UNIVERSITY_ADMIN'
  const canCreateSessions = role === 'SUPERVISOR' || role === 'UNIVERSITY_ADMIN'
  const roleLabel =
    role === 'UNIVERSITY_ADMIN'
      ? 'University admin'
      : role === 'SUPERVISOR'
        ? 'Supervisor'
        : role === 'ACCREDITATION_BODY'
          ? 'Accreditation'
          : role

  const assistantSidePanel = (
    <div className="portal-panel">
      <div className="portal-section__header" style={{ marginBottom: '0.85rem' }}>
        <h2 className="portal-section__title" style={{ fontSize: '1.05rem' }}>AI assistant</h2>
        <p className="portal-section__hint">Instant support for supervision strategy.</p>
      </div>
      <div className="portal-card" style={{ marginBottom: '0.85rem', minHeight: '170px' }}>
        <div className="portal-card__title">Assistant response</div>
        <div className="portal-card__body">{assistantReply || 'Your AI response will appear here.'}</div>
      </div>
      <div className="portal-field">
        <label htmlFor="advisor-assistant-prompt-side">Question</label>
        <textarea
          id="advisor-assistant-prompt-side"
          rows={5}
          value={assistantPrompt}
          onChange={(e) => setAssistantPrompt(e.target.value)}
          placeholder="Example: Draft feedback points for a student with delayed milestones."
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
      title="University"
      subtitle="Programs, supervision, analytics, and integrations for your institution."
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
          <h2 className="portal-section__title">Program overview</h2>
          <p className="portal-section__hint">Session counts, tracked programs, and setup shortcuts</p>
        </div>

        {/* ── My profile card ── */}
        <div className="portal-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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
            <label
              htmlFor="uni-photo-input"
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
              id="uni-photo-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleProfilePhotoChange}
              disabled={photoUploading}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-h)', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {myProfile?.fullName ?? username}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '0.4rem' }}>@{username}</div>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'var(--surface-muted)', color: 'var(--text-muted)' }}>
                {role?.replace('_', ' ')}
              </span>
              {myProfile?.email && (
                <a href={`mailto:${myProfile.email}`} style={{ fontSize: '0.82rem', color: 'var(--accent)', textDecoration: 'none' }}>✉ {myProfile.email}</a>
              )}
            </div>
          </div>
        </div>
        <div className="portal-stats">
          <div className="portal-stat">
            <div className="portal-stat__value">{dashboard.total}</div>
            <div className="portal-stat__label">Total sessions</div>
          </div>
          <div className="portal-stat">
            <div className="portal-stat__value">{dashboard.active}</div>
            <div className="portal-stat__label">Active</div>
          </div>
          <div className="portal-stat">
            <div className="portal-stat__value">{dashboard.completed}</div>
            <div className="portal-stat__label">Completed</div>
          </div>
          <div className="portal-stat">
            <div className="portal-stat__value">{programs.length}</div>
            <div className="portal-stat__label">Programs tracked</div>
          </div>
        </div>
        <div className="portal-card" style={{ marginTop: '1rem' }}>
          <div className="portal-card__row" style={{ marginBottom: '0.5rem' }}>
            <div className="portal-card__title">Thesis progress meter</div>
            <div className="portal-card__meta">{dashboard.progressPercent}%</div>
          </div>
          <div style={{ height: '12px', borderRadius: '999px', background: 'var(--surface-muted)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${dashboard.progressPercent}%`,
                height: '100%',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #d64545 0%, #8aaf7a 100%)',
                transition: 'width 0.25s ease',
              }}
            />
          </div>
          <div className="portal-card__meta" style={{ marginTop: '0.6rem' }}>
            Planned {dashboard.planned} · Active {dashboard.active} · Completed {dashboard.completed}
          </div>
        </div>

        {/* Thesis Quick Access */}
        <div className="portal-card" style={{ marginTop: '1rem' }}>
          <div className="portal-card__row" style={{ marginBottom: '0.75rem' }}>
            <div className="portal-card__title">📚 Thesis Management</div>
            <button type="button" className="portal-btn portal-btn--secondary" onClick={() => setActiveSection('theses')}>
              View All →
            </button>
          </div>
          <div className="portal-card__meta">
            Review student theses, provide milestone feedback, and manage defense schedules.
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'var(--surface-muted)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{theses.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Theses</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'var(--surface-muted)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{theses.filter(t => t.status?.includes('REVIEW') || t.status?.includes('SUBMITTED')).length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Review</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'var(--surface-muted)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>{theses.filter(t => t.status === 'COMPLETED').length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Completed</div>
            </div>
          </div>
        </div>

        <div className="portal-grid" style={{ marginTop: '1rem' }}>
          <div className="portal-card">
            <div className="portal-card__title">Program catalog</div>
            <div className="portal-card__meta" style={{ marginBottom: '0.75rem' }}>
              Use this list when logging supervision sessions.
            </div>
            {programs.length ? (
              <div style={{ display: 'grid', gap: '0.55rem' }}>
                {programs.slice(0, 6).map((program) => (
                  <div key={program.id} className="portal-card__row">
                    <span className="portal-card__title" style={{ fontSize: '0.95rem' }}>{program.name}</span>
                    <span className="portal-card__meta">{program.id}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="portal-empty">No programs available yet.</div>
            )}
          </div>
          {canCreatePrograms ? (
            <div className="portal-card">
              <div className="portal-card__title">Create program</div>
              <div className="portal-field" style={{ marginTop: '0.85rem' }}>
                <label htmlFor="new-program-name">Program name</label>
                <input
                  id="new-program-name"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="portal-btn portal-btn--primary"
                  disabled={creatingProgram || !newProgramName.trim()}
                  onClick={createProgram}
                >
                  {creatingProgram ? 'Creating…' : 'Create program'}
                </button>
              </div>
            </div>
          ) : (
            <div className="portal-card">
              <div className="portal-card__title">Coordinator note</div>
              <div className="portal-card__body">
                Supervisors can log sessions for existing programs. University admins can add new programs.
              </div>
            </div>
          )}
        </div>

        <div className="portal-grid" style={{ marginTop: '1rem' }}>
          {canCreatePrograms ? (
            <div className="portal-card">
              <div className="portal-card__title">Create announcement / ad</div>
              <div className="portal-card__meta" style={{ marginTop: '0.35rem' }}>
                Publish dashboard notices visible to students and advisors.
              </div>
              <div className="portal-field" style={{ marginTop: '0.85rem' }}>
                <label htmlFor="announcement-title">Title</label>
                <input
                  id="announcement-title"
                  value={announcementDraft.title}
                  onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Research week registration now open"
                />
              </div>
              <div className="portal-field" style={{ marginTop: '0.75rem' }}>
                <label htmlFor="announcement-content">Message</label>
                <textarea
                  id="announcement-content"
                  rows={4}
                  value={announcementDraft.content}
                  onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Write announcement or ad content"
                />
              </div>
              <div className="portal-field" style={{ marginTop: '0.75rem' }}>
                <label htmlFor="announcement-image">Image URL (optional)</label>
                <input
                  id="announcement-image"
                  value={announcementDraft.imageUrl}
                  onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="portal-field" style={{ marginTop: '0.75rem' }}>
                <label htmlFor="announcement-link">Link URL (optional)</label>
                <input
                  id="announcement-link"
                  value={announcementDraft.linkUrl}
                  onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, linkUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.85rem', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={announcementDraft.pinned}
                  onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, pinned: e.target.checked }))}
                />
                Pin to top
              </label>
              <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="portal-btn portal-btn--primary"
                  disabled={creatingAnnouncement || !announcementDraft.title.trim() || !announcementDraft.content.trim()}
                  onClick={createAnnouncement}
                >
                  {creatingAnnouncement ? 'Publishing…' : 'Publish announcement'}
                </button>
              </div>
            </div>
          ) : (
            <div className="portal-card">
              <div className="portal-card__title">Announcements</div>
              <div className="portal-card__body">
                University admins can publish dashboard announcements and promotional cards for all portal users.
              </div>
            </div>
          )}

          <div className="portal-card">
            <div className="portal-card__title">Recent announcements</div>
            <div className="portal-card__meta" style={{ marginTop: '0.35rem', marginBottom: '0.85rem' }}>
              Shared with students and advisors across the portal dashboards.
            </div>
            {announcements.length ? (
              <div style={{ display: 'grid', gap: '0.85rem' }}>
                {announcements.slice(0, 5).map((announcement) => (
                  <div key={announcement.id} style={{ border: '1px solid var(--border)', borderRadius: '1rem', padding: '0.85rem', background: 'var(--surface-muted)' }}>
                    {announcement.imageUrl ? (
                      <div
                        style={{
                          height: '118px',
                          borderRadius: '0.75rem',
                          marginBottom: '0.75rem',
                          backgroundImage: `url(${announcement.imageUrl})`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover',
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                    ) : null}
                    <div className="portal-card__row" style={{ alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div className="portal-card__title" style={{ flex: 1, fontSize: '0.98rem' }}>{announcement.title}</div>
                      {announcement.pinned ? <span className="portal-badge">Pinned</span> : null}
                    </div>
                    <div className="portal-card__meta" style={{ marginTop: '0.3rem' }}>
                      {new Date(announcement.createdAt).toLocaleString()} · by {announcement.createdByUsername}
                    </div>
                    <div className="portal-card__body" style={{ marginTop: '0.65rem' }}>{announcement.content}</div>
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {announcement.linkUrl ? (
                        <a href={announcement.linkUrl} target="_blank" rel="noreferrer" className="portal-btn portal-btn--secondary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                          Open link
                        </a>
                      ) : null}
                      {canCreatePrograms ? (
                        <button type="button" className="portal-btn portal-btn--ghost" onClick={() => deleteAnnouncement(announcement.id)}>
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="portal-empty">No announcements published yet.</div>
            )}
          </div>
        </div>
      </section>
      )}

      {activeSection === 'theses' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">Thesis Management</h2>
          <p className="portal-section__hint">Review and manage student theses, milestones, and submissions.</p>
        </div>

        {/* Filters */}
        <div className="portal-panel" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="portal-field" style={{ flex: 1, minWidth: '150px' }}>
              <label htmlFor="thesis-status-filter">Status</label>
              <select
                id="thesis-status-filter"
                value={thesisFilter.status}
                onChange={(e) => setThesisFilter(f => ({ ...f, status: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}
              >
                <option value="">All Statuses</option>
                <option value="TOPIC_PROPOSED">Topic Proposed</option>
                <option value="TOPIC_APPROVED">Topic Approved</option>
                <option value="PROPOSAL_SUBMITTED">Proposal Submitted</option>
                <option value="PROPOSAL_UNDER_REVIEW">Proposal Under Review</option>
                <option value="PROPOSAL_APPROVED">Proposal Approved</option>
                <option value="LITERATURE_REVIEW">Literature Review</option>
                <option value="WRITING">Writing</option>
                <option value="DRAFT_SUBMITTED">Draft Submitted</option>
                <option value="DEFENSE_SCHEDULED">Defense Scheduled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="portal-field" style={{ flex: 1, minWidth: '150px' }}>
              <label htmlFor="thesis-student-filter">Student</label>
              <input
                id="thesis-student-filter"
                value={thesisFilter.studentUsername}
                onChange={(e) => setThesisFilter(f => ({ ...f, studentUsername: e.target.value }))}
                placeholder="Filter by student username"
              />
            </div>
            <button type="button" className="portal-btn portal-btn--secondary" onClick={() => { setSelectedThesis(null); fetchTheses(); }}>
              Refresh
            </button>
          </div>
        </div>

        {/* Thesis List or Details */}
        {selectedThesis ? (
          /* Thesis Details View */
          <div>
            <button type="button" className="portal-btn portal-btn--ghost" style={{ marginBottom: '1rem' }} onClick={() => setSelectedThesis(null)}>
              ← Back to list
            </button>

            {/* Thesis Overview */}
            <div className="portal-panel" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>{selectedThesis.title}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <span className="portal-badge" style={{ background: THESIS_STATUS_COLORS[selectedThesis.status] || '#6b7280' }}>
                      {selectedThesis.status?.replace(/_/g, ' ')}
                    </span>
                    {selectedThesis.programName && <span className="portal-badge" style={{ background: 'var(--surface-muted)', color: 'var(--text)' }}>{selectedThesis.programName}</span>}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    <strong>Student:</strong> {selectedThesis.studentUsername} · <strong>Progress:</strong> {selectedThesis.progress || 0}%
                  </div>
                  {selectedThesis.supervisorUsername ? (
                    <div style={{ fontSize: '0.9rem' }}><strong>Supervisor:</strong> {selectedThesis.supervisorUsername}</div>
                  ) : role === 'UNIVERSITY_ADMIN' && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select
                        onChange={(e) => e.target.value && assignSupervisor(selectedThesis.id, e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}
                      >
                        <option value="">Assign Supervisor...</option>
                        {supervisors.map(s => <option key={s.id} value={s.username}>{s.username}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <select
                    value={selectedThesis.status}
                    onChange={(e) => updateThesisStatus(selectedThesis.id, e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}
                  >
                    <option value="TOPIC_PROPOSED">Topic Proposed</option>
                    <option value="TOPIC_APPROVED">Topic Approved</option>
                    <option value="PROPOSAL_SUBMITTED">Proposal Submitted</option>
                    <option value="PROPOSAL_UNDER_REVIEW">Proposal Under Review</option>
                    <option value="PROPOSAL_REVISION_REQUIRED">Proposal Revision Required</option>
                    <option value="PROPOSAL_APPROVED">Proposal Approved</option>
                    <option value="LITERATURE_REVIEW">Literature Review</option>
                    <option value="METHODOLOGY">Methodology</option>
                    <option value="DATA_COLLECTION">Data Collection</option>
                    <option value="DATA_ANALYSIS">Data Analysis</option>
                    <option value="WRITING">Writing</option>
                    <option value="DRAFT_SUBMITTED">Draft Submitted</option>
                    <option value="DRAFT_UNDER_REVIEW">Draft Under Review</option>
                    <option value="REVISION_IN_PROGRESS">Revision In Progress</option>
                    <option value="FINAL_SUBMITTED">Final Submitted</option>
                    <option value="DEFENSE_SCHEDULED">Defense Scheduled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                  </select>
                  {selectedThesis.status === 'FINAL_SUBMITTED' && !selectedThesis.defense && (
                    <button type="button" className="portal-btn portal-btn--primary" onClick={() => setScheduleDefenseModal(true)}>
                      Schedule Defense
                    </button>
                  )}
                </div>
              </div>
              {selectedThesis.abstractText && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-muted)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Abstract</div>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{selectedThesis.abstractText}</p>
                </div>
              )}
            </div>

            {/* Defense Info */}
            {selectedThesis.defense && (
              <div className="portal-panel" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #ec4899' }}>
                <h4 style={{ marginBottom: '0.75rem' }}>🎓 Defense Record</h4>
                <div style={{ fontSize: '0.9rem' }}>
                  <div><strong>Scheduled:</strong> {new Date(selectedThesis.defense.scheduledAt).toLocaleString()}</div>
                  {selectedThesis.defense.venue && <div><strong>Venue:</strong> {selectedThesis.defense.venue}</div>}
                  {selectedThesis.defense.examiners?.length > 0 && <div><strong>Examiners:</strong> {selectedThesis.defense.examiners.join(', ')}</div>}
                  {selectedThesis.defense.outcome && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <span className="portal-badge" style={{ background: selectedThesis.defense.outcome === 'PASSED' ? '#22c55e' : selectedThesis.defense.outcome === 'FAILED' ? '#ef4444' : '#f59e0b' }}>
                        {selectedThesis.defense.outcome}
                      </span>
                      {selectedThesis.defense.finalGrade && <span style={{ marginLeft: '0.5rem' }}>Grade: {selectedThesis.defense.finalGrade}</span>}
                    </div>
                  )}
                </div>
                {selectedThesis.defense.outcome === 'PENDING' && (
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" className="portal-btn portal-btn--primary" onClick={() => recordDefenseOutcome('PASSED', '', 'A')}>Mark Passed</button>
                    <button type="button" className="portal-btn portal-btn--secondary" onClick={() => recordDefenseOutcome('MINOR_CORRECTIONS', 'Minor corrections required', '')}>Minor Corrections</button>
                    <button type="button" className="portal-btn portal-btn--secondary" onClick={() => recordDefenseOutcome('MAJOR_CORRECTIONS', 'Major corrections required', '')}>Major Corrections</button>
                    <button type="button" className="portal-btn portal-btn--ghost" style={{ color: '#ef4444' }} onClick={() => recordDefenseOutcome('FAILED', 'Defense failed', 'F')}>Mark Failed</button>
                  </div>
                )}
              </div>
            )}

            {/* Milestones Section */}
            <div className="portal-panel" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0 }}>Milestones</h4>
                <button type="button" className="portal-btn portal-btn--secondary" onClick={() => setShowMilestoneModal(true)}>
                  + Add Milestone
                </button>
              </div>
              {thesisMilestones.length === 0 ? (
                <div className="portal-empty" style={{ padding: '1rem' }}>No milestones yet. Add milestones to track thesis progress.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {thesisMilestones.sort((a, b) => a.orderIndex - b.orderIndex).map((m) => (
                    <div key={m.id} style={{ padding: '0.75rem', background: 'var(--surface-muted)', borderRadius: '8px', borderLeft: `4px solid ${MILESTONE_STATUS_COLORS[m.status] || '#6b7280'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <strong>{m.name}</strong>
                            <span className="portal-badge" style={{ background: MILESTONE_STATUS_COLORS[m.status] || '#6b7280', fontSize: '0.7rem' }}>
                              {m.status?.replace(/_/g, ' ')}
                            </span>
                            {m.weightPercentage > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.weightPercentage}%</span>}
                          </div>
                          {m.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>{m.description}</p>}
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {m.dueDate && <span>Due: {m.dueDate}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {m.status === 'SUBMITTED' && (
                            <>
                              <button type="button" className="portal-btn portal-btn--primary" style={{ fontSize: '0.8rem' }} onClick={() => updateMilestoneStatus(m.id, 'APPROVED')}>Approve</button>
                              <button type="button" className="portal-btn portal-btn--secondary" style={{ fontSize: '0.8rem' }} onClick={() => updateMilestoneStatus(m.id, 'REVISION_REQUIRED')}>Revise</button>
                            </>
                          )}
                          <button type="button" className="portal-btn portal-btn--ghost" style={{ fontSize: '0.8rem' }} onClick={() => { setFeedbackingMilestone(m); setMilestoneFeedback(m.feedback || ''); }}>
                            Feedback
                          </button>
                        </div>
                      </div>
                      {m.feedback && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--surface)', borderRadius: '6px', fontSize: '0.85rem' }}>
                          <strong>Feedback:</strong> {m.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submissions Section */}
            <div className="portal-panel">
              <h4 style={{ marginBottom: '1rem' }}>Submissions</h4>
              {thesisSubmissions.length === 0 ? (
                <div className="portal-empty" style={{ padding: '1rem' }}>No submissions yet.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {thesisSubmissions.map((sub) => (
                    <div key={sub.id} className="portal-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span className="portal-badge" style={{ background: '#8b5cf6' }}>{sub.type?.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>v{sub.versionNumber}</span>
                      </div>
                      <div className="portal-card__title">{sub.title}</div>
                      <div className="portal-card__meta">{new Date(sub.submittedAt).toLocaleString()}</div>
                      {sub.fileUrl && (
                        <a href={sub.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>View Document</a>
                      )}
                      {sub.reviewerComments ? (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'var(--surface-muted)', borderRadius: '6px', fontSize: '0.85rem' }}>
                          <div>{sub.isApproved ? '✅ Approved' : '❌ Not Approved'}</div>
                          <div style={{ marginTop: '0.25rem' }}>{sub.reviewerComments}</div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="portal-btn portal-btn--secondary"
                          style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
                          onClick={() => { setSubmissionReviewModal(sub); setSubmissionReview({ comments: '', approved: false }); }}
                        >
                          Review
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Thesis List View */
          <>
            {thesesLoading ? (
              <div className="portal-empty">Loading theses...</div>
            ) : theses.length === 0 ? (
              <div className="portal-empty">No theses found. Students can create thesis proposals from their portal.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {theses.map((thesis) => (
                  <div
                    key={thesis.id}
                    className="portal-card"
                    style={{ cursor: 'pointer', borderLeft: `4px solid ${THESIS_STATUS_COLORS[thesis.status] || '#6b7280'}` }}
                    onClick={() => fetchThesisDetails(thesis.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div className="portal-card__title">{thesis.title}</div>
                        <div className="portal-card__meta">Student: {thesis.studentUsername}</div>
                        {thesis.supervisorUsername && <div className="portal-card__meta">Supervisor: {thesis.supervisorUsername}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="portal-badge" style={{ background: THESIS_STATUS_COLORS[thesis.status] || '#6b7280' }}>
                          {thesis.status?.replace(/_/g, ' ')}
                        </span>
                        <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{thesis.progress || 0}% complete</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Add Milestone Modal */}
        {showMilestoneModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '450px' }}>
              <h3 style={{ marginBottom: '1rem' }}>Add Milestone</h3>
              <div className="portal-field" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="milestone-name">Name *</label>
                <input id="milestone-name" value={milestoneForm.name} onChange={(e) => setMilestoneForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Chapter 1 - Introduction" />
              </div>
              <div className="portal-field" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="milestone-desc">Description</label>
                <textarea id="milestone-desc" rows={2} value={milestoneForm.description} onChange={(e) => setMilestoneForm(f => ({ ...f, description: e.target.value }))} placeholder="What should be completed" />
              </div>
              <div className="portal-field" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="milestone-due">Due Date</label>
                <input id="milestone-due" type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="portal-field" style={{ marginBottom: '1rem' }}>
                <label htmlFor="milestone-weight">Weight (%)</label>
                <input id="milestone-weight" type="number" min="0" max="100" value={milestoneForm.weightPercentage} onChange={(e) => setMilestoneForm(f => ({ ...f, weightPercentage: parseInt(e.target.value) || 0 }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="portal-btn portal-btn--ghost" onClick={() => setShowMilestoneModal(false)}>Cancel</button>
                <button type="button" className="portal-btn portal-btn--primary" onClick={createMilestone}>Add</button>
              </div>
            </div>
          </div>
        )}

        {/* Milestone Feedback Modal */}
        {feedbackingMilestone && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '450px' }}>
              <h3 style={{ marginBottom: '1rem' }}>Feedback for: {feedbackingMilestone.name}</h3>
              <div className="portal-field" style={{ marginBottom: '1rem' }}>
                <label htmlFor="milestone-feedback">Feedback</label>
                <textarea id="milestone-feedback" rows={4} value={milestoneFeedback} onChange={(e) => setMilestoneFeedback(e.target.value)} placeholder="Enter your feedback for the student..." />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="portal-btn portal-btn--ghost" onClick={() => setFeedbackingMilestone(null)}>Cancel</button>
                <button type="button" className="portal-btn portal-btn--primary" onClick={submitMilestoneFeedback}>Submit Feedback</button>
              </div>
            </div>
          </div>
        )}

        {/* Submission Review Modal */}
        {submissionReviewModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '450px' }}>
              <h3 style={{ marginBottom: '1rem' }}>Review: {submissionReviewModal.title}</h3>
              <div className="portal-field" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="review-comments">Comments</label>
                <textarea id="review-comments" rows={4} value={submissionReview.comments} onChange={(e) => setSubmissionReview(r => ({ ...r, comments: e.target.value }))} placeholder="Your review comments..." />
              </div>
              <div className="portal-field" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={submissionReview.approved} onChange={(e) => setSubmissionReview(r => ({ ...r, approved: e.target.checked }))} />
                  Approve this submission
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="portal-btn portal-btn--ghost" onClick={() => setSubmissionReviewModal(null)}>Cancel</button>
                <button type="button" className="portal-btn portal-btn--primary" onClick={reviewSubmission}>Submit Review</button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Defense Modal */}
        {scheduleDefenseModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '450px' }}>
              <h3 style={{ marginBottom: '1rem' }}>Schedule Defense</h3>
              <div className="portal-field" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="defense-date">Date & Time *</label>
                <input id="defense-date" type="datetime-local" value={defenseForm.scheduledAt} onChange={(e) => setDefenseForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              </div>
              <div className="portal-field" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="defense-venue">Venue</label>
                <input id="defense-venue" value={defenseForm.venue} onChange={(e) => setDefenseForm(f => ({ ...f, venue: e.target.value }))} placeholder="Room/Location" />
              </div>
              <div className="portal-field" style={{ marginBottom: '1rem' }}>
                <label htmlFor="defense-examiners">Examiners (comma-separated)</label>
                <input id="defense-examiners" value={defenseForm.examiners} onChange={(e) => setDefenseForm(f => ({ ...f, examiners: e.target.value }))} placeholder="Dr. Smith, Dr. Jones" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="portal-btn portal-btn--ghost" onClick={() => setScheduleDefenseModal(false)}>Cancel</button>
                <button type="button" className="portal-btn portal-btn--primary" onClick={scheduleDefense}>Schedule</button>
              </div>
            </div>
          </div>
        )}
      </section>
      )}

      {activeSection === 'sessions' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">Supervision sessions</h2>
          <p className="portal-section__hint">Log new meetings, then filter and review them</p>
        </div>
        {canCreateSessions ? (
          <div className="portal-panel" style={{ marginBottom: '1rem' }}>
            <div className="portal-section__header" style={{ marginBottom: '0.85rem' }}>
              <h3 className="portal-section__title" style={{ fontSize: '1.05rem' }}>Log supervision session</h3>
              <p className="portal-section__hint">Create a session record and optionally schedule feedback reminders.</p>
            </div>
            <div className="portal-grid">
              <div className="portal-field">
                <label htmlFor="session-program">Program</label>
                <select
                  id="session-program"
                  value={sessionDraft.programId}
                  onChange={(e) => setSessionDraft((prev) => ({ ...prev, programId: e.target.value }))}
                >
                  <option value="">Select program</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>{program.name}</option>
                  ))}
                </select>
              </div>
              <div className="portal-field">
                <label htmlFor="session-student">Student</label>
                <input
                  id="session-student"
                  list="student-options"
                  value={sessionDraft.studentUsername}
                  onChange={(e) => setSessionDraft((prev) => ({ ...prev, studentUsername: e.target.value }))}
                  placeholder="student username"
                />
                <datalist id="student-options">
                  {students.map((student) => (
                    <option key={student.id} value={student.username} />
                  ))}
                </datalist>
              </div>
              <div className="portal-field">
                <label htmlFor="session-supervisor">Supervisor</label>
                {canManageSupervisors ? (
                  <select
                    id="session-supervisor"
                    value={sessionDraft.supervisorUsername}
                    onChange={(e) => setSessionDraft((prev) => ({ ...prev, supervisorUsername: e.target.value }))}
                  >
                    <option value="">Select supervisor</option>
                    {supervisors.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.username}>{supervisor.username}</option>
                    ))}
                  </select>
                ) : (
                  <input id="session-supervisor" value={sessionDraft.supervisorUsername || username} readOnly />
                )}
              </div>
              <div className="portal-field">
                <label htmlFor="session-scheduled">Scheduled at</label>
                <input
                  id="session-scheduled"
                  type="datetime-local"
                  value={sessionDraft.scheduledAt}
                  onChange={(e) => setSessionDraft((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                />
              </div>
              <div className="portal-field">
                <label htmlFor="session-deadline">Feedback deadline</label>
                <input
                  id="session-deadline"
                  type="datetime-local"
                  value={sessionDraft.feedbackDeadlineAt}
                  onChange={(e) => setSessionDraft((prev) => ({ ...prev, feedbackDeadlineAt: e.target.value }))}
                />
              </div>
            </div>
            <div className="portal-field" style={{ marginTop: '0.85rem' }}>
              <label htmlFor="session-notes">Notes</label>
              <textarea
                id="session-notes"
                rows={4}
                value={sessionDraft.notes}
                onChange={(e) => setSessionDraft((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Agenda, milestones, or follow-up actions"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.85rem' }}>
              <button
                type="button"
                className="portal-btn portal-btn--primary"
                disabled={
                  creatingSession ||
                  !sessionDraft.programId ||
                  !sessionDraft.studentUsername.trim() ||
                  !(sessionDraft.supervisorUsername || username).trim() ||
                  !sessionDraft.scheduledAt
                }
                onClick={createSession}
              >
                {creatingSession ? 'Saving…' : 'Log session'}
              </button>
            </div>
          </div>
        ) : null}
        <div className="portal-toolbar">
          <div className="portal-field" style={{ flex: '1 1 240px' }}>
            <label htmlFor="student-filter">Filter by student username (optional)</label>
            <input
              id="student-filter"
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              placeholder="e.g. student1"
            />
          </div>
        </div>
        <div className="portal-grid">
          {sessions.length ? (
            sessions.map((s) => (
              <div key={s.id} className="portal-card">
                <div className="portal-card__row">
                  <div>
                    <div className="portal-card__title">{s.programName ?? 'Program'}</div>
                    <div className="portal-card__meta">
                      Student · {s.studentUsername} · Supervisor · {s.supervisorUsername}
                    </div>
                  </div>
                  <span className="portal-badge">{s.status}</span>
                </div>
                <div className="portal-card__meta" style={{ marginTop: '0.5rem' }}>
                  Scheduled {s.scheduledAt}
                  {s.feedbackDeadlineAt ? ` · Feedback due ${s.feedbackDeadlineAt}` : ''}
                </div>
                {canFeedback ? (
                  <div style={{ marginTop: '0.85rem' }}>
                    <button
                      type="button"
                      className="portal-btn portal-btn--secondary"
                      onClick={() => setSelectedSessionId(s.id)}
                    >
                      {selectedSessionId === s.id ? 'Selected for feedback' : 'Select for feedback'}
                    </button>
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

      {activeSection === 'feedback' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">Submit feedback</h2>
          <p className="portal-section__hint">Attach feedback to a selected session</p>
        </div>
        {canFeedback ? (
          selectedSessionId ? (
            <div className="portal-panel">
              <p className="portal-card__meta" style={{ marginBottom: '0.75rem' }}>
                Session <strong style={{ color: 'var(--text-h)' }}>{selectedSessionId}</strong>
              </p>
              <div className="portal-field">
                <label htmlFor="fb-text">Feedback text</label>
                <textarea
                  id="fb-text"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                  placeholder="Write constructive feedback for the student…"
                />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginTop: '0.85rem' }}>
                <button
                  type="button"
                  className="portal-btn portal-btn--primary"
                  disabled={submittingFeedback || !feedbackText.trim()}
                  onClick={async () => {
                    if (!selectedSessionId) return
                    setSubmittingFeedback(true)
                    try {
                      await apiFetch(`${SUPERVISION_URL}/api/sessions/${selectedSessionId}/feedback`, auth, {
                        method: 'POST',
                        body: JSON.stringify({ feedbackText }),
                      })
                      setFeedbackText('')
                      setSelectedSessionId(null)
                      fetchSessions().catch(console.error)
                    } catch (e) {
                      console.error(e)
                    } finally {
                      setSubmittingFeedback(false)
                    }
                  }}
                >
                  {submittingFeedback ? 'Submitting…' : 'Submit feedback'}
                </button>
                <button
                  type="button"
                  className="portal-btn portal-btn--ghost"
                  onClick={() => setSelectedSessionId(null)}
                  disabled={submittingFeedback}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="portal-empty">Select a session above, then compose feedback here.</div>
          )
        ) : (
          <div className="portal-empty">Feedback submission is available to supervisors and university admins.</div>
        )}
      </section>
      )}

      {activeSection === 'users' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">User management</h2>
          <p className="portal-section__hint">Admins manage supervisors and students, while advisors can manage student accounts.</p>
        </div>

        {canManageStudents ? (
          <>
            {canManageSupervisors ? (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Supervisors ({supervisors.length})</h3>
                  {!showCreateSupervisor && (
                    <button
                      type="button"
                      className="portal-btn portal-btn--primary"
                      onClick={() => setShowCreateSupervisor(true)}
                      style={{ fontSize: '0.9rem' }}
                    >
                      Add supervisor
                    </button>
                  )}
                </div>

                {showCreateSupervisor && (
                  <div className="portal-panel" style={{ marginBottom: '1rem' }}>
                    <div className="portal-field" style={{ marginBottom: '0.75rem' }}>
                      <label htmlFor="new-supervisor-username">Username</label>
                      <input
                        id="new-supervisor-username"
                        value={newSupervisorUsername}
                        onChange={(e) => setNewSupervisorUsername(e.target.value)}
                        placeholder="Enter username"
                      />
                    </div>
                    <div className="portal-field" style={{ marginBottom: '0.75rem' }}>
                      <label htmlFor="new-supervisor-password">Password</label>
                      <input
                        id="new-supervisor-password"
                        type="password"
                        value={newSupervisorPassword}
                        onChange={(e) => setNewSupervisorPassword(e.target.value)}
                        placeholder="Enter password"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <button
                        type="button"
                        className="portal-btn portal-btn--primary"
                        onClick={createSupervisor}
                        disabled={!newSupervisorUsername.trim() || !newSupervisorPassword.trim()}
                      >
                        Create supervisor
                      </button>
                      <button
                        type="button"
                        className="portal-btn portal-btn--ghost"
                        onClick={() => {
                          setShowCreateSupervisor(false)
                          setNewSupervisorUsername('')
                          setNewSupervisorPassword('')
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="portal-grid">
                  {supervisors.length ? (
                    supervisors.map((sup) => (
                      <div key={sup.id} className="portal-card">
                        <div className="portal-card__title">{sup.username}</div>
                        <div className="portal-card__meta">ID: {sup.id}</div>
                        {sup.fullName && <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{sup.fullName}</div>}
                        {sup.email && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{sup.email}</div>}
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="portal-btn portal-btn--primary"
                            onClick={() => startEditingUser(sup)}
                            style={{ fontSize: '0.85rem', padding: '0.4rem 0.7rem' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="portal-btn portal-btn--ghost"
                            onClick={() => deleteUser(sup.id)}
                            style={{ fontSize: '0.85rem', padding: '0.4rem 0.7rem', color: 'var(--text-muted)' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="portal-empty">No supervisors yet.</div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Students Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Students ({students.length})</h3>
                {!showCreateStudent && (
                  <button
                    type="button"
                    className="portal-btn portal-btn--primary"
                    onClick={() => setShowCreateStudent(true)}
                    style={{ fontSize: '0.9rem' }}
                  >
                    Add student
                  </button>
                )}
              </div>

              {showCreateStudent && (
                <div className="portal-panel" style={{ marginBottom: '1rem' }}>
                  {/* Photo upload + preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: 72, height: 72, borderRadius: '50%',
                        border: '2px dashed var(--border)',
                        overflow: 'hidden', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--surface)',
                      }}
                    >
                      {newStudentPhoto
                        ? <img src={newStudentPhoto} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '1.8rem' }}>👤</span>
                      }
                    </div>
                    <div>
                      <label htmlFor="new-student-photo" className="portal-btn portal-btn--secondary" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                        {newStudentPhoto ? 'Change photo' : 'Upload photo'}
                      </label>
                      <input id="new-student-photo" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleStudentPhotoChange} />
                      {newStudentPhoto && (
                        <button type="button" className="portal-btn portal-btn--ghost" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }} onClick={() => setNewStudentPhoto('')}>Remove</button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="portal-field">
                      <label htmlFor="new-student-fullname">Full name <span style={{ color: 'var(--text-muted)' }}>(required)</span></label>
                      <input
                        id="new-student-fullname"
                        value={newStudentFullName}
                        onChange={(e) => setNewStudentFullName(e.target.value)}
                        placeholder="e.g. Alice Johnson"
                      />
                    </div>
                    <div className="portal-field">
                      <label htmlFor="new-student-sid">Student ID <span style={{ color: 'var(--text-muted)' }}>(required)</span></label>
                      <input
                        id="new-student-sid"
                        value={newStudentStudentId}
                        onChange={(e) => setNewStudentStudentId(e.target.value)}
                        placeholder="e.g. STU-2024-042"
                      />
                    </div>
                    <div className="portal-field">
                      <label htmlFor="new-student-course">Course name <span style={{ color: 'var(--text-muted)' }}>(required)</span></label>
                      <input
                        id="new-student-course"
                        value={newStudentCourseName}
                        onChange={(e) => setNewStudentCourseName(e.target.value)}
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                    <div className="portal-field">
                      <label htmlFor="new-student-email">Email <span style={{ color: 'var(--text-muted)' }}>(required)</span></label>
                      <input
                        id="new-student-email"
                        type="email"
                        value={newStudentEmail}
                        onChange={(e) => setNewStudentEmail(e.target.value)}
                        placeholder="e.g. alice@university.edu"
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Login credentials</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="portal-field">
                        <label htmlFor="new-student-username">Username</label>
                        <input
                          id="new-student-username"
                          value={newStudentUsername}
                          onChange={(e) => setNewStudentUsername(e.target.value)}
                          placeholder="Enter username"
                        />
                      </div>
                      <div className="portal-field">
                        <label htmlFor="new-student-password">Password</label>
                        <input
                          id="new-student-password"
                          type="password"
                          value={newStudentPassword}
                          onChange={(e) => setNewStudentPassword(e.target.value)}
                          placeholder="Enter password"
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button
                      type="button"
                      className="portal-btn portal-btn--primary"
                      onClick={createStudent}
                      disabled={
                        !newStudentUsername.trim() || !newStudentPassword.trim() ||
                        !newStudentFullName.trim() || !newStudentStudentId.trim() ||
                        !newStudentCourseName.trim() || !newStudentEmail.trim()
                      }
                    >
                      Create student
                    </button>
                    <button
                      type="button"
                      className="portal-btn portal-btn--ghost"
                      onClick={() => {
                        setShowCreateStudent(false)
                        setNewStudentUsername('')
                        setNewStudentPassword('')
                        setNewStudentFullName('')
                        setNewStudentEmail('')
                        setNewStudentStudentId('')
                        setNewStudentCourseName('')
                        setNewStudentPhoto('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="portal-grid">
                {students.length ? (
                  students.map((stu) => (
                    <div key={stu.id} className="portal-card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {/* Header: photo + identity */}
                      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div
                          style={{
                            width: 56, height: 56, borderRadius: '50%',
                            overflow: 'hidden', flexShrink: 0,
                            border: '2px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--surface)',
                          }}
                        >
                          {stu.photoData
                            ? <img src={stu.photoData} alt={stu.fullName || stu.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: '1.5rem' }}>👤</span>
                          }
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="portal-card__title" style={{ marginBottom: '0.1rem' }}>
                            {stu.fullName || stu.username}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            @{stu.username}
                          </div>
                        </div>
                      </div>

                      {/* Profile details */}
                      <div style={{ fontSize: '0.82rem', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.25rem 0.6rem', marginBottom: '0.75rem' }}>
                        {stu.studentId && <>
                          <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>ID</span>
                          <span style={{ fontWeight: 600 }}>{stu.studentId}</span>
                        </>}
                        {stu.courseName && <>
                          <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Course</span>
                          <span>{stu.courseName}</span>
                        </>}
                        {stu.email && <>
                          <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Email</span>
                          <a href={`mailto:${stu.email}`} style={{ color: 'var(--accent)', wordBreak: 'break-all' }}>{stu.email}</a>
                        </>}
                        {!stu.studentId && !stu.courseName && !stu.email && (
                          <span style={{ gridColumn: '1 / -1', color: 'var(--text-muted)' }}>No profile info</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="portal-btn portal-btn--primary"
                          onClick={() => startEditingUser(stu)}
                          style={{ fontSize: '0.85rem', padding: '0.4rem 0.7rem' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="portal-btn portal-btn--ghost"
                          onClick={() => deleteUser(stu.id)}
                          style={{ fontSize: '0.85rem', padding: '0.4rem 0.7rem', color: 'var(--text-muted)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="portal-empty">No students yet.</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="portal-empty">User management is available to university admins and advisors.</div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}>
            <div style={{
              background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '500px',
              maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
                Edit User: {editingUser.username}
              </h3>

              {/* Photo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', border: '2px dashed var(--border)',
                  overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)',
                }}>
                  {editUserForm.photoData
                    ? <img src={editUserForm.photoData} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '1.8rem' }}>👤</span>
                  }
                </div>
                <div>
                  <label htmlFor="edit-user-photo" className="portal-btn portal-btn--secondary" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                    {editUserForm.photoData ? 'Change photo' : 'Upload photo'}
                  </label>
                  <input id="edit-user-photo" type="file" accept="image/*" onChange={handleEditUserPhotoChange} style={{ display: 'none' }} />
                  {editUserForm.photoData && (
                    <button
                      type="button"
                      className="portal-btn portal-btn--ghost"
                      onClick={() => setEditUserForm((prev) => ({ ...prev, photoData: '' }))}
                      style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="portal-field" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="edit-user-fullname">Full Name</label>
                <input
                  id="edit-user-fullname"
                  value={editUserForm.fullName}
                  onChange={(e) => setEditUserForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>

              <div className="portal-field" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="edit-user-email">Email</label>
                <input
                  id="edit-user-email"
                  type="email"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                />
              </div>

              {editingUser.role === 'STUDENT' && (
                <>
                  <div className="portal-field" style={{ marginBottom: '0.75rem' }}>
                    <label htmlFor="edit-user-studentid">Student ID</label>
                    <input
                      id="edit-user-studentid"
                      value={editUserForm.studentId}
                      onChange={(e) => setEditUserForm((prev) => ({ ...prev, studentId: e.target.value }))}
                      placeholder="Enter student ID"
                    />
                  </div>
                  <div className="portal-field" style={{ marginBottom: '0.75rem' }}>
                    <label htmlFor="edit-user-course">Course Name</label>
                    <input
                      id="edit-user-course"
                      value={editUserForm.courseName}
                      onChange={(e) => setEditUserForm((prev) => ({ ...prev, courseName: e.target.value }))}
                      placeholder="Enter course name"
                    />
                  </div>
                </>
              )}

              <div className="portal-field" style={{ marginBottom: '1rem' }}>
                <label htmlFor="edit-user-password">New Password (leave blank to keep current)</label>
                <input
                  id="edit-user-password"
                  type="password"
                  value={editUserForm.password}
                  onChange={(e) => setEditUserForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter new password"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="portal-btn portal-btn--ghost" onClick={cancelEditingUser}>
                  Cancel
                </button>
                <button type="button" className="portal-btn portal-btn--primary" onClick={saveUserChanges}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
      )}

      {activeSection === 'chat' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">Chat system</h2>
          <p className="portal-section__hint">Coordinate with students and advisors via real-time messaging.</p>
        </div>
        <div className="portal-panel">
          <div className="portal-field">
            <label htmlFor="advisor-chat-input">Message</label>
            <textarea
              id="advisor-chat-input"
              rows={3}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Share update, note, or action item…"
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

      {activeSection === 'analytics' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">Analytics &amp; reports</h2>
          <p className="portal-section__hint">Summary for decision-makers and accreditation</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button type="button" className="portal-btn portal-btn--primary" style={{ width: 'fit-content' }} onClick={loadReport}>
            Generate analytics summary
          </button>
          <button type="button" className="portal-btn portal-btn--secondary" style={{ width: 'fit-content' }} onClick={loadAccreditation}>
            Generate accreditation summary
          </button>
        </div>
        <div className="portal-grid">
          {reportSummary ? (
            <div className="portal-card">
              <div className="portal-card__title">Analytics summary</div>
              <div className="portal-card__meta">Generated {reportSummary.generatedAt}</div>
              <div className="portal-card__body" style={{ marginTop: '0.5rem' }}>{reportSummary.description}</div>
              <div className="portal-grid" style={{ marginTop: '1rem' }}>
                {Object.entries(reportSummary.metrics ?? {}).map(([key, value]) => (
                  <div key={key} className="portal-card" style={{ padding: '0.85rem' }}>
                    <div className="portal-card__meta">{key}</div>
                    <div className="portal-card__title" style={{ marginTop: '0.35rem' }}>{String(value)}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                {(reportSummary.breakdown ?? []).map((item, idx) => (
                  <div key={`${item.programId ?? idx}`} className="portal-card" style={{ padding: '0.85rem' }}>
                    <div className="portal-card__row">
                      <span className="portal-card__title">{item.programName ?? item.programId ?? `Item ${idx + 1}`}</span>
                      <span className="portal-card__meta">Completion {item.completionPercent ?? 0}%</span>
                    </div>
                    <div className="portal-card__meta" style={{ marginTop: '0.45rem' }}>
                      Sessions {item.sessionsTotal ?? 0} · Active {item.sessionsActive ?? 0} · Completed {item.sessionsCompleted ?? 0} · Feedback {item.feedbackEntries ?? 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="portal-empty">Load an analytics summary to see current institutional metrics.</div>
          )}
          {accreditationSummary ? (
            <div className="portal-card">
              <div className="portal-card__title">Accreditation summary</div>
              <div className="portal-card__meta">Generated {accreditationSummary.generatedAt}</div>
              <div className="portal-card__body" style={{ marginTop: '0.5rem' }}>{accreditationSummary.description}</div>
              <div className="portal-grid" style={{ marginTop: '1rem' }}>
                {Object.entries(accreditationSummary.metrics ?? {}).map(([key, value]) => (
                  <div key={key} className="portal-card" style={{ padding: '0.85rem' }}>
                    <div className="portal-card__meta">{key}</div>
                    <div className="portal-card__body" style={{ marginTop: '0.35rem', whiteSpace: 'pre-wrap' }}>
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="portal-empty">Load the accreditation summary to review compliance-focused evidence.</div>
          )}
        </div>
      </section>
      )}

      {activeSection === 'integrations' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">Academic integrations</h2>
          <p className="portal-section__hint">Academic lookup, funding discovery, and live Open Library search</p>
        </div>
        <div className="portal-grid">
          <div className="portal-panel">
            <div className="portal-section__header" style={{ marginBottom: '0.85rem' }}>
              <h3 className="portal-section__title" style={{ fontSize: '1.05rem' }}>Academic databases</h3>
              <p className="portal-section__hint">Search the academic connector.</p>
            </div>
            <div className="portal-toolbar">
              <div className="portal-field" style={{ flex: '1 1 280px' }}>
                <label htmlFor="academic-q">Search query</label>
                <input
                  id="academic-q"
                  value={academicQuery}
                  onChange={(e) => setAcademicQuery(e.target.value)}
                  placeholder="Topic or keyword"
                />
              </div>
              <button type="button" className="portal-btn portal-btn--secondary" onClick={loadAcademic}>
                Search
              </button>
            </div>
            <div className="portal-grid">
              {academicResults.length ? (
                academicResults.map((r, idx) => (
                  <div key={`${r.source}-${idx}`} className="portal-card">
                    <div className="portal-card__title">{r.title}</div>
                    <div className="portal-card__meta">
                      {r.source} · {r.year}
                    </div>
                    <div className="portal-card__body" style={{ fontSize: '0.85rem' }}>
                      {r.authors}
                    </div>
                  </div>
                ))
              ) : (
                <div className="portal-empty">Run an academic search to see results.</div>
              )}
            </div>
          </div>

          <div className="portal-panel">
            <div className="portal-section__header" style={{ marginBottom: '0.85rem' }}>
              <h3 className="portal-section__title" style={{ fontSize: '1.05rem' }}>Funding portals</h3>
              <p className="portal-section__hint">Track grant and scholarship opportunities.</p>
            </div>
            <div className="portal-toolbar">
              <div className="portal-field" style={{ flex: '1 1 280px' }}>
                <label htmlFor="funding-q">Funding topic</label>
                <input
                  id="funding-q"
                  value={fundingQuery}
                  onChange={(e) => setFundingQuery(e.target.value)}
                  placeholder="e.g. AI, STEM, innovation"
                />
              </div>
              <button type="button" className="portal-btn portal-btn--secondary" onClick={loadFunding}>
                Search
              </button>
            </div>
            <div className="portal-grid">
              {fundingResults.length ? (
                fundingResults.map((item, idx) => (
                  <div key={`${item.portal}-${idx}`} className="portal-card">
                    <div className="portal-card__title">{item.type}</div>
                    <div className="portal-card__meta">{item.portal}</div>
                    <div className="portal-card__body">Amount {item.amount}</div>
                    <div className="portal-card__meta">Deadline {item.deadline}</div>
                  </div>
                ))
              ) : (
                <div className="portal-empty">Search funding opportunities to populate this panel.</div>
              )}
            </div>
          </div>

          <div className="portal-panel">
            <div className="portal-section__header" style={{ marginBottom: '0.85rem' }}>
              <h3 className="portal-section__title" style={{ fontSize: '1.05rem' }}>Library systems</h3>
              <p className="portal-section__hint">Integrated with Open Library for live book discovery. Search by keyword or ISBN.</p>
            </div>

            {/* Search mode tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <button
                type="button"
                className={librarySearchMode === 'keyword' ? 'portal-btn portal-btn--primary' : 'portal-btn portal-btn--ghost'}
                onClick={() => { setLibrarySearchMode('keyword'); setLibraryResults([]); }}
                style={{ fontSize: '0.9rem' }}
              >
                By keyword
              </button>
              <button
                type="button"
                className={librarySearchMode === 'isbn' ? 'portal-btn portal-btn--primary' : 'portal-btn portal-btn--ghost'}
                onClick={() => { setLibrarySearchMode('isbn'); setLibraryResults([]); }}
                style={{ fontSize: '0.9rem' }}
              >
                By ISBN
              </button>
            </div>

            {/* Keyword search mode */}
            {librarySearchMode === 'keyword' && (
              <div>
                <div className="portal-toolbar" style={{ marginBottom: '1rem' }}>
                  <div className="portal-field" style={{ flex: '1 1 280px' }}>
                    <label htmlFor="library-q">Book or topic</label>
                    <input
                      id="library-q"
                      value={libraryQuery}
                      onChange={(e) => setLibraryQuery(e.target.value)}
                      placeholder="e.g. research methods"
                    />
                  </div>
                  <button type="button" className="portal-btn portal-btn--secondary" onClick={loadLibrary}>
                    Search
                  </button>
                </div>
              </div>
            )}

            {/* ISBN search mode */}
            {librarySearchMode === 'isbn' && (
              <div>
                <div className="portal-toolbar" style={{ marginBottom: '1rem' }}>
                  <div className="portal-field" style={{ flex: '1 1 280px' }}>
                    <label htmlFor="library-isbn">ISBN (10 or 13 digit)</label>
                    <input
                      id="library-isbn"
                      value={libraryIsbn}
                      onChange={(e) => setLibraryIsbn(e.target.value)}
                      placeholder="e.g. 978-0-12-345678-9 or 0123456789"
                    />
                  </div>
                  <button type="button" className="portal-btn portal-btn--secondary" onClick={loadLibraryByIsbn}>
                    Lookup
                  </button>
                </div>
              </div>
            )}

            {/* Results grid */}
            <div className="portal-grid">
              {libraryResults.length ? (
                libraryResults.map((item, idx) => (
                  <div key={`${item.library}-${item.title}-${idx}`} className="portal-card">
                    <div className="portal-card__title">{item.title}</div>
                    <div className="portal-card__meta">{item.library} · {item.itemType}</div>
                    <div className="portal-card__body" style={{ fontSize: '0.85rem' }}>
                      {item.authors || 'Unknown author'}
                      {item.year ? ` · ${item.year}` : ''}
                    </div>
                    <div className="portal-card__meta">{item.availability}</div>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer" className="portal-btn portal-btn--ghost" style={{ width: 'fit-content', marginTop: '0.75rem' }}>
                        Open catalog entry
                      </a>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="portal-empty">
                  {librarySearchMode === 'keyword'
                    ? 'Search the Open Library integration to see live results.'
                    : 'Enter an ISBN to lookup book information from Open Library.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      )}

      {activeSection === 'feed' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">Workflow status feed</h2>
          <p className="portal-section__hint">Real-time stream</p>
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
