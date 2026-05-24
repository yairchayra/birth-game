import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase/config'
import AdminWordle from '@/components/admin/AdminWordle'
import AdminWhoAmI from '@/components/admin/AdminWhoAmI'
import AdminSongs from '@/components/admin/AdminSongs'
import AdminLuka from '@/components/admin/AdminLuka'
import AdminVideos from '@/components/admin/AdminVideos'
import AdminFinalLetter from '@/components/admin/AdminFinalLetter'

type Tab = 'wordle' | 'whoami' | 'songs' | 'luka' | 'videos' | 'letter'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'wordle', label: 'Wordle',   emoji: '🔤' },
  { id: 'whoami', label: 'מי אני',  emoji: '🔍' },
  { id: 'songs',  label: 'שירים',   emoji: '🎵' },
  { id: 'luka',   label: 'לוקה',    emoji: '🐾' },
  { id: 'videos', label: 'סרטונים', emoji: '🎬' },
  { id: 'letter', label: 'מכתב',    emoji: '💌' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [tab, setTab]         = useState<Tab>('wordle')
  const [authed, setAuthed]   = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      if (!user) navigate('/admin')
      else setAuthed(true)
      setChecking(false)
    })
  }, [navigate])

  if (checking) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <div className="text-3xl animate-pulse">⚙️</div>
    </div>
  )
  if (!authed) return null

  const handleLogout = async () => { await signOut(auth); navigate('/admin') }

  const renderTab = () => {
    switch (tab) {
      case 'wordle': return <AdminWordle />
      case 'whoami': return <AdminWhoAmI />
      case 'songs':  return <AdminSongs />
      case 'luka':   return <AdminLuka />
      case 'videos': return <AdminVideos />
      case 'letter': return <AdminFinalLetter />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      <div className="bg-white/80 backdrop-blur-sm border-b border-blush-100 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-black text-gradient">Admin Panel</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/games')} className="btn-secondary text-sm py-1.5 px-3">
            🎮 נסה
          </button>
          <button onClick={handleLogout} className="btn-ghost text-sm text-red-400">
            יציאה
          </button>
        </div>
      </div>

      <div className="overflow-x-auto px-3 py-3 border-b border-blush-50">
        <div className="flex gap-2 min-w-max">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                tab === t.id
                  ? 'bg-gradient-to-r from-blush-400 to-lavender-400 text-white shadow-medium'
                  : 'bg-white/60 text-gray-500 hover:bg-blush-50'
              }`}
            >
              <span>{t.emoji}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 px-5 py-5"
      >
        {renderTab()}
      </motion.div>
    </div>
  )
}
