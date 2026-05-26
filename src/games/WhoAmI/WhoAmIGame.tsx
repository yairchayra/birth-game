import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { getWhoAmICards } from '@/services/firebase'
import PageWrapper from '@/components/PageWrapper'
import GameReview from '@/components/GameReview'
import StagePicker from '@/components/StagePicker'
import type { WhoAmICard, WhoAmIStageState } from '@/types'

const BLUR_PX = [40, 28, 18, 12, 7, 3.5, 1, 0]
const MAX_REVEAL = 7
const OVERLAY_THRESHOLD = MAX_REVEAL - 1  // רמה 6 — שלב לפני הסוף

function BlurredImage({ src, level }: { src: string; level: number }) {
  const blur = BLUR_PX[Math.min(level, 7)]
  return (
    <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-strong bg-blush-50">
      <img
        src={src}
        alt="מי אני?"
        className="w-full h-full object-cover"
        style={{
          filter:     blur > 0 ? `blur(${blur}px)` : 'none',
          transition: 'filter 0.5s ease',
          transform:  blur > 0 ? 'scale(1.08)' : 'scale(1)',
        }}
      />
      {level < MAX_REVEAL && (
        <div className="absolute bottom-3 right-3 z-10 bg-white/85 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-blush-500 shadow-soft">
          בהירות {level}/7
        </div>
      )}
    </div>
  )
}

type Mode = 'pick' | 'play' | 'review'

