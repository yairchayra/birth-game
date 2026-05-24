import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { getSongs } from '@/services/firebase'
import PageWrapper from '@/components/PageWrapper'
import GameReview from '@/components/GameReview'
import StagePicker from '@/components/StagePicker'
import type { Song } from '@/types'

type HintLevel = 0 | 1 | 2 | 3
type Mode      = 'pick' | 'play' | 'review'

export default function SongsGame() {
  const navigate          = useNavigate()
  const completeGame      = useAppStore(s => s.completeGame)
  const openVideo         = useAppStore(s => s.openVideo)
  const stageProgressData = useAppStore(s => s.stageProgress['songs'])
  const markStageComplete = useAppStore(s => s.markStageComplete)

  const [songs, setSongs]     = useState<Song[]>([])
  const [loading, setLoad]    = useState(true)
  const [mode, setMode]       = useState<Mode>('pick')
  const [activeIdx, setActiveIdx] = useState(0)

  // Per-stage play state
  const [hint, setHint]             = useState<HintLevel>(0)
  const [revealedLines, setLines]   = useState(1)
  const [guess, setGuess]           = useState('')
  const [result, setResult]         = useState<'correct' | 'gave-up' | null>(null)
  const [attempts, setAttempts]     = useState(0)
  const [wrongFlash, setWrongFlash] = useState(false)

  const song    = songs[activeIdx]
  const results = stageProgressData?.results ?? {}

  useEffect(() => {
    getSongs().then(s => { setSongs(s.slice(0, 10)); setLoad(false) })
  }, [])

  const getLines = (s: Song): string[] =>
    s.lyricLines?.length ? s.lyricLines : s.lyricClue ? [s.lyricClue] : []

  const resetPlay = () => {
    setHint(0); setLines(1); setGuess(''); setResult(null); setAttempts(0)
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
    const correct = guess.trim().toLowerCase() === song.title.trim().toLowerCase()
    if (correct) {
      const hintsUsed = hint > 0 || revealedLines > 1
      markStageComplete('songs', activeIdx, {
        stageNum:  activeIdx + 1,
        answer:    song.title,
        attempts,
        hintsUsed,
        correct:   true,
        detail:    song.artist,
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
    const hintsUsed = hint > 0 || revealedLines > 1
    markStageComplete('songs', activeIdx, {
      stageNum:  activeIdx + 1,
      answer:    song.title,
      attempts,
      hintsUsed,
      correct:   false,
      detail:    song.artist,
    })
    setResult('gave-up')
  }

  const finishReview = () => {
    const stageResults = Object.entries(results)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, r]) => r)
    const score = Math.round((stageResults.filter(r => r.correct).length / stageResults.length) * 100)
    completeGame('songs', score)
    openVideo('songs')
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <motion.div className="text-5xl" animate={{ rotate: [0,15,-15,0] }} transition={{ repeat: Infinity, duration: 0.8 }}>🎵</motion.div>
    </div>
  )

  // ── Pick mode ──
  if (mode === 'pick') return (
    <PageWrapper>
      <StagePicker
        totalStages={songs.length}
        results={results}
        gameName="זהי את השיר"
        gameEmoji="🎵"
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
        gameName="זהי את השיר"
        gameEmoji="🎵"
        onContinue={finishReview}
      />
    )
  }

  // ── Play mode ──
  if (!song) return null
  const lines          = getLines(song)
  const visibleLines   = lines.slice(0, revealedLines)
  const canRevealMore  = revealedLines < lines.length
  const hintsUsedSoFar = hint > 0 || revealedLines > 1

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-soft flex flex-col">
        <div className="px-5 pt-10 pb-3 flex items-center justify-between">
          <button onClick={goToPicker} className="btn-ghost">→ חזרה</button>
          <h1 className="text-xl font-black text-gradient">זהי את השיר</h1>
          <span className="text-sm text-gray-400">שלב {activeIdx + 1}/{songs.length}</span>
        </div>

        <div className="flex-1 px-5 pb-8 flex flex-col gap-4">
          {/* Lyric card */}
          <motion.div key={activeIdx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-lavender-50 to-blush-50 opacity-60" />
            <div className="relative z-10">
              <div className="text-4xl mb-3">🎵</div>
              <p className="text-xs text-gray-400 mb-3 font-medium">שורות: {revealedLines}/{lines.length || 1}</p>
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {visibleLines.map((line, i) => (
                    <motion.blockquote key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`font-bold leading-relaxed ${i === 0 ? 'text-xl text-gray-700' : 'text-lg text-gray-500'}`}>
                      "{line}"
                    </motion.blockquote>
                  ))}
                </AnimatePresence>
              </div>
              {canRevealMore && !result && (
                <button onClick={() => setLines(l => l + 1)} className="mt-4 text-sm text-lavender-500 font-semibold flex items-center gap-1 mx-auto hover:text-lavender-600 transition-colors">
                  ↓ שורה נוספת ({lines.length - revealedLines} נותרו)
                </button>
              )}
            </div>
          </motion.div>

          {/* Hint panels */}
          <AnimatePresence>
            {hint >= 1 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-4 flex items-center gap-3">
                <span className="text-2xl">🎤</span>
                <div><p className="text-xs text-gray-400">אמן</p><p className="font-bold text-gray-700">{song.artist}</p></div>
              </motion.div>
            )}
            {hint >= 2 && song.coverUrl && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-3 flex items-center gap-3">
                <img src={song.coverUrl} alt="עטיפה" className="w-16 h-16 rounded-xl object-cover" />
                <div><p className="text-xs text-gray-400">עטיפת האלבום</p></div>
              </motion.div>
            )}
            {hint >= 3 && song.spotifyUrl && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-3">
                <a href={song.spotifyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-green-600 font-semibold">
                  <span className="text-2xl">🎧</span>האזיני בספוטיפיי
                </a>
              </motion.div>
            )}
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
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`card p-5 text-center ${result === 'correct' ? 'bg-green-50' : 'bg-gray-50'}`}>
                <div className="text-3xl mb-2">{result === 'correct' ? '🎉' : '😅'}</div>
                <h3 className={`text-lg font-black mb-0.5 ${result === 'correct' ? 'text-green-700' : 'text-gray-600'}`}>
                  {result === 'correct' ? 'מדהים!' : `התשובה: ${song.title}`}
                </h3>
                {result === 'gave-up' && <p className="text-sm text-gray-400 mb-2">{song.artist}</p>}
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
              <input type="text" value={guess} onChange={e => setGuess(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="שם השיר..." className="input-field text-center text-lg" autoComplete="off" />
              <div className="flex gap-3">
                <button onClick={() => setHint(h => Math.min(3, h + 1) as HintLevel)} disabled={hint >= 3} className={`btn-secondary flex-1 text-sm ${hint >= 3 ? 'opacity-40' : ''}`}>
                  💡 רמז {hint > 0 ? `(${3 - hint} נותרו)` : ''}
                </button>
                <button onClick={submit} className="btn-primary flex-1">נחשי! 🎵</button>
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
