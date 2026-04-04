import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import { GitPullRequest, GitCommitHorizontal, ExternalLink, Copy, Check, Unplug } from 'lucide-react'
import GlowCard from '../components/GlowCard'
import StatusBadge from '../components/StatusBadge'

const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function GitHubPage({ user, github, token, userEmail }) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [localGithub, setLocalGithub] = useState(null)

  useEffect(() => {
    if (!userEmail) return
    const fetchGithub = async () => {
      try {
        setLoading(true)
        const res = await axios.post(`${BASE}/github`, { user_email: userEmail })
        setLocalGithub(res.data)
      } catch (e) {
        console.error('GitHub fetch error:', e)
        setLocalGithub(null)
      } finally {
        setLoading(false)
      }
    }
    fetchGithub()
  }, [userEmail])

  const prs = localGithub?.prs || []
  const issues = localGithub?.issues || []
  const standup = localGithub?.standup || ''

  const copyStandup = () => {
    navigator.clipboard.writeText(standup)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 16 }}>
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,212,255,0.2)', border: '2px solid var(--cyan)' }}
        />
        <p style={{ color: 'var(--cyan)', fontWeight: 600, fontSize: 14, letterSpacing: '0.05em' }}>Loading GitHub...</p>
      </div>
    )
  }

  if (!loading && localGithub?.not_connected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 24 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <GlowCard>
            <div style={{ padding: '40px 60px', textAlign: 'center', maxWidth: 400 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,212,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                color: 'var(--cyan)', border: '1px solid rgba(0,212,255,0.2)'
              }}>
                <Unplug size={32} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 12 }}>GitHub Not Connected</h2>
              <p style={{ color: 'var(--text2)', marginBottom: 32, lineHeight: 1.6 }}>
                Connect your GitHub account to see your PRs, issues and commits
              </p>
              <button
                onClick={() => navigate('/connections')}
                style={{
                  background: 'transparent', border: '1px solid var(--cyan)', color: 'var(--cyan)',
                  padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 0 15px rgba(0,212,255,0.1)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,212,255,0.05)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                Go to Connections
              </button>
            </div>
          </GlowCard>
        </motion.div>
      </div>
    )
  }

  const stagger = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
  }

  return (
    <div style={{ padding: '24px 24px 24px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={stagger}
        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h2 className="glow-text-title" style={{ fontSize: 24, fontWeight: 700 }}>GitHub</h2>
        {localGithub?.username && (
          <span style={{
            fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
            background: 'rgba(0,212,255,0.1)', color: 'var(--cyan)',
            border: '1px solid rgba(0,212,255,0.2)', padding: '3px 10px', borderRadius: 6,
          }}>@{localGithub.username}</span>
        )}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
        {/* LEFT COLUMN */}
        <div>
          {/* Pull Requests */}
          <motion.div custom={1} initial="hidden" animate="visible" variants={stagger}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <GitPullRequest size={16} style={{ color: 'var(--cyan)' }} />
              Open Pull Requests
              <span style={{ fontSize: 11, background: 'rgba(0,212,255,0.1)', color: 'var(--cyan)', padding: '1px 8px', borderRadius: 9999, marginLeft: 4 }}>{prs.length}</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prs.length > 0 ? prs.map((pr, i) => (
                <motion.div key={i} custom={i + 2} initial="hidden" animate="visible" variants={stagger}>
                  <GlowCard>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{pr.title}</p>
                        <p style={{ fontSize: 12, color: 'var(--cyan)', marginBottom: 6 }}>{pr.repo || 'Unknown repo'}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text2)' }}>
                            {pr.created_at ? new Date(pr.created_at).toLocaleDateString() : ''}
                          </span>
                          <StatusBadge status={pr.state || 'open'} />
                        </div>
                      </div>
                      {(pr.url || pr.html_url) && (
                        <a href={pr.url || pr.html_url} target="_blank" rel="noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500,
                            color: 'var(--cyan)', padding: '4px 10px', borderRadius: 6,
                            border: '1px solid rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.05)',
                            whiteSpace: 'nowrap', transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,212,255,0.15)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,212,255,0.05)' }}
                        >
                          <ExternalLink size={12} /> View PR
                        </a>
                      )}
                    </div>
                  </GlowCard>
                </motion.div>
              )) : (
                <GlowCard>
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                    <GitPullRequest size={28} style={{ opacity: 0.2, marginBottom: 8 }} />
                    <p>No open pull requests</p>
                  </div>
                </GlowCard>
              )}
            </div>
          </motion.div>

          {/* Issues */}
          <motion.div custom={3} initial="hidden" animate="visible" variants={stagger} style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              Assigned Issues
              <span style={{ fontSize: 11, background: 'rgba(0,212,255,0.1)', color: 'var(--cyan)', padding: '1px 8px', borderRadius: 9999 }}>{issues.length}</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {issues.length > 0 ? issues.map((issue, i) => (
                <GlowCard key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{issue.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--cyan)' }}>{issue.repo || ''}</p>
                    </div>
                    {(issue.url || issue.html_url) && (
                      <a href={issue.url || issue.html_url} target="_blank" rel="noreferrer"
                        style={{ fontSize: 11, color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </GlowCard>
              )) : (
                <GlowCard>
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>No assigned issues</div>
                </GlowCard>
              )}
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <motion.div custom={2} initial="hidden" animate="visible" variants={stagger}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <GitCommitHorizontal size={16} style={{ color: 'var(--cyan)' }} />
              Recent Activity
            </h3>
            <GlowCard>
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                <GitCommitHorizontal size={28} style={{ opacity: 0.2, marginBottom: 8 }} />
                <p>Commit history will appear here</p>
              </div>
            </GlowCard>
          </motion.div>

          <motion.div custom={4} initial="hidden" animate="visible" variants={stagger}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Today's Standup</h3>
            <GlowCard glow={!!standup}>
              {standup ? (
                <>
                  <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{standup}</p>
                  <button onClick={copyStandup} className="liquid-glass" style={{
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500,
                    color: copied ? 'var(--success)' : 'var(--cyan)',
                    padding: '6px 12px', borderRadius: 6, transition: 'all 0.2s',
                  }}>
                    {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy to clipboard</>}
                  </button>
                </>
              ) : (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                  Standup will be generated after data loads
                </div>
              )}
            </GlowCard>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
