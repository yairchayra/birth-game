import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getHomeVideos, addHomeVideo, deleteHomeVideo, uploadFile } from '@/services/firebase'
import type { HomeVideo, GameId } from '@/types'

const GAME_OPTIONS: { value: GameId | 'finale'; label: string }[] = [
  { value: 'wordle',    label: '🔤 אחרי Wordle' },
  { value: 'who-am-i', label: '🔍 אחרי מי אני' },
  { value: 'songs',    label: '🎵 אחרי שירים'  },
  { value: 'luka',     label: '🐾 אחרי לוקה'   },
  { value: 'finale',   label: '🏆 סרטון סיום'  },
]

export default function AdminVideos() {
  const [videos, setVideos] = useState<HomeVideo[]>([])
  const [loading, setLoad]  = useState(true)
  const [saving, setSaving] = useState(false)
  const [videoPct, setVPct] = useState<number | null>(null)
  const [thumbPct, setTPct] = useState<number | null>(null)
  const [form, setForm]     = useState({
    title: '', description: '', relatedGame: 'wordle' as GameId | 'finale',
  })
  const videoRef = useRef<HTMLInputElement>(null)
  const thumbRef = useRef<HTMLInputElement>(null)

  const load = async () => { setLoad(true); setVideos(await getHomeVideos()); setLoad(false) }
  useEffect(() => { load() }, [])

  const add = async () => {
    const vFile = videoRef.current?.files?.[0]
    if (!vFile || !form.title.trim()) return
    setSaving(true)
    try {
      const ts       = Date.now()
      const videoUrl = await uploadFile(vFile, `videos/${ts}_${vFile.name}`, p => setVPct(p))
      let thumbUrl   = ''
      const tFile    = thumbRef.current?.files?.[0]
      if (tFile) thumbUrl = await uploadFile(tFile, `thumbs/${ts}_${tFile.name}`, p => setTPct(p))

      await addHomeVideo({
        title:        form.title.trim(),
        description:  form.description.trim(),
        videoUrl,
        thumbnailUrl: thumbUrl,
        relatedGame:  form.relatedGame,
        order:        videos.length,
      })
      setForm({ title: '', description: '', relatedGame: 'wordle' })
      if (videoRef.current) videoRef.current.value = ''
      if (thumbRef.current) thumbRef.current.value = ''
      setVPct(null); setTPct(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5">
        <h2 className="section-title">🎬 סרטונים מהבית</h2>
        <p className="section-subtitle">העלי סרטון לכל משחק ולסיום</p>

        <div className="flex flex-col gap-3 mb-5">
          <label className="text-sm font-medium text-gray-600">קובץ וידאו</label>
          <input ref={videoRef} type="file" accept="video/*" className="input-field text-sm" />

          <label className="text-sm font-medium text-gray-600">תמונת מיניאטורה (אופציונלי)</label>
          <input ref={thumbRef} type="file" accept="image/*" className="input-field text-sm" />

          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="כותרת הסרטון"
            className="input-field"
          />
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="תיאור קצר (אופציונלי)"
            rows={2}
            className="input-field resize-none"
          />
          <select
            value={form.relatedGame}
            onChange={e => setForm(f => ({ ...f, relatedGame: e.target.value as GameId | 'finale' }))}
            className="input-field"
          >
            {GAME_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {videoPct !== null && (
            <div>
              <p className="text-xs text-gray-400 mb-1">וידאו: {Math.round(videoPct)}%</p>
              <div className="h-2 bg-blush-100 rounded-full overflow-hidden">
                <div className="h-full bg-blush-400 rounded-full transition-all" style={{ width: `${videoPct}%` }} />
              </div>
            </div>
          )}
          {thumbPct !== null && (
            <div>
              <p className="text-xs text-gray-400 mb-1">תמונה: {Math.round(thumbPct)}%</p>
              <div className="h-2 bg-lavender-100 rounded-full overflow-hidden">
                <div className="h-full bg-lavender-400 rounded-full transition-all" style={{ width: `${thumbPct}%` }} />
              </div>
            </div>
          )}

          <button onClick={add} disabled={saving} className="btn-primary">
            {saving ? 'מעלה...' : '🎬 העלה סרטון'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-6 text-2xl animate-pulse">🎬</div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {videos.map(v => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl"
                >
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl} alt="" className="w-16 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-12 rounded-xl bg-blush-100 flex items-center justify-center text-xl">🎬</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-700 truncate">{v.title}</p>
                    <p className="text-xs text-gray-400">
                      {GAME_OPTIONS.find(o => o.value === v.relatedGame)?.label}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteHomeVideo(v.id).then(load)}
                    className="text-red-400 hover:bg-red-100 rounded-xl p-1.5"
                  >🗑️</button>
                </motion.div>
              ))}
            </AnimatePresence>
            {videos.length === 0 && <p className="text-center text-gray-300 py-4">אין סרטונים עדיין</p>}
          </div>
        )}
      </div>
    </div>
  )
}
