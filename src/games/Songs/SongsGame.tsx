import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { getSongs } from '@/services/firebase'
import PageWrapper from '@/components/PageWrapper'
import GameReview from '@/components/GameReview'
import StagePicker from '@/components/StagePicker'
import type { Song, SongsStageState } from '@/types'

type Mode = 'pick' | 'play' | 'review'

function spotifyEmbedUrl(url: string): string | null {
  const m = url.match(/track\/([A-Za-z0-9]+)/)
  return m ? `https://open.spotify.com/embed/track/${m[1]}?utm_source=generator&theme=0` : null
}

// ── Fireworks ─────────────────────────────────────────────────────────────────
const SPARKS = Array.from({ length: 22 }, (_, i) => ({
  x:     (i * 41 + 7)  % 100,
  y:     (i * 29 + 13) % 100,
  dy:    -70 - (i * 13) % 80,
  delay: (i * 0.08) % 0.9,
  emoji: ['✨','🎇','⭐','🌟','💫','🎊'][i % 6],
}))

function Fireworks() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {SPARKS.map((s, i) => (
        <motion.div key={i} className="absolute text-xl select-none"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
          initial={{ scale: 0, opacity: 0, y: 0 }}
          animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0], y: s.dy }}
          transition={{ delay: s.delay, duration: 1.4, ease: 'easeOut' }}>
          {s.emoji}
        </motion.div>
      ))}
    </div>
  )
}

