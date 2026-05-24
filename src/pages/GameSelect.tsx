import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import PageWrapper from '@/components/PageWrapper'
import type { GameId } from '@/types'

const GAMES: {
  id:    GameId
  title: string
  desc:  string
  emoji: string
  path:  string
  color: string
  bg:    string
}[] = [
  { id: 'wordle',    title: 'Wordle',         desc: 'נחשי מילה בעברית תוך 6 ניסיונות',   emoji: '🔤', path: '/wordle',   color: 'text-green-600',    bg: 'from-green-50 to-emerald-50' },
  { id: 'who-am-i',  title: 'מי אני?',        desc: 'זהי מי מסתתר בתמונה המפוקסלת',      emoji: '🔍', path: '/who-am-i', color: 'text-blush-500',     bg: 'from-blush-50 to-rose-50'    },
  { id: 'songs',     title: 'זהי את השיר',    desc: 'שורות מבולבלות — איזה שיר זה?',     emoji: '🎵', path: '/songs',    color: 'text-lavender-500',  bg: 'from-lavender-50 to-purple-50'},
  { id: 'luka',      title: 'כינויים ללוקה',  desc: 'נחשי את הכינוי של לוקה מהתמונה',   emoji: '🐾', path: '/luka',     color: 'text-peach-400',     bg: 'from-peach-50 to-amber-50'   },
]

export default function GameSelect() {
  const navigate   = useNavigate()
  const progress   = useAppStore(s => s.progress)
  const openVideo  = useAppStore(s => s.openVideo)
  const resetGame  = useAppStore(s => s.resetGame)

  // Which game's reset confirm is open
  const [confirmReset, setConfirmReset] = useState<GameId | null>(null)

  const handleCardClick = (game: typeof GAMES[0]) => {
    const p = progress[game.id]
    if (p.completed && !p.videoWatched) {
      openVideo(game.id)
    } else {
      navigate(game.path)
    }
  }

  const handleReset = (e: React.MouseEvent, id: GameId) => {
    e.stopPropagation()
    setConfirmReset(id)
  }

  const confirmResetGame = (id: GameId) => {
    resetGame(id)
    setConfirmReset(null)
  }

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } }
  const item      = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-soft flex flex-col">
        {/* Header */}
        <div className="px-5 pt-12 pb-4">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => navigate('/home')}
            className="btn-ghost mb-4 flex items-center gap-1 pr-0"
          >
            → חזרה
          </motion.button>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="section-title">בחרי משחק 🎮</h1>
            <p className="section-subtitle">לאחר כל משחק תופיע הפתעה מיוחדת מהבית 💕</p>
          </motion.div>
        </div>

        {/* Game cards */}
        <motion.div
          className="flex-1 px-5 pb-8 flex flex-col gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {GAMES.map(game => {
            const p         = progress[game.id]
            const completed = p?.completed
            const watched   = p?.videoWatched

            return (
              <motion.div key={game.id} variants={item}>
                <div
                  onClick={() => handleCardClick(game)}
                  className={`game-card bg-gradient-to-br ${game.bg} relative overflow-hidden`}
                >
                  {/* Status badge */}
                  <div className="absolute top-3 left-3 z-10">
                    {completed
                      ? <span className="badge-success text-xs">✓ הושלם</span>
                      : <span className="badge-pending text-xs">חדש</span>
                    }
                  </div>

                  {/* Reset button — top left, only if completed */}
                  {completed && (
                    <button
                      onClick={e => handleReset(e, game.id)}
                      className="absolute top-3 right-3 z-10 bg-white/70 hover:bg-white rounded-full px-2.5 py-1 text-xs text-gray-500 font-medium transition-all active:scale-95"
                      title="אפס משחק"
                    >
                      ↺ אפס
                    </button>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                    <motion.div
                      className="text-5xl flex-shrink-0"
                      whileTap={{ scale: 0.9, rotate: -5 }}
                    >
                      {completed ? '✅' : game.emoji}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xl font-black ${game.color} mb-1`}>
                        {game.title}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2">{game.desc}</p>
                    </div>
                    <div className="text-gray-300 flex-shrink-0">
                      {completed && watched ? '🎬' : '←'}
                    </div>
                  </div>
                </div>

                {/* Inline confirm reset */}
                <AnimatePresence>
                  {confirmReset === game.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 px-4 py-3 bg-red-50 rounded-2xl flex items-center justify-between border border-red-100">
                        <p className="text-sm text-red-500 font-medium">
                          לאפס את "{game.title}"?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmReset(null)}
                            className="text-xs px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-500 active:scale-95"
                          >
                            ביטול
                          </button>
                          <button
                            onClick={() => confirmResetGame(game.id)}
                            className="text-xs px-3 py-1.5 rounded-xl bg-red-400 text-white font-semibold active:scale-95"
                          >
                            אפס!
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </PageWrapper>
  )
}
