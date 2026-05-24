import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { getLukaNicknames } from '@/services/firebase'
import PageWrapper from '@/components/PageWrapper'
import GameReview from '@/components/GameReview'
import StagePicker from '@/components/StagePicker'
import type { LukaNickname } from '@/types'

type Mode = 'pick' | 'play' | 'review'

export default function LukaGame() {
  const navigate          = useNavigate()
  const completeGame      = useAppStore(s => s.completeGame)
  const openVideo         = useAppStore(s => s.openVideo)
  const stageProgressData = useAppStore(s => s.stageProgress['luka'])
  const markStageComplete = useAppStore(s => s.markStageComplete)

  const [cards, setCards]     = useState<LukaNickname[]>([])
  const [loading, setLoad]    = useState(true)
  const [mode, setMode]       = useState<Mode>('pick')
  const [activeIdx, setActiveIdx] = useState(0)

  // Per-stage play state
  const [hintIdx, setHintIdx]       = useState(0)
  const [guess, setGuess]           = useState('')
  const [result, setResult]         = useState<'correct' | 'gave-up' | null>(null)
  const [attempts, setAttempts]     = useState(0)
  const [wrongFlash, setWrongFlash] = useState(false)

  const card    = cards[activeIdx]
  const results = stageProgressData?.results ?? {}

  useEffect(() => {
    getLukaNicknames().then(c => { setCards(c.slice(0, 10)); setLoad(false) })
  }, [])

  const resetPlay = () => {
    setHintIdx(0); setGuess(''); setResult(null); setAttempts(0)
  }

  const selectStage = (idx: number) => {
    setActiveIdx(idx)
    resetPlay()
    setMode('play')
  }

  const goToPicker = () => {
    resetPlay()
    setMode('pick')
  }

  const goToReview = () => setMode('review')

  const submit = () => {
    if (!guess.trim() || result) return
    const correct = guess.trim().toLowerCase() === card.nickname.trim().toLowerCase()
    if (correct) {
      markStageComplete('luka', activeIdx, {
        stageNum:  activeIdx + 1,
        answer:    card.nickname,
        attempts,
        hintsUsed: hintIdx > 0,
        correct:   true,
      })
      setResult('correct')
    } else {
      setAttempts(a => a + 1)
      setWrongFlash(true)
      setGuess('')
      setTimeout(() => setWrongFlash(false), 1100)
    }
  }

  const giveUp = () => {
    markStageComplete('luka', activeIdx, {
      stageNum:  activeIdx + 1,
      answer:    card.nickname,
      attempts,
      hintsUsed: hintIdx > 0,
      correct:   false,
    })
    setResult('gave-up')
  }

  const finishReview = () => {
    const stageResults = Object.entries(results)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, r]) => r)
    const score = Math.round((stageResults.filter(r => r.correct).length / stageResults.length) * 100)
    completeGame('luka', score)
    openVideo('luka')
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <motion.div className="text-6xl" animate={{ rotate: [0,-10,10,-10,0], scale: [1,1.1,1] }} transition={{ repeat: Infinity, duration: 1.2 }}>🐾</motion.div>
    </div>
  )

  // ── Pick mode ──
  if (mode === 'pick') return (
    <PageWrapper>
      <StagePicker
        totalStages={cards.length}
        results={results}
        gameName="כינויים ללוקה"
        gameEmoji="🐾"
        onSelect={selectStage}
        onReview={goToReview}
        onBack={() => navigate('/games')}
      />
    </PageWrapper>
  )

  // ── Review mode ──
  if (mode === 'review') {
    const stageResults = Object.entries(results)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, r]) => r)
    return (
      <GameReview
        results={stageResults}
        gameName="כינויים ללוקה"
        gameEmoji="🐾"
        onContinue={finishReview}
      />
    )
  }

  // ── Play mode ──
  if (!card) return null
  const hintsUsedSoFar = hintIdx > 0

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-soft flex flex-col">
        <div className="px-5 pt-10 pb-3 flex items-center justify-between">
          <button onClick={goToPicker} className="btn-ghost">→ חזרה</button>
          <h1 className="text-xl font-black text-gradient">כינויים ללוקה</h1>
          <span className="text-sm text-gray-400">שלב {activeIdx + 1}/{cards.length}</span>
        </div>

        <div className="flex-1 px-5 pb-8 flex flex-col gap-4">
          {/* Image */}
          <motion.div key={activeIdx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-strong">
            <img src={card.imageUrl} alt="כינוי ללוקה" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-4 right-4 left-4 text-center">
              <p className="text-white/80 text-sm font-medium">מה הכינוי של לוקה?</p>
            </div>
          </motion.div>

          {/* Text hints */}
          <AnimatePresence>
            {card.hints.slice(0, hintIdx).map((h, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-3 flex items-center gap-3">
                <span className="text-xl">💡</span>
                <p className="text-sm text-gray-600">{h}</p>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Wrong flash */}
          <AnimatePresence>
            {wrongFlash && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="card p-3 bg-red-50 border border-red-100 text-center">
                <p className="text-red-500 font-semibold text-sm">❌ לא נכון — נסי שוב! (ניסיון {attempts + 1})</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stage result */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`card p-5 text-center ${result === 'correct' ? 'bg-peach-50' : 'bg-gray-50'}`}>
                <div className="text-3xl mb-2">{result === 'correct' ? '🐶💕' : '😅'}</div>
                <h3 className={`text-lg font-black mb-1 ${result === 'correct' ? 'text-peach-400' : 'text-gray-600'}`}>
                  {result === 'correct' ? 'מדהים!' : `הכינוי: ${card.nickname}`}
                </h3>
                <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-2xl font-black text-blush-500">{result === 'correct' ? attempts + 1 : attempts}</div>
                    <div className="text-xs text-gray-400">ניסיונות</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl">{hintsUsedSoFar ? '💡' : '⭐'}</div>
                    <div className="text-xs text-gray-400">{hintsUsedSoFar ? 'עם רמז' : 'בלי רמז!'}</div>
                  </div>
                </div>
                <button onClick={goToPicker} className="btn-primary mt-4 w-full">
                  חזרה לבחירת שלבים ←
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          {!result && (
            <div className="flex flex-col gap-3">
              <input type="text" value={guess} onChange={e => setGuess(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="הכינוי של לוקה..." className="input-field text-center text-lg font-semibold" autoComplete="off" />
              <div className="flex gap-3">
                <button onClick={() => setHintIdx(h => Math.min(card.hints.length, h + 1))} disabled={hintIdx >= card.hints.length} className={`btn-secondary flex-1 text-sm ${hintIdx >= card.hints.length ? 'opacity-40' : ''}`}>
                  🐾 רמז ({Math.max(0, card.hints.length - hintIdx)} נותרו)
                </button>
                <button onClick={submit} className="btn-primary flex-1">נחשי!</button>
              </div>
              {attempts >= 2 && (
                <button onClick={giveUp} className="btn-ghost text-sm text-gray-400 text-center">😮‍💨 ויתרתי</button>
              )}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
