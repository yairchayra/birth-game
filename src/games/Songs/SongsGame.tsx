import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { getSongs } from '@/services/firebase'
import PageWrapper from '@/components/PageWrapper'
import type { Song } from '@/types'

type HintLevel = 0 | 1 | 2 | 3 // 0=none, 1=artist, 2=cover, 3=spotify

export default function SongsGame() {
  const navigate     = useNavigate()
  const completeGame = useAppStore(s => s.completeGame)
  const openVideo    = useAppStore(s => s.openVideo)

  const [songs, setSongs]   = useState<Song[]>([])
  const [idx, setIdx]       = useState(0)
  const [hint, setHint]     = useState<HintLevel>(0)
  const [guess, setGuess]   = useState('')
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [score, setScore]   = useState(0)
  const [loading, setLoad]  = useState(true)

  const song = songs[idx]

  useEffect(() => {
    getSongs().then(s => { setSongs(s.slice(0, 10)); setLoad(false) })
  }, [])

  const submit = () => {
    if (!guess.trim()) return
    const correct = guess.trim().toLowerCase() === song.title.trim().toLowerCase()
    setResult(correct ? 'correct' : 'wrong')
    if (correct) setScore(s => s + Math.max(1, 4 - hint))
  }

  const next = () => {
    if (idx + 1 >= songs.length) {
      completeGame('songs', Math.round((score / (songs.length * 4)) * 100))
      setTimeout(() => openVideo('songs'), 600)
      return
    }
    setIdx(i => i + 1)
    setHint(0)
    setGuess('')
    setResult(null)
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <motion.div className="text-5xl" animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>🎵</motion.div>
    </div>
  )
  if (!song) return null

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-soft flex flex-col">
        <div className="px-5 pt-10 pb-3 flex items-center justify-between">
          <button onClick={() => navigate('/games')} className="btn-ghost">→ חזרה</button>
          <h1 className="text-xl font-black text-gradient">זהי את השיר</h1>
          <span className="text-sm text-gray-400">{idx + 1}/{songs.length}</span>
        </div>

        <div className="px-5 mb-4">
          <div className="h-1.5 bg-blush-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-l from-lavender-400 to-blush-400 rounded-full"
              animate={{ width: `${(idx / songs.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 px-5 pb-8 flex flex-col gap-4">
          {/* Lyric clue card */}
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-lavender-50 to-blush-50 opacity-60" />
            <div className="relative z-10">
              <div className="text-4xl mb-3">🎵</div>
              <p className="text-xs text-gray-400 mb-3 font-medium">השורה:</p>
              <blockquote className="text-xl font-bold text-gray-700 leading-relaxed">
                "{song.lyricClue}"
              </blockquote>
            </div>
          </motion.div>

          {/* Hints */}
          <AnimatePresence>
            {hint >= 1 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="card p-4 flex items-center gap-3">
                <span className="text-2xl">🎤</span>
                <div>
                  <p className="text-xs text-gray-400">אמן</p>
                  <p className="font-bold text-gray-700">{song.artist}</p>
                </div>
              </motion.div>
            )}
            {hint >= 2 && song.coverUrl && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="card p-3 flex items-center gap-3">
                <img src={song.coverUrl} alt="עטיפה" className="w-16 h-16 rounded-xl object-cover" />
                <div>
                  <p className="text-xs text-gray-400">עטיפת האלבום</p>
                  <p className="text-sm font-medium text-gray-600">הנה הגבורה!</p>
                </div>
              </motion.div>
            )}
            {hint >= 3 && song.spotifyUrl && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="card p-3">
                <a
                  href={song.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-green-600 font-semibold"
                >
                  <span className="text-2xl">🎧</span>
                  האזיני בספוטיפיי
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {result === 'correct' && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="card p-4 bg-green-50 text-center">
                <div className="text-3xl mb-1">🎉</div>
                <p className="font-bold text-green-700">מדהים! זיהית נכון!</p>
                <p className="text-sm text-gray-500">{song.title} — {song.artist}</p>
              </motion.div>
            )}
            {result === 'wrong' && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="card p-4 bg-red-50 text-center">
                <div className="text-3xl mb-1">🤔</div>
                <p className="font-bold text-red-500">לא הפעם...</p>
                {hint >= 3 && <p className="text-sm text-gray-500">התשובה: {song.title}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {!result ? (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={guess}
                onChange={e => setGuess(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="שם השיר..."
                className="input-field text-center text-lg"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setHint(h => Math.min(3, h + 1) as HintLevel)}
                  disabled={hint >= 3}
                  className="btn-secondary flex-1 text-sm"
                >
                  💡 רמז {hint > 0 ? `(${3 - hint} נותרו)` : ''}
                </button>
                <button onClick={submit} className="btn-primary flex-1">
                  נחשי! 🎵
                </button>
              </div>
            </div>
          ) : (
            <button onClick={next} className="btn-primary text-center">
              {idx + 1 >= songs.length ? 'סיום! 🏆' : 'שיר הבא →'}
            </button>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
