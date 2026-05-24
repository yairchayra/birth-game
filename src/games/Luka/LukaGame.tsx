import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { getLukaNicknames } from '@/services/firebase'
import PageWrapper from '@/components/PageWrapper'
import type { LukaNickname } from '@/types'

export default function LukaGame() {
  const navigate     = useNavigate()
  const completeGame = useAppStore(s => s.completeGame)
  const openVideo    = useAppStore(s => s.openVideo)

  const [cards, setCards]     = useState<LukaNickname[]>([])
  const [idx, setIdx]         = useState(0)
  const [hintIdx, setHintIdx] = useState(0)
  const [guess, setGuess]     = useState('')
  const [result, setResult]   = useState<'correct' | 'wrong' | null>(null)
  const [score, setScore]     = useState(0)
  const [loading, setLoad]    = useState(true)

  const card = cards[idx]

  useEffect(() => {
    getLukaNicknames().then(c => { setCards(c.slice(0, 10)); setLoad(false) })
  }, [])

  const submit = () => {
    if (!guess.trim()) return
    const correct = guess.trim().toLowerCase() === card.nickname.trim().toLowerCase()
    setResult(correct ? 'correct' : 'wrong')
    if (correct) setScore(s => s + Math.max(1, 3 - hintIdx))
  }

  const next = () => {
    if (idx + 1 >= cards.length) {
      completeGame('luka', Math.round((score / (cards.length * 3)) * 100))
      setTimeout(() => openVideo('luka'), 600)
      return
    }
    setIdx(i => i + 1)
    setHintIdx(0)
    setGuess('')
    setResult(null)
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <motion.div
        className="text-6xl"
        animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
      >🐾</motion.div>
    </div>
  )
  if (!card) return null

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-soft flex flex-col">
        <div className="px-5 pt-10 pb-3 flex items-center justify-between">
          <button onClick={() => navigate('/games')} className="btn-ghost">→ חזרה</button>
          <h1 className="text-xl font-black text-gradient">כינויים ללוקה</h1>
          <span className="text-sm text-gray-400">{idx + 1}/{cards.length}</span>
        </div>

        <div className="px-5 mb-4">
          <div className="h-1.5 bg-peach-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-l from-peach-300 to-blush-400 rounded-full"
              animate={{ width: `${(idx / cards.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 px-5 pb-8 flex flex-col gap-4">
          {/* Image */}
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-strong"
          >
            <img
              src={card.imageUrl}
              alt="כינוי ללוקה"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-4 right-4 left-4 text-center">
              <p className="text-white/80 text-sm font-medium">
                מה הכינוי של לוקה?
              </p>
            </div>
          </motion.div>

          {/* Hints */}
          <AnimatePresence>
            {card.hints.slice(0, hintIdx).map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-3 flex items-center gap-3"
              >
                <span className="text-xl">💡</span>
                <p className="text-sm text-gray-600">{h}</p>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {result === 'correct' && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="card p-5 bg-peach-50 text-center">
                <div className="text-4xl mb-2">🐶💕</div>
                <p className="font-black text-peach-400 text-lg">מדהים!</p>
                <p className="text-gray-600 mt-1">הכינוי הוא: <strong>{card.nickname}</strong></p>
              </motion.div>
            )}
            {result === 'wrong' && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="card p-4 bg-red-50 text-center">
                <div className="text-3xl mb-1">😅</div>
                <p className="font-bold text-red-400">לא מדויק!</p>
                {hintIdx >= card.hints.length && (
                  <p className="text-sm text-gray-500 mt-1">התשובה: {card.nickname}</p>
                )}
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
                placeholder="הכינוי של לוקה..."
                className="input-field text-center text-lg font-semibold"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setHintIdx(h => Math.min(card.hints.length, h + 1))}
                  disabled={hintIdx >= card.hints.length}
                  className="btn-secondary flex-1 text-sm"
                >
                  🐾 רמז
                </button>
                <button onClick={submit} className="btn-primary flex-1">נחשי!</button>
              </div>
            </div>
          ) : (
            <button onClick={next} className="btn-primary text-center">
              {idx + 1 >= cards.length ? '🏆 סיום!' : 'הבא →'}
            </button>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
