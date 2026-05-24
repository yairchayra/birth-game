import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { getWordleWords } from '@/services/firebase'
import PageWrapper from '@/components/PageWrapper'
import GameReview from '@/components/GameReview'
import StagePicker from '@/components/StagePicker'
import type { WordleWord, LetterState, WordleGuess } from '@/types'

const MAX_GUESSES = 6

const HEBREW_KEYBOARD = [
  ['פ','ם','ן','ו','ט','א','ר','ק'],
  ['ף','ך','ל','ח','י','ע','כ','ג','ד','ש'],
  ['ץ','ת','צ','מ','נ','ה','ב','ס','ז'],
]

function computeGuess(guess: string, answer: string): WordleGuess {
  const letters: WordleGuess['letters'] = []
  const answerArr = answer.split('')
  const used      = new Array(answer.length).fill(false)

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) {
      letters[i] = { char: guess[i], state: 'correct' }
      used[i] = true
    } else {
      letters[i] = { char: guess[i], state: 'absent' }
    }
  }
  for (let i = 0; i < guess.length; i++) {
    if (letters[i].state === 'correct') continue
    const idx = answerArr.findIndex((c, j) => c === guess[i] && !used[j])
    if (idx !== -1) {
      letters[i] = { char: guess[i], state: 'present' }
      used[idx]  = true
    }
  }
  return { letters }
}

const stateColors: Record<LetterState, string> = {
  correct: 'bg-green-400 text-white border-green-400',
  present: 'bg-yellow-400 text-white border-yellow-400',
  absent:  'bg-gray-400  text-white border-gray-400',
  empty:   'bg-white border-gray-200 text-gray-700',
  tbd:     'bg-white border-blush-300 text-gray-700',
}

type Mode = 'pick' | 'play' | 'review'

