import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Mail, FileText, Copy, Check, Send, X } from 'lucide-react'
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

  // Send Email Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sendTo, setSendTo] = useState('')
  const [sendSubject, setSendSubject] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

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

  const extractEmail = (sender) => {
    if (!sender) return '';
    const match = sender.match(/<(.+)>/);
    return match ? match[1] : sender;
  }

  const openSendModal = () => {
    if (!selectedEmail) return;
    const email = emails[parseInt(selectedEmail)]
    setSendTo(extractEmail(email.sender))
    setSendSubject(email.subject?.toLowerCase().startsWith('re:') ? email.subject : `Re: ${email.subject}`)
    setIsModalOpen(true)
  }

  const handleSendEmail = async () => {
    setSendingEmail(true)
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/smart/send-email`, {
        google_token: token,
        to_email: sendTo,
        subject: sendSubject,
        body: emailDraft,
        user_email: userEmail
      })
      if (res.data.success) {
        setToast({ show: true, message: 'Email sent from your Gmail!', type: 'success' })
        setIsModalOpen(false)
      } else {
        throw new Error("Failed")
      }
    } catch (err) {
      setToast({ show: true, message: 'Failed to send. Try again.', type: 'error' })
    } finally {
      setSendingEmail(false)
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
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
                  <textarea value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} rows={8} className="liquid-glass"
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
                        padding: '6px 12px', borderRadius: 6, cursor: 'pointer'
                      }}>
                      {emailCopied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                    </button>

                    {draftUrl && (
                      <button onClick={() => window.open(draftUrl, '_blank')} className="liquid-glass"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500,
                          color: 'var(--text)',
                          padding: '6px 12px', borderRadius: 6, cursor: 'pointer'
                        }}>
                        <FileText size={12} /> Save as Draft
                      </button>
                    )}

                    <button onClick={openSendModal} className="liquid-glass"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500,
                        color: 'var(--success)',
                        padding: '6px 12px', borderRadius: 6, cursor: 'pointer'
                      }}>
                      <Send size={12} /> Send Now
                    </button>
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

      {/* Send Email Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
              background: 'rgba(20, 20, 25, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 12, padding: 24, width: '100%', maxWidth: 500,
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--text)' }}>Send Email</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>To</label>
                <input type="text" value={sendTo} onChange={(e) => setSendTo(e.target.value)}
                  className="liquid-glass" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>Subject</label>
                <input type="text" value={sendSubject} onChange={(e) => setSendSubject(e.target.value)}
                  className="liquid-glass" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>Body</label>
                <textarea value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} rows={6}
                  className="liquid-glass" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button onClick={() => setIsModalOpen(false)} className="liquid-glass"
                  style={{ padding: '8px 16px', borderRadius: 6, border: 'none', color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleSendEmail} disabled={sendingEmail}
                  style={{
                    padding: '8px 16px', borderRadius: 6, border: 'none',
                    background: 'linear-gradient(135deg, #00d4ff, #7928ca)', color: '#fff',
                    fontSize: 13, fontWeight: 500, opacity: sendingEmail ? 0.7 : 1, cursor: 'pointer'
                  }}>
                  {sendingEmail ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
            background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
            color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)'
          }}>
          {toast.message}
        </motion.div>
      )}
    </div>
  )
}
