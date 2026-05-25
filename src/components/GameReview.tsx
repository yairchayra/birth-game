import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { StageResult } from '@/types'

interface Props {
  results:    StageResult[]
  gameName:   string
  gameEmoji:  string
  onContinue: () => void
}

export default function GameReview({ results, gameName, gameEmoji, onContinue }: Props) {
  const navigate = useNavigate()
  const [idx, setIdx] = useState(0)
  const r = results[idx]

  const correctCount  = results.filter(r => r.correct).length
  const noHintCount   = results.filter(r => !r.hintsUsed && r.correct).length
  const firstTryCount = results.filter(r => r.attempts === 0 && r.correct).length

  const totalGuesses  = r.correct ? r.attempts + 1 : r.attempts

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-40 bg-gradient-soft flex flex-col overflow-y-auto relative"
    >
      {/* Header */}
      <div className="px-5 pt-10 pb-4 text-center">
        <button
          onClick={() => navigate('/games')}
          className="absolute top-10 right-5 btn-ghost text-sm"
        >
          → משחקים
        </button>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="text-5xl mb-2"
        >
          {gameEmoji}
        </motion.div>
        <h1 className="text-2xl font-black text-gradient mb-1">סיכום — {gameName}</h1>

        {/* Mini stats */}
        <div className="flex justify-center gap-4 mt-3">
          <div className="card px-4 py-2 text-center">
            <div className="text-xl font-black text-green-500">{correctCount}/{results.length}</div>
            <div className="text-xs text-gray-400">נכונות</div>
          </div>
          <div className="card px-4 py-2 text-center">
            <div className="text-xl font-black text-yellow-500">{firstTryCount}</div>
            <div className="text-xs text-gray-400">ניסיון ראשון</div>
          </div>
          <div className="card px-4 py-2 text-center">
            <div className="text-xl font-black text-blush-400">{noHintCount}</div>
            <div className="text-xs text-gray-400">בלי רמז ⭐</div>
          </div>
        </div>
      </div>

      {/* Stage dots */}
      <div className="flex justify-center gap-1.5 mb-4 flex-wrap px-5">
        {results.map((res, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`w-7 h-7 rounded-full text-xs font-bold transition-all duration-200 ${
              i === idx
                ? 'bg-blush-400 text-white scale-110 shadow-medium'
                : res.correct
                  ? 'bg-green-100 text-green-600 border border-green-200'
                  : 'bg-red-100 text-red-400 border border-red-200'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Stage detail card */}
      <div className="flex-1 px-5 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="card p-6"
          >
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-2 font-medium">שלב {r.stageNum}</p>

              <div className="text-4xl mb-2">
                {r.correct ? '✅' : '❌'}
              </div>

              <h2 className="text-2xl font-black text-gray-700 mb-1">{r.answer}</h2>
              {r.detail && (
                <p className="text-sm text-gray-400 mb-4">{r.detail}</p>
              )}

              {/* Attempt + hint stats */}
              <div className="flex gap-6 justify-center mt-5 pt-4 border-t border-blush-100">
                <div className="text-center">
                  <div className={`text-3xl font-black ${
                    totalGuesses === 1 ? 'text-green-500' :
                    totalGuesses <= 3  ? 'text-blush-400' : 'text-gray-500'
                  }`}>
                    {r.correct ? totalGuesses : '—'}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {r.correct
                      ? totalGuesses === 1 ? 'ניסיון ראשון! 🌟' : `ניסיונות`
                      : 'ויתרת'}
                  </div>
                </div>

                <div className="w-px bg-blush-100" />

                <div className="text-center">
                  <div className="text-3xl">{r.hintsUsed ? '💡' : '⭐'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {r.hintsUsed ? 'עם רמז' : 'בלי רמז!'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next navigation */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setIdx(i => Math.max(0, i - 1))}
            disabled={idx === 0}
            className={`btn-secondary flex-1 ${idx === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            → הקודם
          </button>
          <button
            onClick={() => setIdx(i => Math.min(results.length - 1, i + 1))}
            disabled={idx === results.length - 1}
            className={`btn-secondary flex-1 ${idx === results.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            הבא ←
          </button>
        </div>
      </div>

      {/* Continue button */}
      <div className="px-5 pb-8 pt-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onContinue}
          className="btn-primary w-full text-center"
        >
          המשך לסרטון מיוחד 🎬
        </motion.button>
      </div>
    </motion.div>
  )
}