export default function WhoAmIGame() {
  const navigate           = useNavigate()
  const completeGame       = useAppStore(s => s.completeGame)
  const openVideo          = useAppStore(s => s.openVideo)
  const stageProgressData  = useAppStore(s => s.stageProgress['who-am-i'])
  const markStageComplete  = useAppStore(s => s.markStageComplete)
  const savedStageState    = useAppStore(s => s.stageState['who-am-i'])
  const saveStageState     = useAppStore(s => s.saveStageState)
  const resetSingleStage   = useAppStore(s => s.resetSingleStage)

  const [cards, setCards]     = useState<WhoAmICard[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode]       = useState<Mode>('pick')
  const [activeIdx, setActiveIdx] = useState(0)

  const [revealLevel, setRevealLevel]       = useState(0)
  const [textHints, setTextHints]           = useState(0)
  const [attempts, setAttempts]             = useState(0)
  const [guess, setGuess]                   = useState('')
  const [result, setResult]                 = useState<'correct' | 'gave-up' | null>(null)
  const [wrongFlash, setWrongFlash]         = useState(false)
  const [guessHistory, setGuessHistory]     = useState<string[]>([])
  const [showMaxOverlay, setShowMaxOverlay] = useState(false)

  const card    = cards[activeIdx]
  const results = stageProgressData?.results ?? {}

  useEffect(() => {
    getWhoAmICards().then(c => { setCards(c.slice(0, 10)); setLoading(false) })
  }, [])

  const snapshotState = useCallback((
    idx: number,
    rl: number, th: number, att: number,
    res: 'correct' | 'gave-up' | null,
    gh: string[]
  ) => {
    saveStageState('who-am-i', idx, {
      revealLevel: rl, textHints: th, attempts: att, result: res, guessHistory: gh,
    } as WhoAmIStageState)
  }, [saveStageState])

  const loadStageOrReset = (idx: number, cardForIdx: WhoAmICard) => {
    const saved = savedStageState?.[idx] as WhoAmIStageState | undefined
    if (saved) {
      setRevealLevel(saved.revealLevel)
      setTextHints(saved.textHints)
      setAttempts(saved.attempts)
      setResult(saved.result)
      setGuessHistory(saved.guessHistory)
    } else {
      setRevealLevel(cardForIdx?.initialPixelLevel ?? 0)
      setTextHints(0)
      setAttempts(0)
      setResult(null)
      setGuessHistory([])
    }
    setGuess('')
    setShowMaxOverlay(false)
  }

  const selectStage = (idx: number) => {
    snapshotState(activeIdx, revealLevel, textHints, attempts, result, guessHistory)
    setActiveIdx(idx)
    loadStageOrReset(idx, cards[idx])
    setMode('play')
  }

  const goToPicker = () => {
    snapshotState(activeIdx, revealLevel, textHints, attempts, result, guessHistory)
    setMode('pick')
  }

  const goToReview = () => setMode('review')

  const resetStage = () => {
    const initialLevel = card?.initialPixelLevel ?? 0
    setRevealLevel(initialLevel); setTextHints(0); setAttempts(0)
    setResult(null); setGuessHistory([]); setGuess('')
    setShowMaxOverlay(false)
    saveStageState('who-am-i', activeIdx, {
      revealLevel: initialLevel, textHints: 0, attempts: 0, result: null, guessHistory: [],
    })
    resetSingleStage('who-am-i', activeIdx)
  }

  const doAutoFail = (newAttempts: number, newLevel: number, gh: string[]) => {
    const hintsUsed = textHints > 0 || newLevel > (card.initialPixelLevel ?? 0)
    markStageComplete('who-am-i', activeIdx, {
      stageNum: activeIdx + 1, answer: card.answer,
      attempts: newAttempts, hintsUsed, correct: false,
    })
    setResult('gave-up')
    snapshotState(activeIdx, newLevel, textHints, newAttempts, 'gave-up', gh)
  }

  const submit = () => {
    if (!guess.trim() || result) return
    const correct = guess.trim().toLowerCase() === card.answer.trim().toLowerCase()
    if (correct) {
      const hintsUsed = textHints > 0 || revealLevel > (card.initialPixelLevel ?? 0)
      markStageComplete('who-am-i', activeIdx, {
        stageNum: activeIdx + 1, answer: card.answer,
        attempts, hintsUsed, correct: true,
      })
      setResult('correct')
      setShowMaxOverlay(false)
      snapshotState(activeIdx, MAX_REVEAL, textHints, attempts, 'correct', guessHistory)
    } else {
      const newAttempts = attempts + 1
      const newLevel    = Math.min(revealLevel + 1, MAX_REVEAL)
      const newHistory  = [...guessHistory, guess.trim()]
      setAttempts(newAttempts)
      setRevealLevel(newLevel)
      setGuessHistory(newHistory)
      setGuess('')
      if (newLevel >= MAX_REVEAL) {
        doAutoFail(newAttempts, newLevel, newHistory)
      } else {
        // הראי overlay כבר ברמה 6 (שלב לפני הסוף)
        if (newLevel >= OVERLAY_THRESHOLD) {
          setShowMaxOverlay(true)
        } else {
          setWrongFlash(true)
          setTimeout(() => setWrongFlash(false), 1100)
        }
        snapshotState(activeIdx, newLevel, textHints, newAttempts, null, newHistory)
      }
    }
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

  if (mode === 'review') {
    const stageResults = Object.entries(results)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, r]) => r)
    return <GameReview results={stageResults} gameName="מי אני?" gameEmoji="🔍" onContinue={finishReview} />
  }

  if (!card) return null
  const hintsUsedSoFar = textHints > 0 || revealLevel > (card.initialPixelLevel ?? 0)

  // תמונה ברורה לחלוטין אחרי ניחוש נכון
  const imageLevel = result === 'correct' ? MAX_REVEAL : revealLevel

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-soft flex flex-col">
        <div className="px-5 pt-10 pb-2 flex items-center justify-between">
          <button onClick={goToPicker} className="btn-ghost text-sm">→ חזרה</button>
          <h1 className="text-lg font-black text-gradient">מי אני?</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{activeIdx + 1}/{cards.length}</span>
            <button onClick={resetStage} title="איפוס שלב" className="text-gray-300 hover:text-blush-400 transition-colors text-lg leading-none">↺</button>
          </div>
        </div>

        <div className="px-5 pb-3 flex gap-2">
          <button
            onClick={() => selectStage(activeIdx - 1)}
            disabled={activeIdx === 0}
            className={`btn-secondary flex-1 text-xs py-1.5 ${activeIdx === 0 ? 'opacity-30' : ''}`}
          >→ הקודם</button>
          <button
            onClick={() => selectStage(activeIdx + 1)}
            disabled={activeIdx === cards.length - 1}
            className={`btn-secondary flex-1 text-xs py-1.5 ${activeIdx === cards.length - 1 ? 'opacity-30' : ''}`}
          >הבא ←</button>
        </div>

        <div className="flex-1 px-5 pb-8 flex flex-col gap-4">
          {/* תמונה עם overlay אפשרי */}
          <motion.div key={`img-${activeIdx}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative">
            <BlurredImage src={card.imageUrl} level={imageLevel} />

            {/* Overlay "לא נורא" — מופיע ברמה 6 */}
            <AnimatePresence>
              {showMaxOverlay && !result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-3xl z-20 flex flex-col items-center justify-center gap-3"
                  style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
                >
                  <p className="text-white text-xl font-black drop-shadow">לא נורא 😊</p>
                  <p className="text-white/90 text-sm font-medium text-center px-6 leading-snug drop-shadow">
                    נתן לך נסיון חוזר רק היום
                  </p>
                  <button
                    onClick={resetStage}
                    className="mt-1 bg-white text-blush-500 font-black text-2xl w-14 h-14 rounded-full shadow-strong flex items-center justify-center active:scale-90 transition-transform"
                    title="איפוס שלב"
                  >↺</button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {!result && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (revealLevel >= OVERLAY_THRESHOLD) {
                    setShowMaxOverlay(true)
                    return
                  }
                  const newLevel = Math.min(revealLevel + 1, MAX_REVEAL)
                  setRevealLevel(newLevel)
                  snapshotState(activeIdx, newLevel, textHints, attempts, null, guessHistory)
                }}
                className="btn-secondary flex-1 text-sm"
              >
                🔓 חשוף יותר
                {revealLevel < OVERLAY_THRESHOLD && (
                  <span className="text-xs mr-1 opacity-60">({OVERLAY_THRESHOLD - revealLevel})</span>
                )}
              </button>
              <button
                onClick={() => {
                  const newHints = Math.min(textHints + 1, card.hints.length)
                  setTextHints(newHints)
                  snapshotState(activeIdx, revealLevel, newHints, attempts, null, guessHistory)
                }}
                disabled={textHints >= card.hints.length}
                className={`btn-secondary flex-1 text-sm ${textHints >= card.hints.length ? 'opacity-40' : ''}`}
              >
                💡 רמז
                <span className="text-xs mr-1 opacity-60">({Math.max(0, card.hints.length - textHints)})</span>
              </button>
            </div>
          )}

          <AnimatePresence>
            {card.hints.slice(0, textHints).map((h, i) => (
              <motion.div key={`hint-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-3 flex items-center gap-2 text-sm text-gray-600">
                <span>💡</span><span>{h}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* היסטוריית ניחושים */}
          {guessHistory.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {guessHistory.map((g, i) => (
                <span key={i} className="text-xs bg-red-50 border border-red-100 text-red-400 rounded-full px-3 py-1 font-medium">
                  ❌ {g}
                </span>
              ))}
            </div>
          )}

          <AnimatePresence>
            {wrongFlash && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="card p-3 bg-red-50 border border-red-100 text-center">
                <p className="text-red-500 font-semibold text-sm">❌ לא נכון — התמונה התבהרה קצת! (ניסיון {attempts})</p>
              </motion.div>
            )}
          </AnimatePresence>

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
                <button onClick={goToPicker} className="btn-primary mt-4 w-full">חזרה לבחירת שלבים ←</button>
              </motion.div>
            )}
          </AnimatePresence>

          {!result && (
            <div className="flex flex-col gap-3">
              <input
                type="text" value={guess}
                onChange={e => setGuess(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="מי זה?" className="input-field text-center text-lg font-semibold" autoComplete="off"
              />
              <button onClick={submit} className="btn-primary">נחשי! 🔍</button>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
