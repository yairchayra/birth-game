import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getHomeVideos, addHomeVideo, deleteHomeVideo, updateHomeVideo, uploadFile } from '@/services/firebase'
import type { HomeVideo, GameId } from '@/types'

const GAME_OPTIONS: { value: GameId | 'finale'; label: string }[] = [
  { value: 'wordle',    label: '🔤 אחרי Wordle' },
  { value: 'who-am-i', label: '🔍 אחרי מי אני' },
  { value: 'songs',    label: '🎵 אחרי שירים'  },
  { value: 'luka',     label: '🐾 אחרי לוקה'   },
  { value: 'finale',   label: '🏆 סרטון סיום'  },
]

function VideoPlayer({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="relative w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <video
          src={url}
          controls
          autoPlay
          className="w-full rounded-2xl"
          style={{ maxHeight: '80vh' }}
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -left-3 w-8 h-8 bg-white rounded-full shadow-medium flex items-center justify-center text-gray-500 font-bold"
        >✕</button>
      </motion.div>
    </motion.div>
  )
}

export default function AdminVideos() {
  const [videos, setVideos]     = useState<HomeVideo[]>([])
  const [loading, setLoad]      = useState(true)
  const [saving, setSaving]     = useState(false)
  const [videoPct, setVPct]     = useState<number | null>(null)
  const [thumbPct, setTPct]     = useState<number | null>(null)
  const [expand, setExpand]     = useState(false)
  const [playUrl, setPlayUrl]   = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', relatedGame: 'wordle' as GameId | 'finale',
  })

  // Edit state
  const [editId, setEditId]   = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
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
      setVPct(null); setTPct(null); setExpand(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (v: HomeVideo) => {
    setEditId(v.id)
    setEditForm({ title: v.title, description: v.description, relatedGame: v.relatedGame })
  }
  const cancelEdit = () => setEditId(null)

  const saveEdit = async (id: string) => {
    setSaving(true)
    await updateHomeVideo(id, {
      title:       editForm.title.trim(),
      description: editForm.description.trim(),
      relatedGame: editForm.relatedGame,
    })
    cancelEdit()
    await load()
    setSaving(false)
  }

  return (
    <>
      <AnimatePresence>
        {playUrl && <VideoPlayer url={playUrl} onClose={() => setPlayUrl(null)} />}
      </AnimatePresence>

      <div className="flex flex-col gap-5">
        <div className="card p-5">
          <h2 className="section-title">🎬 סרטונים מהבית</h2>
          <p className="section-subtitle">העלי סרטון לכל משחק ולסיום</p>

          <button onClick={() => setExpand(e => !e)} className="btn-secondary w-full mb-4">
            {expand ? '▲ סגור' : '+ העלה סרטון'}
          </button>

          <AnimatePresence>
            {expand && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="flex flex-col gap-3 mb-5 pt-1">
                  <label className="text-sm font-medium text-gray-600">קובץ וידאו *</label>
                  <input ref={videoRef} type="file" accept="video/*" className="input-field text-sm" />

                  <label className="text-sm font-medium text-gray-600">תמונת מיניאטורה (אופציונלי)</label>
                  <input ref={thumbRef} type="file" accept="image/*" className="input-field text-sm" />

                  <input type="text" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="כותרת הסרטון *" className="input-field" />
                  <textarea value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="תיאור קצר (אופציונלי)" rows={2}
                    className="input-field resize-none" />
                  <select value={form.relatedGame}
                    onChange={e => setForm(f => ({ ...f, relatedGame: e.target.value as GameId | 'finale' }))}
                    className="input-field">
                    {GAME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="text-center py-6 text-2xl animate-pulse">🎬</div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {videos.map(v => (
                  <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {editId === v.id ? (
                      /* ── Edit panel ── */
                      <div className="card p-4 border-2 border-blush-200 flex flex-col gap-3">
                        <p className="text-sm font-bold text-blush-500">✏️ עריכת סרטון</p>
                        <input type="text" value={editForm.title}
                          onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="כותרת" className="input-field" />
                        <textarea value={editForm.description}
                          onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="תיאור" rows={2} className="input-field resize-none" />
                        <select value={editForm.relatedGame}
                          onChange={e => setEditForm(f => ({ ...f, relatedGame: e.target.value as GameId | 'finale' }))}
                          className="input-field">
                          {GAME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(v.id)} disabled={saving} className="btn-primary flex-1">
                            {saving ? 'שומר...' : '💾 שמור'}
                          </button>
                          <button onClick={cancelEdit} className="btn-secondary flex-1">ביטול</button>
                        </div>
                      </div>
                    ) : (
                      /* ── Display row ── */
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                        <button
                          onClick={() => setPlayUrl(v.videoUrl)}
                          className="relative flex-shrink-0 w-16 h-12 rounded-xl overflow-hidden group"
                        >
                          {v.thumbnailUrl ? (
                            <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-blush-100 flex items-center justify-center text-xl">🎬</div>
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                            <span className="text-white text-xl">▶</span>
                          </div>
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-700 truncate">{v.title}</p>
                          <p className="text-xs text-gray-400">
                            {GAME_OPTIONS.find(o => o.value === v.relatedGame)?.label}
                          </p>
                        </div>
                        <button onClick={() => setPlayUrl(v.videoUrl)}
                          className="text-blush-400 hover:bg-blush-50 rounded-xl p-1.5 flex-shrink-0 text-sm font-bold">▶</button>
                        <button onClick={() => startEdit(v)}
                          className="text-lavender-400 hover:bg-lavender-100 rounded-xl p-1.5 flex-shrink-0">✏️</button>
                        <button onClick={() => deleteHomeVideo(v.id).then(load)}
                          className="text-red-400 hover:bg-red-100 rounded-xl p-1.5 flex-shrink-0">🗑️</button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {videos.length === 0 && <p className="text-center text-gray-300 py-4">אין סרטונים עדיין</p>}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
