import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import PageWrapper from '@/components/PageWrapper'

const encouragements = [
  'את חזקה, מדהימה ואהובה 💕',
  'כל נשימה מקרבת אותנו יותר 🌸',
  'אני כאן איתך בכל רגע 💑',
  'את עושה את הדבר הכי יפה בעולם ✨',
]

export default function Home() {
  const navigate       = useNavigate()
  const progress       = useAppStore(s => s.progress)
  const allDone        = useAppStore(s => s.allGamesCompleted)()
  const completed      = Object.values(progress).filter(p => p.completed).length
  const total          = 4
  const pct            = Math.round((completed / total) * 100)
  const encouragement  = encouragements[completed % encouragements.length]

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-soft flex flex-col">
        {/* Top decoration */}
        <div className="relative overflow-hidden pt-safe-top">
          <motion.div
            className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-blush-100/60 blur-2xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <div className="relative z-10 px-5 pt-12 pb-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-6xl mb-3"
            >
              🌸
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-black text-gradient mb-1"
            >
              Birth Games
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-gray-500 text-sm font-medium"
            >
              {encouragement}
            </motion.p>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 px-5 pb-8 flex flex-col gap-5">
          {/* Progress card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-600">
                התקדמות כללית
              </span>
              <span className="text-sm font-bold text-blush-500">
                {completed}/{total} משחקים
              </span>
            </div>
            <div className="relative h-3 bg-blush-100 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 right-0 bg-gradient-to-l from-blush-400 to-lavender-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
              />
            </div>
            {completed > 0 && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                {pct}% הושלם — כל הכבוד! 🎉
              </p>
            )}
          </motion.div>

          {/* Main CTA */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(allDone ? '/finale' : '/games')}
            className="card p-8 text-center cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blush-50 to-lavender-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <motion.div
                className="text-5xl mb-4"
                animate={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                {allDone ? '🏆' : '🎮'}
              </motion.div>
              <h2 className="text-2xl font-black text-gray-700 mb-2">
                {allDone ? 'לחגיגת הסיום!' : 'כניסה למשחקים'}
              </h2>
              <p className="text-gray-400 text-sm mb-5">
                {allDone
                  ? 'כל המשחקים הושלמו — יש הפתעה מיוחדת!'
                  : 'בחרי משחק ותתחילי להנות 🌈'}
              </p>
              <div className="btn-primary inline-block">
                {allDone ? 'לסיום המיוחד ✨' : 'בואי נשחק! →'}
              </div>
            </div>
          </motion.button>

          {/* Quick stats */}
          {completed > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="card p-4 text-center">
                <div className="text-2xl font-black text-blush-500">{completed}</div>
                <div className="text-xs text-gray-400 mt-1">משחקים הושלמו</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-black text-lavender-400">{total - completed}</div>
                <div className="text-xs text-gray-400 mt-1">משחקים נותרו</div>
              </div>
            </motion.div>
          )}

          {/* Admin link */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={() => navigate('/admin')}
            className="text-center text-xs text-gray-300 mt-2 py-2"
          >
            ⚙️ כניסת אדמין
          </motion.button>
        </div>
      </div>
    </PageWrapper>
  )
}