// ── Original lines reveal ─────────────────────────────────────────────────────
function OriginalLinesReveal({ song }: { song: Song }) {
  const hasOriginals = song.originalLines?.some(l => l?.trim())
  if (!hasOriginals) return null

  const pairs = [0, 1, 2, 3].filter(
    i => song.lyricLines?.[i]?.trim() || song.originalLines?.[i]?.trim()
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card p-3"
    >
      <p className="text-xs text-center text-gray-400 font-semibold mb-2 tracking-wide uppercase">
        🎵 המילים המלאות
      </p>
      <div className="flex flex-col gap-1.5">
        {pairs.map((i, idx) => (
          <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + idx * 0.15 }} className="flex flex-col gap-0">
            {song.lyricLines?.[i]?.trim() && (
              <p className="font-bold text-gray-700 text-sm leading-snug">{song.lyricLines[i]}</p>
            )}
            {song.originalLines?.[i]?.trim() && (
              <p className="text-gray-400 italic text-xs leading-snug">{song.originalLines![i]}</p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SongsGame() {
  const navigate          = useNavigate()
  const completeGame      = useAppStore(s => s.completeGame)
  const openVideo         = useAppStore(s => s.openVideo)
  const stageProgressData = useAppStore(s => s.stageProgress['songs'])
  const markStageComplete = useAppStore(s => s.markStageComplete)
  const savedStageState   = useAppStore(s => s.stageState['songs'])
  const saveStageState    = useAppStore(s => s.saveStageState)
  const resetSingleStage  = useAppStore(s => s.resetSingleStage)

  const [songs, setSongs]     = useState<Song[]>([])
  const [loading, setLoad]    = useState(true)
  const [mode, setMode]       = useState<Mode>('pick')
  const [activeIdx, setActiveIdx] = useState(0)

  const [revealedLines, setLines]   = useState(1)
  const [hint, setHint]             = useState(0)
  const [guess, setGuess]           = useState('')
  const [result, setResult]         = useState<'correct' | 'gave-up' | null>(null)
  const [attempts, setAttempts]     = useState(0)
  const [wrongFlash, setWrongFlash] = useState(false)
  const [guessHistory, setGuessHistory] = useState<string[]>([])
  const [showFireworks, setShowFireworks] = useState(false)

  const song    = songs[activeIdx]
  const results = stageProgressData?.results ?? {}

  useEffect(() => {
    getSongs().then(s => { setSongs(s.slice(0, 10)); setLoad(false) })
  }, [])

  const getLines = (s: Song): string[] =>
    s.lyricLines?.length ? s.lyricLines : s.lyricClue ? [s.lyricClue] : []

  const snapshotState = useCallback((
    idx: number, rl: number, h: number, att: number,
    res: 'correct' | 'gave-up' | null, gh: string[]
  ) => {
    saveStageState('songs', idx, {
      revealedLines: rl, hint: h, attempts: att, result: res, guessHistory: gh,
    } as SongsStageState)
  }, [saveStageState])

  const loadStageOrReset = (idx: number) => {
    const saved = savedStageState?.[idx] as SongsStageState | undefined
    if (saved) {
      setLines(saved.revealedLines); setHint(saved.hint)
      setAttempts(saved.attempts); setResult(saved.result)
      setGuessHistory(saved.guessHistory)
    } else {
      setLines(1); setHint(0); setAttempts(0); setResult(null); setGuessHistory([])
    }
    setGuess(''); setShowFireworks(false)
  }

  const selectStage = (idx: number) => {
    snapshotState(activeIdx, revealedLines, hint, attempts, result, guessHistory)
    setActiveIdx(idx); loadStageOrReset(idx); setMode('play')
  }

  const goToPicker = () => {
    snapshotState(activeIdx, revealedLines, hint, attempts, result, guessHistory)
    setMode('pick')
  }

  const goToReview = () => setMode('review')

  const resetStage = () => {
    setLines(1); setHint(0); setAttempts(0); setResult(null)
    setGuessHistory([]); setGuess(''); setShowFireworks(false)
    saveStageState('songs', activeIdx, {
      revealedLines: 1, hint: 0, attempts: 0, result: null, guessHistory: [],
    })
    resetSingleStage('songs', activeIdx)
  }

  const submit = () => {
    if (!guess.trim() || result) return
    const correct = guess.trim().toLowerCase() === song.title.trim().toLowerCase()
    if (correct) {
      const hintsUsed = hint > 0 || revealedLines > 1
      markStageComplete('songs', activeIdx, {
        stageNum: activeIdx + 1, answer: song.title,
        attempts, hintsUsed, correct: true, detail: song.artist,
      })
      setResult('correct')
      setShowFireworks(true)
      setTimeout(() => setShowFireworks(false), 2500)
      snapshotState(activeIdx, revealedLines, hint, attempts, 'correct', guessHistory)
    } else {
      const lines      = getLines(song)
      const newLines   = Math.min(revealedLines + 1, lines.length)
      const newHistory = [...guessHistory, guess.trim()]
      setLines(newLines); setAttempts(a => a + 1)
      setGuessHistory(newHistory); setGuess('')
      setWrongFlash(true)
      setTimeout(() => setWrongFlash(false), 1100)
      snapshotState(activeIdx, newLines, hint, attempts + 1, null, newHistory)
    }
  }

  const giveUp = () => {
    const hintsUsed = hint > 0 || revealedLines > 1
    markStageComplete('songs', activeIdx, {
      stageNum: activeIdx + 1, answer: song.title,
      attempts, hintsUsed, correct: false, detail: song.artist,
    })
    setResult('gave-up')
    snapshotState(activeIdx, revealedLines, hint, attempts, 'gave-up', guessHistory)
  }

  const finishReview = () => {
    const stageResults = Object.entries(results)
      .sort(([a], [b]) => Number(a) - Number(b)).map(([, r]) => r)
    const score = Math.round((stageResults.filter(r => r.correct).length / stageResults.length) * 100)
    completeGame('songs', score); openVideo('songs')
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <motion.div className="text-5xl" animate={{ rotate: [0,15,-15,0] }} transition={{ repeat: Infinity, duration: 0.8 }}>🎵</motion.div>
    </div>
  )

  if (mode === 'pick') return (
    <PageWrapper>
      <StagePicker totalStages={songs.length} results={results}
        gameName="זהי את השיר" gameEmoji="🎵"
        onSelect={selectStage} onReview={goToReview}
        onBack={() => navigate('/games')}
        />
    </PageWrapper>
  )

  if (mode === 'review') {
    const stageResults = Object.entries(results).sort(([a],[b])=>Number(a)-Number(b)).map(([,r])=>r)
    return <GameReview results={stageResults} gameName="זהי את השיר" gameEmoji="🎵" onContinue={finishReview} />
  }

  if (!song) return null
  const lines         = getLines(song)
  const visibleLines  = lines.slice(0, revealedLines)
  const allLinesShown = revealedLines >= lines.length
  const hintsUsedSoFar = hint > 0 || revealedLines > 1
  const embedUrl      = song.spotifyUrl ? spotifyEmbedUrl(song.spotifyUrl) : null
  const maxHints      = embedUrl ? 2 : 1

  // Lyric card — always visible
  const LyricCard = (
    <motion.div key={activeIdx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="card p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-lavender-50 to-blush-50 opacity-60" />
      <div className="relative z-10">
        <div className="text-4xl mb-3">🎵</div>
        {result !== 'correct' && (
          <p className="text-xs text-gray-400 mb-3 font-medium">
            שורות: {revealedLines}/{lines.length || 1}
            {!allLinesShown && <span className="text-lavender-400 mr-2">· טעות תחשוף שורה נוספת</span>}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {visibleLines.map((line, i) => (
              <motion.blockquote key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`font-bold leading-relaxed ${i === 0 ? 'text-xl text-gray-700' : 'text-lg text-gray-500'}`}>
                "{line}"
              </motion.blockquote>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )

  return (
    <PageWrapper>
      {showFireworks && <Fireworks />}

      <div className="min-h-screen bg-gradient-soft flex flex-col">
        <div className="px-5 pt-10 pb-2 flex items-center justify-between">
          <button onClick={goToPicker} className="btn-ghost text-sm">→ חזרה</button>
          <h1 className="text-lg font-black text-gradient">זהי את השיר</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{activeIdx + 1}/{songs.length}</span>
            <button onClick={resetStage} title="איפוס שלב" className="text-gray-300 hover:text-blush-400 transition-colors text-lg leading-none">↺</button>
          </div>
        </div>

        <div className="px-5 pb-3 flex gap-2">
          <button onClick={() => selectStage(activeIdx - 1)} disabled={activeIdx === 0}
            className={`btn-secondary flex-1 text-xs py-1.5 ${activeIdx === 0 ? 'opacity-30' : ''}`}>→ הקודם</button>
          <button onClick={() => selectStage(activeIdx + 1)} disabled={activeIdx === songs.length - 1}
            className={`btn-secondary flex-1 text-xs py-1.5 ${activeIdx === songs.length - 1 ? 'opacity-30' : ''}`}>הבא ←</button>
        </div>

        <div className="flex-1 px-5 pb-8 flex flex-col gap-4">
          {result === 'correct' ? (
            /* ── WIN layout: 1 ספוטיפיי · 2 מילים מלאות · 3 ניחושים כושלים · 4 כרטיס מדהים ── */
            <>
              {/* 1. Spotify iframe — ללא כיסוי שם השיר */}
              {embedUrl && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="card overflow-hidden" style={{ direction: 'ltr' }}>
                  <iframe src={embedUrl} width="100%" height="152" frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy" style={{ display: 'block' }} />
                </motion.div>
              )}

              {/* 2. מילים מלאות */}
              <OriginalLinesReveal song={song} />

              {/* 2. ניחושים כושלים */}
              {guessHistory.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="flex flex-wrap gap-1.5">
                  {guessHistory.map((g, i) => (
                    <span key={i} className="text-xs bg-red-50 border border-red-100 text-red-400 rounded-full px-2.5 py-0.5 font-medium">
                      ❌ {g}
                    </span>
                  ))}
                </motion.div>
              )}

              {/* 3. כרטיס מדהים */}
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }} className="card p-4 text-center bg-green-50">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className="text-2xl">🎉</span>
                  <h3 className="text-lg font-black text-green-700">מדהים!</h3>
                </div>
                <div className="flex justify-center gap-6 pb-3 border-b border-green-100">
                  <div className="text-center">
                    <div className="text-xl font-black text-blush-500">{attempts + 1}</div>
                    <div className="text-xs text-gray-400">ניסיונות</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl">{hintsUsedSoFar ? '💡' : '⭐'}</div>
                    <div className="text-xs text-gray-400">{hintsUsedSoFar ? 'עם רמז' : 'בלי רמז!'}</div>
                  </div>
                </div>
                <button onClick={goToPicker} className="btn-primary mt-3 w-full text-sm">חזרה לבחירת שלבים ←</button>
              </motion.div>
            </>
          ) : (
            /* ── PLAY layout ── */
            <>
              {LyricCard}

              <AnimatePresence>
                {hint >= 1 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-4 flex items-center gap-3">
                    <span className="text-2xl">🎤</span>
                    <div><p className="text-xs text-gray-400">אמן</p><p className="font-bold text-gray-700">{song.artist}</p></div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {hint >= 2 && embedUrl && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                    <p className="text-xs text-gray-400 px-4 pt-3 pb-1">🎧 האזיני לקטע</p>
                    <div className="relative" style={{ direction: 'ltr' }}>
                      <iframe src={embedUrl} width="100%" height="152" frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy" style={{ display: 'block' }} />
                      <div style={{ position: 'absolute', top: 40, left: 110, right: 8, height: 20, background: '#1F1F1F', pointerEvents: 'none', zIndex: 1 }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="card p-3 bg-red-50 border border-red-100 text-center">
                    <p className="text-red-500 font-semibold text-sm">
                      ❌ לא נכון{!allLinesShown ? ' — נחשפה שורה נוספת!' : ''} (ניסיון {attempts})
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* gave-up result */}
              <AnimatePresence>
                {result === 'gave-up' && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="card p-5 text-center bg-gray-50">
                    <div className="text-3xl mb-2">😅</div>
                    <h3 className="text-lg font-black mb-0.5 text-gray-600">{`התשובה: ${song.title}`}</h3>
                    <p className="text-sm text-gray-400 mb-2">{song.artist}</p>
                    <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-2xl font-black text-blush-500">{attempts}</div>
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
                  <input type="text" value={guess} onChange={e => setGuess(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    placeholder="שם השיר..." className="input-field text-center text-lg" autoComplete="off" />
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const newHint = Math.min(hint + 1, maxHints)
                        setHint(newHint)
                        snapshotState(activeIdx, revealedLines, newHint, attempts, null, guessHistory)
                      }}
                      disabled={hint >= maxHints}
                      className={`btn-secondary flex-1 text-sm ${hint >= maxHints ? 'opacity-40' : ''}`}>
                      {hint === 0 ? '🎤 גלי אמן' : hint === 1 && embedUrl ? '🎧 שמעי קטע' : '💡 רמז'}
                    </button>
                    <button onClick={submit} className="btn-primary flex-1">נחשי! 🎵</button>
                  </div>
                  {(allLinesShown || attempts >= 3) && (
                    <button onClick={giveUp} className="btn-ghost text-sm text-gray-400 text-center">😮‍💨 ויתרתי</button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
