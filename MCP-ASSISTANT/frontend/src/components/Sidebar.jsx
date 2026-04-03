import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, GitBranch, MessageSquare, LayoutGrid, Zap, LogOut, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Sidebar({ user, onLogout, collapsed, onToggleCollapse }) {
  const location = useLocation()
  const [hoveredItem, setHoveredItem] = useState(null)

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'GitHub', path: '/github', icon: GitBranch },
    { name: 'Slack', path: '/slack', icon: MessageSquare },
    { name: 'Jira', path: '/jira', icon: LayoutGrid },
    { name: 'Smart Actions', path: '/smart', icon: Zap },
    { name: 'History', path: '/history', icon: Clock },
  ]

  return (
    <div style={{
      width: collapsed ? 64 : 240,
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.07)',
      zIndex: 50,
      transition: 'width 300ms ease-in-out',
      overflow: 'hidden',
    }}>
      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        style={{
          position: 'absolute',
          right: 8,
          top: 16,
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '50%',
          color: '#888',
          padding: 0,
          transition: 'all 0.2s',
          zIndex: 10,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#888' }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: collapsed ? '28px 12px 20px' : '28px 24px 20px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        transition: 'all 300ms ease-in-out',
      }}>
        <div style={{
          width: 40, height: 40,
          minWidth: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 16,
          background: 'var(--surface2)',
          border: '1px solid var(--cyan)',
          boxShadow: '0 0 15px rgba(0,212,255,0.4)',
          borderRadius: 10,
          color: '#fff',
        }}>WM</div>
        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 700, color: '#fff', letterSpacing: '0.02em', fontSize: 15, textShadow: '0 0 15px rgba(0,212,255,0.6)' }}>WorkMind AI</span>
            <span style={{
              fontSize: 9, color: 'var(--cyan)', border: '1px solid var(--cyan)',
              padding: '1px 6px', borderRadius: 4, width: 'fit-content', marginTop: 3,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>beta</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map((item, i) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          const isHovered = hoveredItem === item.name
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: collapsed ? '10px 0' : '10px 16px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 8,
                  borderLeft: collapsed ? 'none' : (isActive ? '3px solid var(--cyan)' : '3px solid transparent'),
                  background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
                  color: isActive ? 'var(--cyan)' : 'var(--text2)',
                  transition: 'all 0.2s',
                  fontSize: 14, fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(0,212,255,0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text2)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {!collapsed && <span>{item.name}</span>}
              </Link>

              {/* Tooltip when collapsed */}
              {collapsed && isHovered && (
                <div style={{
                  position: 'absolute',
                  left: 70,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 100,
                }}>
                  {item.name}
                </div>
              )}
            </motion.div>
          )
        })}
      </nav>

      {/* User Section */}
      <div style={{
        padding: collapsed ? '16px 8px' : '16px',
        borderTop: '1px solid var(--border)',
        marginBottom: 8,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, minWidth: 32, borderRadius: '50%',
              background: 'var(--surface2)', border: '1px solid var(--border2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
              boxShadow: '0 0 10px rgba(121,40,202,0.3)',
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</span>
                <span style={{ color: 'var(--text2)', fontSize: 10 }}>Free plan</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onLogout}
              style={{
                background: 'none', border: 'none', color: 'var(--text2)', padding: 4,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text2)' }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