export default function WordleGame() {
  const navigate          = useNavigate()
  const completeGame      = useAppStore(s => s.completeGame)
  const openVideo         = useAppStore(s => s.openVideo)
  const stageProgressData = useAppStore(s => s.stageProgress['wordle'])
  const markStageComplete = useAppStore(s => s.markStageComplete)

  const [words, setWords]     = useState<WordleWord[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode]       = useState<Mode>('pick')
  const [activeIdx, setActiveIdx] = useState(0)

  // Per-stage play state
  const [guesses, setGuesses]   = useState<WordleGuess[]>([])
  const [current, setCurrent]   = useState('')
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon]           = useState(false)
  const [shake, setShake]       = useState(false)
  const [usedKeys, setUsedKeys] = useState<Record<string, LetterState>>({})

  const answer  = words[activeIdx]?.word ?? ''
  const results = stageProgressData?.results ?? {}

  useEffect(() => {
    getWordleWords().then(w => { setWords(w.slice(0, 10)); setLoading(false) })
  }, [])

  const resetPlay = () => {
    setGuesses([])
    setCurrent('')
    setGameOver(false)
    setWon(false)
    setUsedKeys({})
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

  const submitGuess = useCallback(() => {
    if (current.length !== answer.length) {
      setShake(true); setTimeout(() => setShake(false), 500); return
    }
    const result = computeGuess(current, answer)
    const next   = [...guesses, result]
    setGuesses(next)
    setCurrent('')

    const keys = { ...usedKeys }
    result.letters.forEach(l => {
      const prev = keys[l.char]
      if (!prev || (prev === 'absent' && l.state !== 'absent') || l.state === 'correct')
        keys[l.char] = l.state
    })
    setUsedKeys(keys)

    const correct = result.letters.every(l => l.state === 'correct')
    if (correct) {
      setWon(true)
      setGameOver(true)
      markStageComplete('wordle', activeIdx, {
        stageNum:  activeIdx + 1,
        answer,
        attempts:  next.length - 1,
        hintsUsed: false,
        correct:   true,
      })
    } else if (next.length >= MAX_GUESSES) {
      setGameOver(true)
      markStageComplete('wordle', activeIdx, {
        stageNum:  activeIdx + 1,
        answer,
        attempts:  next.length,
        hintsUsed: false,
        correct:   false,
      })
    }
  }, [current, answer, guesses, usedKeys, activeIdx, markStageComplete])

  const finishReview = () => {
    const stageResults = Object.entries(results)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, r]) => r)
    const score = Math.round((stageResults.filter(r => r.correct).length / stageResults.length) * 100)
    completeGame('wordle', score)
    openVideo('wordle')
  }

  const keyPress = (key: string) => {
    if (gameOver) return
    if (key === 'ENTER') { submitGuess(); return }
    if (key === 'DEL')   { setCurrent(c => c.slice(0, -1)); return }
    if (current.length < answer.length) setCurrent(c => c + key)
  }

  // Build display grid
  const grid = [...guesses]
  if (!gameOver && guesses.length < MAX_GUESSES) {
    const row: WordleGuess['letters'] = []
    for (let i = 0; i < answer.length; i++)
      row.push({ char: current[i] ?? '', state: current[i] ? 'tbd' : 'empty' })
    grid.push({ letters: row })
  }
  while (grid.length < MAX_GUESSES)
    grid.push({ letters: Array.from({ length: answer.length }, () => ({ char: '', state: 'empty' as LetterState })) })

  if (loading) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <motion.div className="text-5xl" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>🔤</motion.div>
    </div>
  )

  // ── Pick mode ──
  if (mode === 'pick') return (
    <PageWrapper>
      <StagePicker
        totalStages={words.length}
        results={results}
        gameName="Wordle"
        gameEmoji="🔤"
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
        gameName="Wordle"
        gameEmoji="🔤"
        onContinue={finishReview}
      />
    )
  }

  // ── Play mode ──
  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-soft flex flex-col">
        <div className="px-5 pt-10 pb-3 flex items-center justify-between">
          <button onClick={goToPicker} className="btn-ghost">→ חזרה</button>
          <h1 className="text-xl font-black text-gradient">Wordle</h1>
          <span className="text-sm text-gray-400">שלב {activeIdx + 1}/{words.length}</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-4 pb-2">
          {/* Stage result notification */}
          <AnimatePresence>
            {gameOver && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card px-5 py-3 mb-2 text-center w-full max-w-xs ${won ? 'bg-green-50' : 'bg-red-50'}`}
              >
                <p className="font-bold text-sm mb-1">{won ? '🎉 כל הכבוד!' : `המילה הייתה: ${answer}`}</p>
                <div className="flex justify-center gap-6 text-center">
                  <div>
                    <div className="font-black text-blush-500 text-lg">{guesses.length}</div>
                    <div className="text-xs text-gray-400">ניסיונות</div>
                  </div>
                  <div>
                    <div className="text-lg">⭐</div>
                    <div className="text-xs text-gray-400">בלי רמז</div>
                  </div>
                </div>
                <button onClick={goToPicker} className="btn-primary mt-3 text-sm w-full">
                  חזרה לבחירת שלבים ←
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid */}
          <div className={shake ? 'animate-shake' : ''}>
            {grid.map((row, ri) => {
              const isSubmitted = ri < guesses.length
              return (
                <div key={ri} className="flex gap-1.5 mb-1.5">
                  {row.letters.map((cell, ci) => (
                    <motion.div
                      key={ci}
                      className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold text-xl border-2 ${stateColors[cell.state]}`}
                      animate={isSubmitted ? { rotateX: [0, -90, 0], transition: { delay: ci * 0.1, duration: 0.4 } } : {}}
                      style={{ perspective: 600 }}
                    >
                      {cell.char}
                    </motion.div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Keyboard */}
        <div className="px-3 pb-6 pt-2">
          {HEBREW_KEYBOARD.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-1 mb-1.5">
              {ri === 2 && <button onClick={() => keyPress('ENTER')} className="key bg-green-100 text-green-700 px-3 text-xs">אישור</button>}
              {row.map(k => (
                <button key={k} onClick={() => keyPress(k)} className={`key text-sm ${
                  usedKeys[k] === 'correct' ? 'bg-green-400 text-white' :
                  usedKeys[k] === 'present' ? 'bg-yellow-400 text-white' :
                  usedKeys[k] === 'absent'  ? 'bg-gray-300 text-gray-500' :
                  'bg-blush-50 text-gray-700'
                }`}>{k}</button>
              ))}
              {ri === 2 && <button onClick={() => keyPress('DEL')} className="key bg-red-50 text-red-400 px-3 text-xs">מחק</button>}
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}
