import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSongs, addSong, deleteSong } from '@/services/firebase'
import type { Song } from '@/types'

const emptyForm = () => ({
  title: '', artist: '', spotifyUrl: '', coverUrl: '',
  line1: '', line2: '', line3: '', line4: '',
})

export default function AdminSongs() {
  const [songs, setSongs]   = useState<Song[]>([])
  const [form, setForm]     = useState(emptyForm())
  const [loading, setLoad]  = useState(true)
  const [saving, setSaving] = useState(false)
  const [expand, setExpand] = useState(false)

  const load = async () => { setLoad(true); setSongs(await getSongs()); setLoad(false) }
  useEffect(() => { load() }, [])

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const add = async () => {
    if (!form.title.trim() || !form.line1.trim()) return
    setSaving(true)
    const lyricLines = [form.line1, form.line2, form.line3, form.line4].filter(Boolean)
    await addSong({
      title:      form.title.trim(),
      artist:     form.artist.trim(),
      lyricClue:  form.line1.trim(),
      lyricLines,
      hints:      [],
      spotifyUrl: form.spotifyUrl.trim(),
      coverUrl:   form.coverUrl.trim(),
      order:      songs.length,
    })
    setForm(emptyForm())
    setExpand(false)
    await load()
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5">
        <h2 className="section-title">🎵 שירים</h2>
        <p className="section-subtitle">הוסיפי שירים לזיהוי — עד 4 שורות לכל שיר</p>

        <button onClick={() => setExpand(e => !e)} className="btn-secondary w-full mb-4">
          {expand ? '▲ סגור' : '+ הוסף שיר'}
        </button>

        <AnimatePresence>
          {expand && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 mb-5 pt-1">
                <input className="input-field" placeholder="שם השיר *" value={form.title}  onChange={f('title')} />
                <input className="input-field" placeholder="אמן *"      value={form.artist} onChange={f('artist')} />

                <p className="text-xs font-semibold text-gray-500 -mb-1">שורות לשיר (לפחות 1, עד 4):</p>
                {[
                  ['line1', 'שורה 1 * (תמיד מוצגת ראשונה)'],
                  ['line2', 'שורה 2 (אופציונלי)'],
                  ['line3', 'שורה 3 (אופציונלי)'],
                  ['line4', 'שורה 4 (אופציונלי)'],
                ].map(([key, ph]) => (
                  <div key={key} className="relative">
                    <input
                      className="input-field pr-10"
                      placeholder={ph}
                      value={(form as Record<string, string>)[key]}
                      onChange={f(key)}
                    />
                    <span className="absolute top-3 right-3 text-sm">🎵</span>
                  </div>
                ))}

                <input className="input-field" placeholder="Spotify URL (אופציונלי)" value={form.spotifyUrl} onChange={f('spotifyUrl')} />
                {form.spotifyUrl && (() => {
                  const m = form.spotifyUrl.match(/track\/([A-Za-z0-9]+)/)
                  const embedUrl = m ? `https://open.spotify.com/embed/track/${m[1]}?utm_source=generator&theme=0` : null
                  return embedUrl ? (
                    <div className="rounded-xl overflow-hidden border border-lavender-100">
                      <p className="text-xs text-gray-400 px-3 pt-2">תצוגה מקדימה 🎧</p>
                      <div className="relative" style={{ direction: 'ltr' }}>
                        <iframe src={embedUrl} width="100%" height="152" frameBorder="0"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy" style={{ display: 'block' }} />
                        <div style={{ position: 'absolute', top: 43, left: 82, right: 8, height: 22, background: '#121212', pointerEvents: 'none', zIndex: 1 }} />
                      </div>
                    </div>
                  ) : <p className="text-xs text-red-400">URL לא חוקי — הדבק לינק לטראק מספוטיפיי</p>
                })()}

                <button onClick={add} disabled={saving} className="btn-primary mt-1">
                  {saving ? 'שומר...' : '+ הוסף שיר'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="text-center py-6 text-2xl animate-pulse">🎵</div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {songs.map(s => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 p-3 bg-lavender-50 rounded-2xl"
                >
                  {s.coverUrl ? (
                    <img src={s.coverUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-lavender-100 flex items-center justify-center text-xl flex-shrink-0">🎵</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-700 truncate">{s.title}</p>
                    <p className="text-xs text-gray-400 truncate">{s.artist}</p>
                    <p className="text-xs text-lavender-500 mt-0.5">{(s.lyricLines?.length || 1)} שורות</p>
                  </div>
                  <button onClick={() => deleteSong(s.id).then(load)} className="text-red-400 hover:bg-red-100 rounded-xl p-1.5 flex-shrink-0">🗑️</button>
                </motion.div>
              ))}
            </AnimatePresence>
            {songs.length === 0 && <p className="text-center text-gray-300 py-4">אין שירים עדיין</p>}
          </div>
        )}
      </div>
    </div>
  )
}
