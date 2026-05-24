import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { getWhoAmICards } from '@/services/firebase'
import PageWrapper from '@/components/PageWrapper'
import type { WhoAmICard } from '@/types'

const MAX_HINTS = 7 // pixel levels

function PixelatedImage({ src, level }: { src: string; level: number }) {
  // Level 0 = fully pixelated, level 7 = clear
  const blur = Math.max(0, (MAX_HINTS - level) * 3)
  return (
    <div className="relative w-full aspect-square rounded-3xl overflow-hidden">
      <img
        src={src}
        alt="מי אני?"
        className="w-full h-full object-cover transition-all duration-700"
        style={{ filter: `blur(${blur}px) brightness(0.95)`, transform: 'scale(1.1)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-blush-500">
        רמת בהירות: {level}/{MAX_HINTS}
      </div>
    </div>
  )
}

export default function WhoAmIGame() {
  const navigate     = useNavigate()
  const completeGame = useAppStore(s => s.completeGame)
  const openVideo    = useAppStore(s => s.openVideo)

  const [cards, setCards]     = useState<WhoAmICard[]>([])
  const [idx, setIdx]         = useState(0)
  const [level, setLevel]     = useState(0)
  const [guess, setGuess]     = useState('')
  const [result, setResult]   = useState<'correct' | 'wrong' | null>(null)
  const [score, setScore]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [done, setDone]       = useState(false)

  const card = cards[idx]

  useEffect(() => {
    getWhoAmICards().then(c => {
      setCards(c.slice(0, 10))
      setLoading(false)
    })
  }, [])

  const revealMore = () => setLevel(l => Math.min(l + 1, MAX_HINTS))

  const submit = () => {
    if (!guess.trim()) return
    const correct = guess.trim().toLowerCase() === card.answer.trim().toLowerCase()
    setResult(correct ? 'correct' : 'wrong')
    if (correct) setScore(s => s + Math.max(1, MAX_HINTS - level + 1))
  }

  const nextCard = () => {
    if (idx + 1 >= cards.length) {
      setDone(true)
      completeGame('who-am-i', Math.round((score / (cards.length * 7)) * 100))
      setTimeout(() => openVideo('who-am-i'), 600)
      return
    }
    setIdx(i => i + 1)
    setLevel(0)
    setGuess('')
    setResult(null)
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <motion.div className="text-5xl" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }}>🔍</motion.div>
    </div>
  )
  if (!card) return null

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-soft flex flex-col">
        <div className="px-5 pt-10 pb-3 flex items-center justify-between">
          <button onClick={() => navigate('/games')} className="btn-ghost">→ חזרה</button>
          <h1 className="text-xl font-black text-gradient">מי אני?</h1>
          <span className="text-sm text-gray-400">{idx + 1}/{cards.length}</span>
        </div>

        <div className="px-5 mb-4">
          <div className="h-1.5 bg-blush-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-l from-blush-400 to-lavender-400 rounded-full"
              animate={{ width: `${(idx / cards.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 px-5 pb-8 flex flex-col gap-4">
          <PixelatedImage src={card.imageUrl} level={level} />

          {/* Hints shown so far */}
          {level > 0 && card.hints.slice(0, level - 1).map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-3 text-sm text-gray-600"
            >
              💡 {h}
            </motion.div>
          ))}

          <AnimatePresence>
            {result === 'correct' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                className="card p-4 bg-green-50 text-center"
              >
                <div className="text-3xl mb-1">🎉</div>
                <p className="font-bold text-green-700">כל הכבוד! זיהית נכון!</p>
                <p className="text-sm text-gray-500 mt-1">התשובה: {card.answer}</p>
              </motion.div>
            )}
            {result === 'wrong' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                className="card p-4 bg-red-50 text-center"
              >
                <div className="text-3xl mb-1">😅</div>
                <p className="font-bold text-red-500">לא הפעם!</p>
                <p className="text-sm text-gray-500 mt-1">
                  {level < MAX_HINTS ? 'נסי עוד רמז?' : `התשובה: ${card.answer}`}
                </p>
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
                placeholder="מי זה?"
                className="input-field text-center text-lg font-semibold"
              />
              <div className="flex gap-3">
                <button onClick={revealMore} disabled={level >= MAX_HINTS} className="btn-secondary flex-1">
                  💡 רמז ({MAX_HINTS - level} נותרו)
                </button>
                <button onClick={submit} className="btn-primary flex-1">
                  נחשי!
                </button>
              </div>
            </div>
          ) : (
            <button onClick={nextCard} className="btn-primary text-center">
              {idx + 1 >= cards.length ? 'סיום! 🏆' : 'הבא →'}
            </button>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
