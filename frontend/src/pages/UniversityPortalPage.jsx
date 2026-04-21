import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../state/AuthContext'
import PortalLayout from '../components/PortalLayout.jsx'
import { INTEGRATION_URL, NOTIFICATION_URL, REPORTING_URL, SUPERVISION_URL, apiFetch } from '../api/api'
import { useRealtime } from '../hooks/useRealtime'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

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
  { id: 'payments', label: 'Payments', icon: 'dollar' },
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
  const [paymentTransactions, setPaymentTransactions] = useState([])
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
    apiFetch(`${INTEGRATION_URL}/api/integrations/payment/transactions`, auth)
      .then((data) => setPaymentTransactions(Array.isArray(data) ? data : []))
      .catch(console.error)
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
        <p className="portal-section__hint">Instant support for supervision.</p>
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
      brand="FYP Postgraduate Portal"
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
          <h2 className="portal-section__title">Dashboard Overview</h2>
          <p className="portal-section__hint">Your command center for thesis supervision and program management</p>
        </div>

        {/* ── Welcome Banner with Profile ── */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '1.25rem',
          padding: '1.75rem',
          marginBottom: '1.5rem',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '300px',
            height: '300px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30%',
            right: '20%',
            width: '150px',
            height: '150px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 100, height: 100, borderRadius: '50%',
                border: '4px solid rgba(255,255,255,0.8)',
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}>
                {myProfile?.photoData
                  ? <img src={myProfile.photoData} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '2.5rem' }}>👤</span>
                }
              </div>
              <label
                htmlFor="uni-photo-input"
                title="Change photo"
                style={{
                  position: 'absolute', bottom: 4, right: 4,
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', color: '#667eea', boxShadow: '0 2px 8px rgba(0,0,0,.25)',
                  opacity: photoUploading ? 0.5 : 1,
                  transition: 'transform 0.2s ease',
                }}
              >
                {photoUploading ? '...' : '✎'}
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
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.25rem' }}>Welcome back,</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.35rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {myProfile?.fullName ?? username}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem', borderRadius: '999px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                  {role?.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>@{username}</span>
                {myProfile?.email && (
                  <a href={`mailto:${myProfile.email}`} style={{ fontSize: '0.85rem', color: 'white', textDecoration: 'none', opacity: 0.9 }}>
                    ✉ {myProfile.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Statistics Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="portal-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Sessions</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{dashboard.total}</div>
              </div>
              <div style={{ fontSize: '2rem', opacity: 0.3 }}>📊</div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.8 }}>All supervision sessions</div>
          </div>
          <div className="portal-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>Active</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{dashboard.active}</div>
              </div>
              <div style={{ fontSize: '2rem', opacity: 0.3 }}>🟢</div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.8 }}>Currently in progress</div>
          </div>
          <div className="portal-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>Completed</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{dashboard.completed}</div>
              </div>
              <div style={{ fontSize: '2rem', opacity: 0.3 }}>✅</div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.8 }}>Successfully finished</div>
          </div>
          <div className="portal-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>Programs</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{programs.length}</div>
              </div>
              <div style={{ fontSize: '2rem', opacity: 0.3 }}>📚</div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.8 }}>Active programs tracked</div>
          </div>
        </div>

        {/* ── Progress Section with Chart ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="portal-card" style={{ padding: '1.5rem' }}>
            <div className="portal-card__title" style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Session Progress Overview</div>
            <div style={{ height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut
                data={{
                  labels: ['Completed', 'Active', 'Planned'],
                  datasets: [{
                    data: [dashboard.completed, dashboard.active, dashboard.planned],
                    backgroundColor: ['#3b82f6', '#22c55e', '#6366f1'],
                    borderColor: ['#2563eb', '#16a34a', '#4f46e5'],
                    borderWidth: 2,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true } },
                  },
                  cutout: '65%',
                }}
              />
            </div>
          </div>
          <div className="portal-card" style={{ padding: '1.5rem' }}>
            <div className="portal-card__title" style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Completion Progress</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-h)' }}>Overall Progress</span>
                  <span style={{ fontWeight: 700, color: dashboard.progressPercent >= 75 ? '#22c55e' : dashboard.progressPercent >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {dashboard.progressPercent}%
                  </span>
                </div>
                <div style={{ height: '14px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden' }}>
                  <div style={{
                    width: `${dashboard.progressPercent}%`,
                    height: '100%',
                    borderRadius: '999px',
                    background: dashboard.progressPercent >= 75 ? 'linear-gradient(90deg, #22c55e, #16a34a)' :
                                dashboard.progressPercent >= 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                                'linear-gradient(90deg, #ef4444, #dc2626)',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f0fdf4', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>{dashboard.completed}</div>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Completed</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f0fdf4', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>{dashboard.active}</div>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Active</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: '#eef2ff', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#6366f1' }}>{dashboard.planned}</div>
                  <div style={{ fontSize: '0.75rem', color: '#4f46e5' }}>Planned</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Thesis Quick Access Card ── */}
        <div className="portal-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📚</span> Thesis Management
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Review student theses, milestones, and defense schedules
              </div>
            </div>
            <button type="button" className="portal-btn portal-btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setActiveSection('theses')}>
              View All Theses <span>→</span>
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#6366f1' }}>{theses.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Total Theses</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>{theses.filter(t => t.status?.includes('REVIEW') || t.status?.includes('SUBMITTED')).length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Pending Review</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#22c55e' }}>{theses.filter(t => t.status === 'COMPLETED').length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Completed</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ec4899' }}>{theses.filter(t => t.status === 'DEFENSE_SCHEDULED').length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Defense Scheduled</div>
            </div>
          </div>
        </div>

        <div className="portal-grid" style={{ marginTop: '1rem' }}>
          <div className="portal-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🎓</span>
              <div className="portal-card__title" style={{ fontSize: '1.05rem' }}>Program Catalog</div>
            </div>
            <div className="portal-card__meta" style={{ marginBottom: '1rem' }}>
              Available programs for supervision sessions
            </div>
            {programs.length ? (
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {programs.slice(0, 6).map((program, idx) => (
                  <div key={program.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: idx % 2 === 0 ? '#f8fafc' : 'white',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-h)' }}>{program.name}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{program.id}</span>
                  </div>
                ))}
                {programs.length > 6 && (
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    +{programs.length - 6} more programs
                  </div>
                )}
              </div>
            ) : (
              <div className="portal-empty" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                <div>No programs available yet.</div>
              </div>
            )}
          </div>
          {canCreatePrograms ? (
            <div className="portal-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.25rem' }}>➕</span>
                <div className="portal-card__title" style={{ fontSize: '1.05rem' }}>Create Program</div>
              </div>
              <div className="portal-field" style={{ marginTop: '0.85rem' }}>
                <label htmlFor="new-program-name">Program name</label>
                <input
                  id="new-program-name"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  placeholder="e.g. Computer Science"
                  style={{ borderRadius: '10px', padding: '0.75rem' }}
                />
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="portal-btn portal-btn--primary"
                  disabled={creatingProgram || !newProgramName.trim()}
                  onClick={createProgram}
                  style={{ borderRadius: '10px', padding: '0.65rem 1.25rem' }}
                >
                  {creatingProgram ? 'Creating...' : 'Create Program'}
                </button>
              </div>
            </div>
          ) : (
            <div className="portal-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>💡</span>
                <div className="portal-card__title" style={{ fontSize: '1.05rem', color: '#92400e' }}>Coordinator Note</div>
              </div>
              <div className="portal-card__body" style={{ color: '#78350f' }}>
                Supervisors can log sessions for existing programs. University admins can add new programs.
              </div>
            </div>
          )}
        </div>

        {/* ── Announcements Section ── */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📢</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-h)', margin: 0 }}>Announcements</h3>
          </div>
          
          <div className="portal-grid">
            {canCreatePrograms ? (
              <div className="portal-card" style={{ padding: '1.5rem' }}>
                <div className="portal-card__title" style={{ marginBottom: '0.5rem' }}>Create Announcement</div>
                <div className="portal-card__meta" style={{ marginBottom: '1rem' }}>
                  Publish notices visible to students and advisors.
                </div>
                <div className="portal-field">
                  <label htmlFor="announcement-title">Title</label>
                  <input
                    id="announcement-title"
                    value={announcementDraft.title}
                    onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Research week registration now open"
                    style={{ borderRadius: '10px', padding: '0.75rem' }}
                  />
                </div>
                <div className="portal-field" style={{ marginTop: '0.75rem' }}>
                  <label htmlFor="announcement-content">Message</label>
                  <textarea
                    id="announcement-content"
                    rows={3}
                    value={announcementDraft.content}
                    onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Write announcement content..."
                    style={{ borderRadius: '10px', padding: '0.75rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div className="portal-field">
                    <label htmlFor="announcement-image">Image URL</label>
                    <input
                      id="announcement-image"
                      value={announcementDraft.imageUrl}
                      onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="https://..."
                      style={{ borderRadius: '10px', padding: '0.65rem' }}
                    />
                  </div>
                  <div className="portal-field">
                    <label htmlFor="announcement-link">Link URL</label>
                    <input
                      id="announcement-link"
                      value={announcementDraft.linkUrl}
                      onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, linkUrl: e.target.value }))}
                      placeholder="https://..."
                      style={{ borderRadius: '10px', padding: '0.65rem' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={announcementDraft.pinned}
                      onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, pinned: e.target.checked }))}
                    />
                    📌 Pin to top
                  </label>
                  <button
                    type="button"
                    className="portal-btn portal-btn--primary"
                    disabled={creatingAnnouncement || !announcementDraft.title.trim() || !announcementDraft.content.trim()}
                    onClick={createAnnouncement}
                    style={{ borderRadius: '10px' }}
                  >
                    {creatingAnnouncement ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="portal-card" style={{ padding: '1.5rem', background: '#f8fafc' }}>
                <div className="portal-card__title">Announcements</div>
                <div className="portal-card__body" style={{ marginTop: '0.5rem' }}>
                  University admins can publish dashboard announcements and promotional cards for all portal users.
                </div>
              </div>
            )}

          <div className="portal-card" style={{ padding: '1.5rem' }}>
            <div className="portal-card__title" style={{ marginBottom: '0.5rem' }}>Recent Announcements</div>
            <div className="portal-card__meta" style={{ marginBottom: '1rem' }}>
              Shared with students and advisors across the portal.
            </div>
            {announcements.length ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {announcements.slice(0, 5).map((announcement) => (
                  <div key={announcement.id} style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1rem',
                    background: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}>
                    {announcement.imageUrl ? (
                      <div
                        style={{
                          height: '140px',
                          borderRadius: '12px',
                          marginBottom: '1rem',
                          backgroundImage: `url(${announcement.imageUrl})`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover',
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                    ) : null}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-h)', flex: 1 }}>{announcement.title}</div>
                      {announcement.pinned ? (
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '999px',
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: 'white',
                          fontWeight: 600,
                        }}>📌 Pinned</span>
                      ) : null}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                      <span>🗓️ {new Date(announcement.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>👤 {announcement.createdByUsername}</span>
                    </div>
                    <div style={{ marginTop: '0.75rem', color: 'var(--text-body)', lineHeight: 1.5 }}>{announcement.content}</div>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {announcement.linkUrl ? (
                        <a href={announcement.linkUrl} target="_blank" rel="noreferrer" 
                          style={{
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            background: '#eef2ff',
                            color: '#4f46e5',
                            fontWeight: 500,
                            fontSize: '0.85rem',
                          }}>
                          🔗 Open Link
                        </a>
                      ) : null}
                      {canCreatePrograms ? (
                        <button type="button" 
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '0.85rem',
                          }}
                          onClick={() => deleteAnnouncement(announcement.id)}>
                          🗑️ Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="portal-empty" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📢</div>
                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>No Announcements Yet</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Create your first announcement to share news with your community.</div>
              </div>
            )}
          </div>
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
                    <span className="portal-badge" style={{ background: THESIS_STATUS_COLORS[selectedThesis.status] || '#6b7280', color: 'white' }}>
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
                            <span className="portal-badge" style={{ background: MILESTONE_STATUS_COLORS[m.status] || '#6b7280', color: 'white', fontSize: '0.7rem' }}>
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
                        <span className="portal-badge" style={{ background: '#8b5cf6', color: 'white' }}>{sub.type?.replace(/_/g, ' ')}</span>
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
                        <span className="portal-badge" style={{ background: THESIS_STATUS_COLORS[thesis.status] || '#6b7280', color: 'white' }}>
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
          <h2 className="portal-section__title">Supervision Sessions</h2>
          <p className="portal-section__hint">Log new meetings, track progress, and manage feedback</p>
        </div>

        {/* Session Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            padding: '1.25rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.35rem' }}>Total Sessions</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{sessions.length}</div>
          </div>
          <div style={{
            padding: '1.25rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white',
          }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.35rem' }}>Active</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{sessions.filter(s => s.status === 'ACTIVE').length}</div>
          </div>
          <div style={{
            padding: '1.25rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
          }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.35rem' }}>Planned</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{sessions.filter(s => s.status === 'PLANNED').length}</div>
          </div>
          <div style={{
            padding: '1.25rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
          }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.35rem' }}>Completed</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{sessions.filter(s => s.status === 'COMPLETED').length}</div>
          </div>
        </div>

        {canCreateSessions ? (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            marginBottom: '1.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #f1f5f9',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}>📝</div>
              <div>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 700, 
                  color: '#1e293b', 
                  margin: 0,
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>Log New Session</h3>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: '#64748b', 
                  margin: '0.25rem 0 0 0',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>Create a session record and optionally schedule feedback reminders.</p>
              </div>
            </div>

            {/* Form Grid - Row 1: Program, Student, Supervisor */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '1.5rem',
              marginBottom: '1.5rem',
            }}>
              <div>
                <label htmlFor="session-program" style={{ 
                  fontWeight: 600, 
                  fontSize: '0.875rem',
                  color: '#374151',
                  marginBottom: '0.5rem', 
                  display: 'block',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>Program <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  id="session-program"
                  value={sessionDraft.programId}
                  onChange={(e) => setSessionDraft((prev) => ({ ...prev, programId: e.target.value }))}
                  style={{ 
                    width: '100%', 
                    padding: '0.875rem 1rem', 
                    borderRadius: '12px', 
                    border: '2px solid #e5e7eb', 
                    background: 'white',
                    fontSize: '0.95rem',
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: '#1e293b',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select program...</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>{program.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="session-student" style={{ 
                  fontWeight: 600, 
                  fontSize: '0.875rem',
                  color: '#374151',
                  marginBottom: '0.5rem', 
                  display: 'block',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>Student <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  id="session-student"
                  list="student-options"
                  value={sessionDraft.studentUsername}
                  onChange={(e) => setSessionDraft((prev) => ({ ...prev, studentUsername: e.target.value }))}
                  placeholder="Enter student username"
                  style={{ 
                    width: '100%', 
                    padding: '0.875rem 1rem', 
                    borderRadius: '12px', 
                    border: '2px solid #e5e7eb',
                    fontSize: '0.95rem',
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: '#1e293b',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                />
                <datalist id="student-options">
                  {students.map((student) => (
                    <option key={student.id} value={student.username} />
                  ))}
                </datalist>
              </div>
              
              <div>
                <label htmlFor="session-supervisor" style={{ 
                  fontWeight: 600, 
                  fontSize: '0.875rem',
                  color: '#374151',
                  marginBottom: '0.5rem', 
                  display: 'block',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>Supervisor <span style={{ color: '#ef4444' }}>*</span></label>
                {canManageSupervisors ? (
                  <select
                    id="session-supervisor"
                    value={sessionDraft.supervisorUsername}
                    onChange={(e) => setSessionDraft((prev) => ({ ...prev, supervisorUsername: e.target.value }))}
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem 1rem', 
                      borderRadius: '12px', 
                      border: '2px solid #e5e7eb', 
                      background: 'white',
                      fontSize: '0.95rem',
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      color: '#1e293b',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">Select supervisor...</option>
                    {supervisors.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.username}>{supervisor.username}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    id="session-supervisor" 
                    value={sessionDraft.supervisorUsername || username} 
                    readOnly 
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem 1rem', 
                      borderRadius: '12px', 
                      border: '2px solid #e5e7eb', 
                      background: '#f8fafc',
                      fontSize: '0.95rem',
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      color: '#64748b',
                      boxSizing: 'border-box',
                    }} 
                  />
                )}
              </div>
            </div>

            {/* Form Grid - Row 2: Scheduled At, Feedback Deadline */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '1.5rem',
              marginBottom: '1.5rem',
            }}>
              <div>
                <label htmlFor="session-scheduled" style={{ 
                  fontWeight: 600, 
                  fontSize: '0.875rem',
                  color: '#374151',
                  marginBottom: '0.5rem', 
                  display: 'block',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>Scheduled At <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  id="session-scheduled"
                  type="datetime-local"
                  value={sessionDraft.scheduledAt}
                  onChange={(e) => setSessionDraft((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                  style={{ 
                    width: '100%', 
                    padding: '0.875rem 1rem', 
                    borderRadius: '12px', 
                    border: '2px solid #e5e7eb',
                    fontSize: '0.95rem',
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: '#1e293b',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              
              <div>
                <label htmlFor="session-deadline" style={{ 
                  fontWeight: 600, 
                  fontSize: '0.875rem',
                  color: '#374151',
                  marginBottom: '0.5rem', 
                  display: 'block',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>Feedback Deadline <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                <input
                  id="session-deadline"
                  type="datetime-local"
                  value={sessionDraft.feedbackDeadlineAt}
                  onChange={(e) => setSessionDraft((prev) => ({ ...prev, feedbackDeadlineAt: e.target.value }))}
                  style={{ 
                    width: '100%', 
                    padding: '0.875rem 1rem', 
                    borderRadius: '12px', 
                    border: '2px solid #e5e7eb',
                    fontSize: '0.95rem',
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: '#1e293b',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Notes Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="session-notes" style={{ 
                fontWeight: 600, 
                fontSize: '0.875rem',
                color: '#374151',
                marginBottom: '0.5rem', 
                display: 'block',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}>Notes <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                id="session-notes"
                rows={4}
                value={sessionDraft.notes}
                onChange={(e) => setSessionDraft((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter agenda, milestones, or follow-up actions..."
                style={{ 
                  width: '100%', 
                  padding: '0.875rem 1rem', 
                  borderRadius: '12px', 
                  border: '2px solid #e5e7eb', 
                  resize: 'vertical',
                  fontSize: '0.95rem',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#1e293b',
                  lineHeight: 1.5,
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Submit Button */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              paddingTop: '1rem',
              borderTop: '1px solid #f1f5f9',
            }}>
              <button
                type="button"
                disabled={
                  creatingSession ||
                  !sessionDraft.programId ||
                  !sessionDraft.studentUsername.trim() ||
                  !(sessionDraft.supervisorUsername || username).trim() ||
                  !sessionDraft.scheduledAt
                }
                onClick={createSession}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: (creatingSession || !sessionDraft.programId || !sessionDraft.studentUsername.trim() || !sessionDraft.scheduledAt) 
                    ? '#cbd5e1' 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 600,
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  cursor: (creatingSession || !sessionDraft.programId || !sessionDraft.studentUsername.trim() || !sessionDraft.scheduledAt) ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                }}
              >
                {creatingSession ? 'Saving...' : '📅 Log Session'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Filter Section */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
            <span style={{ fontSize: '1.25rem' }}>🔍</span>
            <span style={{ fontWeight: 500 }}>Filter:</span>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              id="student-filter"
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              placeholder="Search by student username..."
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '0.9rem',
              }}
            />
          </div>
        </div>

        {/* Sessions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {sessions.length ? (
            sessions.map((s) => (
              <div key={s.id} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-h)' }}>{s.programName ?? 'Program'}</div>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    fontWeight: 600,
                    background: s.status === 'COMPLETED' ? '#dbeafe' : s.status === 'ACTIVE' ? '#dcfce7' : '#e0e7ff',
                    color: s.status === 'COMPLETED' ? '#2563eb' : s.status === 'ACTIVE' ? '#16a34a' : '#4f46e5',
                  }}>
                    {s.status === 'COMPLETED' ? '✓ ' : s.status === 'ACTIVE' ? '● ' : '○ '}{s.status}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                    <span>👨‍🎓</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-h)' }}>{s.studentUsername}</span>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <span>👨‍🏫</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-h)' }}>{s.supervisorUsername}</span>
                  </div>
                </div>

                <div style={{
                  background: '#f8fafc',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  marginBottom: '0.75rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                    <span>📅</span>
                    <span>Scheduled: <strong style={{ color: 'var(--text-h)' }}>{new Date(s.scheduledAt).toLocaleString()}</strong></span>
                  </div>
                  {s.feedbackDeadlineAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem' }}>
                      <span>⏰</span>
                      <span>Feedback due: <strong style={{ color: '#f59e0b' }}>{new Date(s.feedbackDeadlineAt).toLocaleString()}</strong></span>
                    </div>
                  )}
                </div>

                {canFeedback ? (
                  <button
                    type="button"
                    onClick={() => setSelectedSessionId(s.id)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '10px',
                      border: selectedSessionId === s.id ? '2px solid #667eea' : '1px solid #e2e8f0',
                      background: selectedSessionId === s.id ? '#eef2ff' : 'white',
                      color: selectedSessionId === s.id ? '#4f46e5' : '#64748b',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {selectedSessionId === s.id ? '✓ Selected for Feedback' : '📝 Select for Feedback'}
                  </button>
                ) : null}
              </div>
            ))
          ) : (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '3rem',
              background: '#f8fafc',
              borderRadius: '16px',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-h)', marginBottom: '0.5rem' }}>No Sessions Found</div>
              <div style={{ color: '#64748b' }}>Create your first supervision session or adjust your filters.</div>
            </div>
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
          <h2 className="portal-section__title">Analytics &amp; Reports</h2>
          <p className="portal-section__hint">Visual insights for decision-makers and accreditation</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button type="button" className="portal-btn portal-btn--primary" style={{ width: 'fit-content' }} onClick={loadReport}>
            Generate Analytics
          </button>
          <button type="button" className="portal-btn portal-btn--secondary" style={{ width: 'fit-content' }} onClick={loadAccreditation}>
            Accreditation Report
          </button>
        </div>

        {reportSummary ? (
          <>
            {/* Key Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="portal-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Sessions</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.25rem' }}>{reportSummary.metrics?.sessionsTotal ?? 0}</div>
              </div>
              <div className="portal-card" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Completed</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.25rem' }}>{reportSummary.metrics?.sessionsCompleted ?? 0}</div>
              </div>
              <div className="portal-card" style={{ background: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)', color: 'white', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Active</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.25rem' }}>{reportSummary.metrics?.sessionsActive ?? 0}</div>
              </div>
              <div className="portal-card" style={{ background: 'linear-gradient(135deg, #5c6bc0 0%, #7986cb 100%)', color: 'white', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Planned</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.25rem' }}>{reportSummary.metrics?.sessionsPlanned ?? 0}</div>
              </div>
              <div className="portal-card" style={{ background: 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)', color: 'white', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Feedback Coverage</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.25rem' }}>{reportSummary.metrics?.feedbackCoveragePercent ?? 0}%</div>
              </div>
              <div className="portal-card" style={{ background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)', color: 'white', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Overdue Feedback</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.25rem' }}>{reportSummary.metrics?.overdueFeedback ?? 0}</div>
              </div>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Session Status Doughnut Chart */}
              <div className="portal-card" style={{ padding: '1.5rem' }}>
                <div className="portal-card__title" style={{ marginBottom: '1rem' }}>Session Status Distribution</div>
                <div style={{ height: '280px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Doughnut
                    data={{
                      labels: ['Completed', 'Active', 'Planned'],
                      datasets: [{
                        data: [
                          reportSummary.metrics?.sessionsCompleted ?? 0,
                          reportSummary.metrics?.sessionsActive ?? 0,
                          reportSummary.metrics?.sessionsPlanned ?? 0,
                        ],
                        backgroundColor: ['#3b82f6', '#22c55e', '#6366f1'],
                        borderColor: ['#2563eb', '#16a34a', '#4f46e5'],
                        borderWidth: 2,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
                      },
                      cutout: '60%',
                    }}
                  />
                </div>
              </div>

              {/* Feedback & Reminders Bar Chart */}
              <div className="portal-card" style={{ padding: '1.5rem' }}>
                <div className="portal-card__title" style={{ marginBottom: '1rem' }}>Feedback &amp; Reminders</div>
                <div style={{ height: '280px' }}>
                  <Bar
                    data={{
                      labels: ['With Feedback', 'Reminders Sent', 'Pending', 'Overdue'],
                      datasets: [{
                        label: 'Count',
                        data: [
                          reportSummary.metrics?.sessionsWithFeedback ?? 0,
                          reportSummary.metrics?.remindersSent ?? 0,
                          reportSummary.metrics?.remindersPending ?? 0,
                          reportSummary.metrics?.remindersOverdue ?? 0,
                        ],
                        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
                        borderRadius: 8,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                        x: { grid: { display: false } },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Program Breakdown */}
            {(reportSummary.breakdown ?? []).length > 0 && (
              <div className="portal-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="portal-card__title" style={{ marginBottom: '1rem' }}>Program Performance</div>
                <div style={{ height: '300px' }}>
                  <Bar
                    data={{
                      labels: (reportSummary.breakdown ?? []).map(p => p.programName || 'Unknown'),
                      datasets: [
                        {
                          label: 'Total Sessions',
                          data: (reportSummary.breakdown ?? []).map(p => p.sessionsTotal ?? 0),
                          backgroundColor: '#6366f1',
                          borderRadius: 4,
                        },
                        {
                          label: 'Completed',
                          data: (reportSummary.breakdown ?? []).map(p => p.sessionsCompleted ?? 0),
                          backgroundColor: '#22c55e',
                          borderRadius: 4,
                        },
                        {
                          label: 'Active',
                          data: (reportSummary.breakdown ?? []).map(p => p.sessionsActive ?? 0),
                          backgroundColor: '#22c55e',
                          borderRadius: 4,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'top', labels: { usePointStyle: true } } },
                      scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                        x: { grid: { display: false } },
                      },
                    }}
                  />
                </div>
              </div>
            )}

            {/* Completion Progress by Program */}
            {(reportSummary.breakdown ?? []).length > 0 && (
              <div className="portal-card" style={{ padding: '1.5rem' }}>
                <div className="portal-card__title" style={{ marginBottom: '1rem' }}>Completion Progress by Program</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(reportSummary.breakdown ?? []).map((program, idx) => (
                    <div key={program.programId ?? idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 500 }}>{program.programName || 'Unknown Program'}</span>
                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{program.completionPercent ?? 0}%</span>
                      </div>
                      <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(program.completionPercent ?? 0, 100)}%`,
                            background: (program.completionPercent ?? 0) >= 75 ? 'linear-gradient(90deg, #22c55e, #16a34a)' :
                                        (program.completionPercent ?? 0) >= 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                                        'linear-gradient(90deg, #ef4444, #dc2626)',
                            borderRadius: '6px',
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        {program.sessionsCompleted ?? 0} of {program.sessionsTotal ?? 0} sessions completed
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="portal-empty" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>No Analytics Data Yet</div>
            <div style={{ color: '#64748b' }}>Click "Generate Analytics" to load institutional metrics and visualizations.</div>
          </div>
        )}

        {/* Accreditation Summary */}
        {accreditationSummary && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem' }}>Accreditation Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="portal-card" style={{ padding: '1.25rem', borderLeft: '4px solid #22c55e' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Supervision Compliance</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#22c55e' }}>{accreditationSummary.metrics?.supervisionCompliance ?? 0}%</div>
              </div>
              <div className="portal-card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Feedback Coverage</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#3b82f6' }}>{accreditationSummary.metrics?.feedbackCoveragePercent ?? 0}%</div>
              </div>
              <div className="portal-card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Reminder Delivery</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#8b5cf6' }}>{accreditationSummary.metrics?.reminderDeliveryPercent ?? 0}%</div>
              </div>
              <div className="portal-card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Programs Tracked</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>{accreditationSummary.metrics?.programsTracked ?? 0}</div>
              </div>
            </div>
            
            {/* Compliance Gauge Chart */}
            <div className="portal-card" style={{ padding: '1.5rem' }}>
              <div className="portal-card__title" style={{ marginBottom: '1rem' }}>Compliance Overview</div>
              <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
                <Doughnut
                  data={{
                    labels: ['Supervision Compliance', 'Feedback Coverage', 'Reminder Delivery'],
                    datasets: [{
                      data: [
                        accreditationSummary.metrics?.supervisionCompliance ?? 0,
                        accreditationSummary.metrics?.feedbackCoveragePercent ?? 0,
                        accreditationSummary.metrics?.reminderDeliveryPercent ?? 0,
                      ],
                      backgroundColor: ['#22c55e', '#3b82f6', '#8b5cf6'],
                      borderWidth: 0,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'right', labels: { padding: 15, usePointStyle: true } },
                    },
                    cutout: '70%',
                  }}
                />
              </div>
            </div>

            <div className="portal-card__meta" style={{ marginTop: '1rem', textAlign: 'center' }}>
              Report generated: {new Date(accreditationSummary.generatedAt).toLocaleString()}
            </div>
          </div>
        )}
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

      {activeSection === 'payments' && (
      <section className="portal-section">
        <div className="portal-section__header">
          <h2 className="portal-section__title">Payment transactions</h2>
          <p className="portal-section__hint">All student payment records from Stripe Checkout</p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="portal-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{paymentTransactions.length}</div>
            <div style={{ opacity: 0.9, fontSize: '0.85rem' }}>Total Transactions</div>
          </div>
          <div className="portal-card" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#fff' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{paymentTransactions.filter(t => t.status === 'COMPLETED').length}</div>
            <div style={{ opacity: 0.9, fontSize: '0.85rem' }}>Completed</div>
          </div>
          <div className="portal-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{paymentTransactions.filter(t => t.status === 'PENDING').length}</div>
            <div style={{ opacity: 0.9, fontSize: '0.85rem' }}>Pending</div>
          </div>
          <div className="portal-card" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
              MYR {paymentTransactions.filter(t => t.status === 'COMPLETED').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
            </div>
            <div style={{ opacity: 0.9, fontSize: '0.85rem' }}>Total Revenue</div>
          </div>
        </div>

        {paymentTransactions.length ? (
        <div className="portal-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Date</th>
                <th style={{ padding: '0.75rem' }}>Student</th>
                <th style={{ padding: '0.75rem' }}>Description</th>
                <th style={{ padding: '0.75rem' }}>Amount</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Completed</th>
              </tr>
            </thead>
            <tbody>
              {paymentTransactions.map((txn) => (
                <tr key={txn.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                    {new Date(txn.createdAt).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 500 }}>{txn.username}</td>
                  <td style={{ padding: '0.75rem' }}>{txn.description}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{txn.currency} {txn.amount.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className="portal-badge" style={{
                      background: txn.status === 'COMPLETED' ? '#22c55e' : txn.status === 'PENDING' ? '#f59e0b' : '#ef4444'
                    }}>
                      {txn.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                    {txn.completedAt ? new Date(txn.completedAt).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="portal-empty">No payment transactions yet.</div>
        )}
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
