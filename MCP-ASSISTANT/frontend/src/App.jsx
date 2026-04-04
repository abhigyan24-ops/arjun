import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import axios from 'axios'

import Login from './pages/Login'
import Overview from './pages/Overview'
import GitHubPage from './pages/GitHubPage'
import SlackPage from './pages/SlackPage'
import JiraPage from './pages/JiraPage'
import SmartActionsPage from './pages/SmartActionsPage'
import HistoryPage from './pages/HistoryPage'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import WebGLShader from './components/WebGLShader'

function MainApp() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [briefing, setBriefing] = useState(null)
  const [github, setGithub] = useState(null)
  const [slack, setSlack] = useState(null)
  const [jira, setJira] = useState(null)

  const fetchAllData = async (accessToken) => {
    setLoading(true)
    try {
      const [briefingRes, githubRes, slackRes, jiraRes] = await Promise.all([
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/briefing`, { google_token: accessToken }).catch(() => ({ data: null })),
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/github`, {}).catch(() => ({ data: null })),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/slack/messages`).catch(() => ({ data: null })),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/jira`).catch(() => ({ data: null })),
      ])

      setBriefing(briefingRes.data)
      setGithub({
        prs: githubRes.data?.open_prs || [],
        issues: githubRes.data?.assigned_issues || [],
        standup: githubRes.data?.standup || '',
      })
      setSlack(slackRes.data?.recent_messages || [])
      setJira({
        assigned: jiraRes.data?.assigned || [],
        overdue: jiraRes.data?.overdue || [],
        sprint: jiraRes.data?.sprint || [],
        total_assigned: jiraRes.data?.summary?.total_assigned || 0,
        total_overdue: jiraRes.data?.summary?.total_overdue || 0,
      })
    } catch (err) {
      console.error('Error fetching dashboard data', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userProfile, accessToken) => {
    setUser(userProfile)
    setToken(accessToken)
    fetchAllData(accessToken)
    navigate('/')
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    setBriefing(null)
    setGithub(null)
    setSlack(null)
    setJira(null)
    navigate('/')
  }

  const handleRefresh = () => {
    if (token) fetchAllData(token)
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  const userEmail = user?.email || briefing?.user_email || ''

  return (
    <>
      <WebGLShader />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', minHeight: '100vh', background: 'transparent', color: 'var(--text)' }}>
        <Sidebar user={user} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
        <div style={{ flex: 1, marginLeft: sidebarCollapsed ? 64 : 240, position: 'relative', transition: 'margin-left 300ms ease-in-out' }}>
        <TopBar onRefresh={handleRefresh} loading={loading} />
        <div style={{ paddingTop: 56 }}>
          <Routes>
            <Route path="/" element={<Overview user={user} token={token} briefing={briefing} github={github} slack={slack} jira={jira} />} />
            <Route path="/github" element={<GitHubPage user={user} github={github} token={token} userEmail={userEmail} />} />
            <Route path="/slack" element={<SlackPage slack={slack} token={token} userEmail={userEmail} />} />
            <Route path="/jira" element={<JiraPage jira={jira} token={token} userEmail={userEmail} />} />
            <Route path="/smart" element={<SmartActionsPage briefing={briefing} token={token} slack={slack} userEmail={userEmail} />} />
            <Route path="/history" element={<HistoryPage userEmail={userEmail} />} />
          </Routes>
        </div>
      </div>
    </div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  )
}
