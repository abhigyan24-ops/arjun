import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Mail, FileText, Copy, Check } from 'lucide-react'
import GlowCard from '../components/GlowCard'
import axios from 'axios'

export default function SmartActionsPage({ briefing, token, slack, userEmail }) {
  // Email draft state
  const [selectedEmail, setSelectedEmail] = useState('')
  const [emailInstruction, setEmailInstruction] = useState('')
  const [emailDraft, setEmailDraft] = useState('')
  const [draftId, setDraftId] = useState('')
  const [draftUrl, setDraftUrl] = useState('')
  const [draftSuccessMsg, setDraftSuccessMsg] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)

  // Meeting prep state
  const [selectedMeeting, setSelectedMeeting] = useState('')
  const [meetingPrep, setMeetingPrep] = useState('')
  const [meetingLoading, setMeetingLoading] = useState(false)
  const [meetingCopied, setMeetingCopied] = useState(false)

  const emails = briefing?.urgent_emails || []
  const meetings = briefing?.meetings || []

  const generateEmailDraft = async () => {
    if (!selectedEmail) return
    setEmailLoading(true)
    try {
      const email = emails[parseInt(selectedEmail)]
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/smart/draft-email`, {
        email: {
          subject: email.subject,
          sender: email.sender,
          snippet: email.snippet || '',
        },
        instruction: emailInstruction,
        user_email: userEmail,
        google_token: token,
      })
      setEmailDraft(res.data.draft_text || res.data.draft || res.data.response || 'No draft generated')
      if (res.data.draft_id) {
          setDraftId(res.data.draft_id)
          setDraftUrl(res.data.draft_url)
          setDraftSuccessMsg('Draft saved to your Gmail!')
      } else {
          setDraftId('')
          setDraftUrl('')
          setDraftSuccessMsg('')
      }
    } catch (_err) {
      setEmailDraft('Failed to generate draft. Please try again.')
      setDraftId('')
      setDraftUrl('')
      setDraftSuccessMsg('')
    } finally {
      setEmailLoading(false)
    }
  }

  const generateMeetingPrep = async () => {
    if (!selectedMeeting) return
    setMeetingLoading(true)
    try {
      const meeting = meetings[parseInt(selectedMeeting)]
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/smart/meeting-prep`, {
        meeting: {
          title: meeting.title,
          attendees: meeting.attendees || [],
          start_time: meeting.start_time,
        },
        emails: briefing?.urgent_emails || [],
        slack_messages: [],
        user_email: userEmail,
      })
      setMeetingPrep(res.data.prep || res.data.response || 'No prep generated')
    } catch (_err) {
      setMeetingPrep('Failed to generate prep. Please try again.')
    } finally {
      setMeetingLoading(false)
    }
  }

  const copyText = (text, setCopied) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const stagger = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
  }

  const inputStyle = {
    width: '100%', color: 'var(--text)',
    borderRadius: 8, padding: '10px 12px',
    fontSize: 13, outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <motion.div custom={0} initial="hidden" animate="visible" variants={stagger}
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <Zap size={20} style={{ color: 'var(--cyan)' }} />
        <h2 className="glow-text-title" style={{ fontSize: 24, fontWeight: 700 }}>Smart Actions</h2>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* LEFT: Email Draft */}
        <motion.div custom={1} initial="hidden" animate="visible" variants={stagger}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={16} style={{ color: 'var(--cyan)' }} /> Draft Email Reply
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>Generate AI-powered email responses from your inbox</p>

          <GlowCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Email</label>
                <select value={selectedEmail} onChange={(e) => setSelectedEmail(e.target.value)}
                  className="liquid-glass"
                  style={inputStyle}>
                  <option value="">Choose an email...</option>
                  {emails.map((email, i) => (
                    <option key={i} value={i}>{email.sender}: {email.subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instructions (optional)</label>
                <input type="text" value={emailInstruction} onChange={(e) => setEmailInstruction(e.target.value)}
                  placeholder="e.g., Be polite but decline the meeting"
                  className="liquid-glass"
                  style={inputStyle} />
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={generateEmailDraft}
                disabled={emailLoading || !selectedEmail}
                style={{
                  width: '100%', padding: 12, borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #00d4ff, #7928ca)', color: '#fff',
                  fontSize: 14, fontWeight: 600, opacity: emailLoading || !selectedEmail ? 0.5 : 1,
                  boxShadow: '0 0 20px rgba(0,212,255,0.15)', transition: 'opacity 0.2s',
                }}>
                {emailLoading ? 'Generating...' : 'Generate Draft'}
              </motion.button>

              {emailDraft && (
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Generated Draft</label>
                  <textarea value={emailDraft} readOnly rows={8} className="liquid-glass"
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                  
                  {draftSuccessMsg && (
                    <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 8, marginBottom: 8 }}>
                      {draftSuccessMsg}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => copyText(emailDraft, setEmailCopied)} className="liquid-glass"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500,
                        color: emailCopied ? 'var(--success)' : 'var(--cyan)',
                        padding: '6px 12px', borderRadius: 6,
                      }}>
                      {emailCopied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                    </button>

                    {draftUrl && (
                      <button onClick={() => window.open(draftUrl, '_blank')} className="liquid-glass"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500,
                          color: 'var(--text)',
                          padding: '6px 12px', borderRadius: 6,
                        }}>
                        <Mail size={12} /> Open in Gmail
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </GlowCard>
        </motion.div>

        {/* RIGHT: Meeting Prep */}
        <motion.div custom={2} initial="hidden" animate="visible" variants={stagger}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} style={{ color: 'var(--purple)' }} /> Meeting Prep
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>AI-generated preparation notes for your meetings</p>

          <GlowCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Meeting</label>
                <select value={selectedMeeting} onChange={(e) => setSelectedMeeting(e.target.value)}
                  className="liquid-glass"
                  style={inputStyle}>
                  <option value="">Choose a meeting...</option>
                  {meetings.map((meeting, i) => (
                    <option key={i} value={i}>{meeting.title} ({meeting.start_time})</option>
                  ))}
                </select>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={generateMeetingPrep}
                disabled={meetingLoading || !selectedMeeting}
                style={{
                  width: '100%', padding: 12, borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #00d4ff, #7928ca)', color: '#fff',
                  fontSize: 14, fontWeight: 600, opacity: meetingLoading || !selectedMeeting ? 0.5 : 1,
                  boxShadow: '0 0 20px rgba(0,212,255,0.15)', transition: 'opacity 0.2s',
                }}>
                {meetingLoading ? 'Generating...' : 'Generate Prep'}
              </motion.button>

              {meetingPrep && (
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preparation Notes</label>
                  <div className="liquid-glass" style={{
                    borderRadius: 8, padding: 16, fontSize: 13, color: 'var(--text)',
                    lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto',
                  }}>{meetingPrep}</div>
                  <button onClick={() => copyText(meetingPrep, setMeetingCopied)} className="liquid-glass"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, marginTop: 8,
                      color: meetingCopied ? 'var(--success)' : 'var(--cyan)',
                      padding: '6px 12px', borderRadius: 6,
                    }}>
                    {meetingCopied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
              )}
            </div>
          </GlowCard>
        </motion.div>
      </div>
    </div>
  )
}
