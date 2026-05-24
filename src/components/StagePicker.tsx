import { motion } from 'framer-motion'
import type { StageResult } from '@/types'

interface Props {
  totalStages: number
  results:     Record<number, StageResult>  // 0-based idx → result
  gameName:    string
  gameEmoji:   string
  onSelect:    (idx: number) => void
  onReview:    () => void
  onBack:      () => void
}

export default function StagePicker({
  totalStages,
  results,
  gameName,
  gameEmoji,
  onSelect,
  onReview,
  onBack,
}: Props) {
  const completedCount = Object.keys(results).length
  const allDone        = completedCount >= totalStages

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-soft flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-10 pb-3 flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost">→ חזרה</button>
        <h1 className="text-xl font-black text-gradient">{gameName}</h1>
        <span className="text-sm text-gray-400">{completedCount}/{totalStages}</span>
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-6">
        <div className="h-1.5 bg-blush-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-l from-blush-400 to-lavender-400 rounded-full"
            animate={{ width: `${totalStages > 0 ? (completedCount / totalStages) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Emoji + subtitle */}
      <div className="text-center mb-6 px-5">
        <div className="text-5xl mb-2">{gameEmoji}</div>
        <p className="text-sm text-gray-400">בחרי שלב לשחק</p>
        {completedCount > 0 && !allDone && (
          <p className="text-xs text-gray-300 mt-1">{totalStages - completedCount} שלבים נותרו</p>
        )}
      </div>

      {/* Stage grid */}
      <div className="flex-1 px-5 pb-4">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: totalStages }, (_, i) => {
            const res = results[i]
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSelect(i)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-bold shadow-soft transition-colors ${
                  res
                    ? res.correct
                      ? 'bg-green-50 border-2 border-green-300 text-green-700'
                      : 'bg-red-50 border-2 border-red-200 text-red-400'
                    : 'bg-white border-2 border-blush-100 text-gray-600 hover:border-blush-300'
                }`}
              >
                {res ? (
                  <>
                    <span className="text-xl">{res.correct ? '✅' : '❌'}</span>
                    {res.correct && (
                      <span className="text-xs opacity-60 mt-0.5">
                        {res.attempts + 1}×
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-base font-black">{i + 1}</span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Bottom: review button or hint */}
      <div className="px-5 pb-10 pt-2">
        {allDone ? (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onReview}
            className="btn-primary w-full"
          >
            🏆 לסיכום ולסרטון!
          </motion.button>
        ) : completedCount > 0 ? (
          <p className="text-center text-sm text-gray-300">לחצי על שלב לשחק</p>
        ) : null}
      </div>
    </motion.div>
  )
}
