import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { getWhoAmICards } from '@/services/firebase'
import PageWrapper from '@/components/PageWrapper'
import GameReview from '@/components/GameReview'
import StagePicker from '@/components/StagePicker'
import type { WhoAmICard } from '@/types'

// ─── CSS Pixelation ───────────────────────────────────────────────────────────
const RESOLUTIONS = [16, 24, 36, 52, 75, 110, 170, 9999]

function PixelatedImage({ src, level }: { src: string; level: number }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [containerPx, setContainerPx] = useState(350)

  useEffect(() => {
    if (wrapRef.current) setContainerPx(wrapRef.current.offsetWidth || 350)
  }, [])

  const targetRes   = Math.min(RESOLUTIONS[Math.min(level, 7)], containerPx)
  const scale       = containerPx / targetRes
  const isPixelated = targetRes < containerPx

  return (
    <div
      ref={wrapRef}
      className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-strong bg-blush-50"
    >
      {containerPx > 0 && (
        <img
          src={src}
          alt="מי אני?"
          style={{
            position:       'absolute',
            top:            0,
            left:           0,
            width:          targetRes,
            height:         targetRes,
            objectFit:      'cover',
            imageRendering: isPixelated ? 'pixelated' : 'auto',
            transformOrigin:'0 0',
            transform:      `scale(${scale})`,
          }}
        />
      )}
      <div className="absolute bottom-3 right-3 z-10 bg-white/85 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-blush-500 shadow-soft">
        בהירות {level}/7
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const MAX_REVEAL = 7
const MAX_HINTS  = 3

type Mode = 'pick' | 'play' | 'review'

export default function WhoAmIGame() {
  const navigate          = useNavigate()
  const completeGame      = useAppStore(s => s.completeGame)
  const openVideo         = useAppStore(s => s.openVideo)
  const stageProgressData = useAppStore(s => s.stageProgress['who-am-i'])
  const markStageComplete = useAppStore(s => s.markStageComplete)

  const [cards, setCards]     = useState<WhoAmICard[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode]       = useState<Mode>('pick')
  const [activeIdx, setActiveIdx] = useState(0)

  // Per-stage play state
  const [revealLevel, setRevealLevel] = useState(0)
  const [textHints, setTextHints]     = useState(0)
  const [attempts, setAttempts]       = useState(0)
  const [guess, setGuess]             = useState('')
  const [result, setResult]           = useState<'correct' | 'gave-up' | null>(null)
  const [wrongFlash, setWrongFlash]   = useState(false)

  const card    = cards[activeIdx]
  const results = stageProgressData?.results ?? {}

  useEffect(() => {
    getWhoAmICards().then(c => { setCards(c.slice(0, 10)); setLoading(false) })
  }, [])

  const resetPlay = (card?: WhoAmICard) => {
    setRevealLevel(card?.initialPixelLevel ?? 0)
    setTextHints(0)
    setAttempts(0)
    setGuess('')
    setResult(null)
  }

  const selectStage = (idx: number) => {
    setActiveIdx(idx)
    resetPlay(cards[idx])
    setMode('play')
  }

  const goToPicker = () => {
    resetPlay()
    setMode('pick')
  }

  const goToReview = () => setMode('review')

  const submit = () => {
    if (!guess.trim() || result) return
    const correct = guess.trim().toLowerCase() === card.answer.trim().toLowerCase()
    if (correct) {
      const hintsUsed = textHints > 0 || revealLevel > (card.initialPixelLevel ?? 0)
      markStageComplete('who-am-i', activeIdx, {
        stageNum:  activeIdx + 1,
        answer:    card.answer,
        attempts,
        hintsUsed,
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
    const hintsUsed = textHints > 0 || revealLevel > (card.initialPixelLevel ?? 0)
    markStageComplete('who-am-i', activeIdx, {
      stageNum:  activeIdx + 1,
      answer:    card.answer,
      attempts,
      hintsUsed,
      correct:   false,
    })
    setResult('gave-up')
  }

  const finishReview = () => {
    const stageResults = Object.entries(results)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, r]) => r)
    const score = Math.round((stageResults.filter(r => r.correct).length / stageResults.length) * 100)
    completeGame('who-am-i', score)
    openVideo('who-am-i')
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <motion.div className="text-5xl" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }}>🔍</motion.div>
    </div>
  )

  // ── Pick mode ──
  if (mode === 'pick') return (
    <PageWrapper>
      <StagePicker
        totalStages={cards.length}
        results={results}
        gameName="מי אני?"
        gameEmoji="🔍"
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
        gameName="מי אני?"
        gameEmoji="🔍"
        onContinue={finishReview}
      />
    )
  }

  // ── Play mode ──
  if (!card) return null
  const hintsUsedSoFar = textHints > 0 || revealLevel > (card.initialPixelLevel ?? 0)

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-soft flex flex-col">
        {/* Header */}
        <div className="px-5 pt-10 pb-3 flex items-center justify-between">
          <button onClick={goToPicker} className="btn-ghost">→ חזרה</button>
          <h1 className="text-xl font-black text-gradient">מי אני?</h1>
          <span className="text-sm text-gray-400">שלב {activeIdx + 1}/{cards.length}</span>
        </div>

        <div className="flex-1 px-5 pb-8 flex flex-col gap-4">
          {/* Pixelated image */}
          <motion.div key={`img-${activeIdx}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <PixelatedImage src={card.imageUrl} level={revealLevel} />
          </motion.div>

          {/* Action buttons */}
          {!result && (
            <div className="flex gap-3">
              <button
                onClick={() => setRevealLevel(l => Math.min(l + 1, MAX_REVEAL))}
                disabled={revealLevel >= MAX_REVEAL}
                className={`btn-secondary flex-1 text-sm ${revealLevel >= MAX_REVEAL ? 'opacity-40' : ''}`}
              >
                🔓 חשוף יותר
                <span className="text-xs mr-1 opacity-60">({MAX_REVEAL - revealLevel})</span>
              </button>
              <button
                onClick={() => setTextHints(h => Math.min(h + 1, Math.min(card.hints.length, MAX_HINTS)))}
                disabled={textHints >= card.hints.length || textHints >= MAX_HINTS}
                className={`btn-secondary flex-1 text-sm ${(textHints >= card.hints.length || textHints >= MAX_HINTS) ? 'opacity-40' : ''}`}
              >
                💡 רמז
                <span className="text-xs mr-1 opacity-60">({Math.max(0, Math.min(card.hints.length, MAX_HINTS) - textHints)})</span>
              </button>
            </div>
          )}

          {/* Text hints */}
          <AnimatePresence>
            {card.hints.slice(0, textHints).map((h, i) => (
              <motion.div key={`hint-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-3 flex items-center gap-2 text-sm text-gray-600">
                <span className="text-base">💡</span>
                <span>{h}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Wrong flash */}
          <AnimatePresence>
            {wrongFlash && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card p-3 bg-red-50 border border-red-100 text-center">
                <p className="text-red-500 font-semibold text-sm">❌ לא נכון — נסי שוב! (ניסיון {attempts + 1})</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stage result */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`card p-5 text-center ${result === 'correct' ? 'bg-green-50' : 'bg-gray-50'}`}>
                <div className="text-3xl mb-2">{result === 'correct' ? '🎉' : '😅'}</div>
                <h3 className={`text-lg font-black mb-1 ${result === 'correct' ? 'text-green-700' : 'text-gray-600'}`}>
                  {result === 'correct' ? 'כל הכבוד!' : `התשובה: ${card.answer}`}
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

          {/* Input + controls */}
          {!result && (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={guess}
                onChange={e => setGuess(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="מי זה?"
                className="input-field text-center text-lg font-semibold"
                autoComplete="off"
              />
              <div className="flex gap-3">
                {attempts >= 2 && (
                  <button onClick={giveUp} className="btn-ghost flex-1 text-sm text-gray-400">
                    😮‍💨 ויתרתי
                  </button>
                )}
                <button onClick={submit} className="btn-primary flex-1">
                  נחשי! 🔍
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
