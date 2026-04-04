import { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { motion } from 'framer-motion'
import axios from 'axios'
import WebGLShader from '../components/WebGLShader'

export default function Login({ onLogin }) {
  const [btnHovered, setBtnHovered] = useState(false)
  const [infoHovered, setInfoHovered] = useState(false)
  const [cardHovered, setCardHovered] = useState(false)
  const [logoHovered, setLogoHovered] = useState(false)
  const [aboutHovered, setAboutHovered] = useState(false)
  const [signupHovered, setSignupHovered] = useState(false)

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
        onLogin(res.data, tokenResponse.access_token)
      } catch (err) {
        console.error('Failed to fetch user profile', err)
      }
    },
    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
  })

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'transparent', overflow: 'hidden' }}>
      {/* WebGL Background */}
      <WebGLShader />

      {/* All content above the animation */}
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Floating pill navbar */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            marginTop: 24,
            padding: '10px 24px',
            borderRadius: 9999,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 200ms ease' }}
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
          >
            <div style={{
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 11,
              background: 'var(--surface2)',
              border: '1px solid var(--cyan)',
              boxShadow: '0 0 10px rgba(0,212,255,0.3)',
              borderRadius: 7,
              color: '#fff',
            }}>WM</div>
            <span style={{
              fontWeight: 600, color: '#fff', fontSize: 14, letterSpacing: '0.01em',
              textShadow: logoHovered ? '0 0 15px rgba(0,212,255,0.6)' : 'none',
              transition: 'all 200ms ease',
            }}>WorkMind AI</span>
          </div>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                background: 'transparent', border: 'none',
                color: aboutHovered ? 'white' : 'rgba(255,255,255,0.6)',
                fontSize: 13, fontWeight: 500, padding: '4px 12px', borderRadius: 6,
                transition: 'all 200ms ease',
                textShadow: aboutHovered ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
              }}
              onMouseEnter={() => setAboutHovered(true)}
              onMouseLeave={() => setAboutHovered(false)}
            >About</button>
            <button
              style={{
                background: signupHovered ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.1)',
                border: signupHovered ? '1px solid rgba(0,212,255,0.6)' : '1px solid rgba(0,212,255,0.2)',
                color: 'var(--cyan)', fontSize: 13, fontWeight: 500,
                padding: '4px 14px', borderRadius: 6,
                transition: 'all 200ms ease',
                boxShadow: signupHovered ? '0 0 15px rgba(0,212,255,0.2)' : 'none',
                transform: signupHovered ? 'translateY(-1px)' : 'translateY(0)',
              }}
              onMouseEnter={() => setSignupHovered(true)}
              onMouseLeave={() => setSignupHovered(false)}
            >Sign up</button>
          </div>
        </motion.nav>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            style={{
              width: 440,
              background: cardHovered ? 'rgba(8, 8, 16, 0.75)' : 'rgba(8, 8, 16, 0.6)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              border: cardHovered ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: 40,
              boxShadow: cardHovered
                ? '0 0 40px rgba(0,212,255,0.08), 0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'
                : '0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center',
              transition: 'all 300ms ease',
              transform: cardHovered ? 'translateY(-2px)' : 'translateY(0)',
            }}
            onMouseEnter={() => setCardHovered(true)}
            onMouseLeave={() => setCardHovered(false)}
          >
            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              style={{
                fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em',
                color: 'white', marginBottom: 8,
                textShadow: '0 0 30px rgba(255,255,255,0.6), 0 0 60px rgba(255,255,255,0.2)',
              }}
            >Welcome to WorkMind</motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, marginBottom: 32, textShadow: '0 0 20px rgba(0,212,255,0.3)' }}
            >Your AI-powered work assistant</motion.p>

            {/* Google button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => login()}
              style={{
                width: '100%',
                background: btnHovered ? 'rgba(8, 8, 16, 0.85)' : 'rgba(8, 8, 16, 0.6)',
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                border: btnHovered ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                borderRadius: 9999, padding: 14,
                fontWeight: 600, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 300ms ease',
                marginBottom: 24,
                boxShadow: btnHovered ? '0 0 20px rgba(0,212,255,0.15), 0 8px 32px rgba(0,0,0,0.4)' : 'none',
                transform: btnHovered ? 'translateY(-2px)' : 'translateY(0)',
              }}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
            >
              <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </motion.button>

            {/* Info box */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              style={{
                width: '100%',
                background: infoHovered ? 'rgba(0, 212, 255, 0.12)' : 'rgba(0, 212, 255, 0.08)',
                border: infoHovered ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid rgba(0, 212, 255, 0.25)',
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 20,
                transition: 'all 300ms ease',
                boxShadow: infoHovered ? '0 0 20px rgba(0,212,255,0.1), 0 8px 32px rgba(0,0,0,0.4)' : 'none',
                transform: infoHovered ? 'translateY(-2px)' : 'translateY(0)',
              }}
              onMouseEnter={() => setInfoHovered(true)}
              onMouseLeave={() => setInfoHovered(false)}
            >
              <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, lineHeight: 1.6, fontWeight: 400 }}>
                WorkMind connects to your Gmail, Calendar, GitHub, Slack, and Jira to generate intelligent daily briefings, AI standups, and smart actions -- all from a single dashboard.
              </p>
            </motion.div>

            {/* Terms */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.5 }}
              style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.55)', lineHeight: 1.5 }}
            >
              By signing in, you agree to our <span style={{ color: '#00d4ff', textDecoration: 'underline', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff' }} onMouseLeave={(e) => { e.currentTarget.style.color = '#00d4ff' }}>Terms</span> and <span style={{ color: '#00d4ff', textDecoration: 'underline', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff' }} onMouseLeave={(e) => { e.currentTarget.style.color = '#00d4ff' }}>Privacy Policy</span>. We use OAuth and never store your credentials.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
