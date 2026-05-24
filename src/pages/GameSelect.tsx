import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import PageWrapper from '@/components/PageWrapper'
import type { GameId } from '@/types'

const GAMES: {
  id:     GameId
  title:  string
  desc:   string
  emoji:  string
  path:   string
  color:  string
  bg:     string
}[] = [
  {
    id:    'wordle',
    title: 'Wordle',
    desc:  'נחשי מילה בעברית תוך 6 ניסיונות',
    emoji: '🔤',
    path:  '/wordle',
    color: 'text-green-600',
    bg:    'from-green-50 to-emerald-50',
  },
  {
    id:    'who-am-i',
    title: 'מי אני?',
    desc:  'זהי מי מסתתר בתמונה המפוקסלת',
    emoji: '🔍',
    path:  '/who-am-i',
    color: 'text-blush-500',
    bg:    'from-blush-50 to-rose-50',
  },
  {
    id:    'songs',
    title: 'זהי את השיר',
    desc:  'שורה מבולבלת — איזה שיר זה?',
    emoji: '🎵',
    path:  '/songs',
    color: 'text-lavender-500',
    bg:    'from-lavender-50 to-purple-50',
  },
  {
    id:    'luka',
    title: 'כינויים ללוקה',
    desc:  'נחשי את הכינוי של לוקה מהתמונה',
    emoji: '🐾',
    path:  '/luka',
    color: 'text-peach-400',
    bg:    'from-peach-50 to-amber-50',
  },
]

export default function GameSelect() {
  const navigate  = useNavigate()
  const progress  = useAppStore(s => s.progress)
  const openVideo = useAppStore(s => s.openVideo)

  const handleCardClick = (game: typeof GAMES[0]) => {
    const p = progress[game.id]
    if (p.completed && !p.videoWatched) {
      openVideo(game.id)
    } else {
      navigate(game.path)
    }
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  }
  const item = {
    hidden: { opacity: 0, y: 30 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

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
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="section-title">בחרי משחק 🎮</h1>
            <p className="section-subtitle">
              לאחר כל משחק תופיע הפתעה מיוחדת מהבית 💕
            </p>
          </motion.div>
        </div>

        {/* Game cards */}
        <motion.div
          className="flex-1 px-5 pb-8 grid grid-cols-1 gap-4"
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
                  {/* Completed overlay */}
                  {completed && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="badge-success text-xs">
                        ✓ הושלם
                      </span>
                    </div>
                  )}

                  {!completed && !watched && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="badge-pending text-xs">
                        חדש
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
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
                      <p className="text-gray-500 text-sm line-clamp-2">
                        {game.desc}
                      </p>
                    </div>
                    <div className="text-gray-300 flex-shrink-0">
                      {completed && watched ? '🎬' : '←'}
                    </div>
                  </div>

                  {/* Progress bar if in progress */}
                  {p?.score !== undefined && !completed && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-l from-blush-400 to-lavender-400 rounded-full"
                          style={{ width: `${p.score}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </PageWrapper>
  )
}
