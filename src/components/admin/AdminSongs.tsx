import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSongs, addSong, deleteSong, updateSong } from '@/services/firebase'
import type { Song } from '@/types'

const emptyForm = () => ({
  title: '', artist: '', spotifyUrl: '', coverUrl: '',
  line1: '', line2: '', line3: '', line4: '',
  orig1: '', orig2: '', orig3: '', orig4: '',
})

type EditForm = ReturnType<typeof emptyForm>

const songToForm = (s: Song): EditForm => {
  const lines = s.lyricLines?.length ? s.lyricLines : s.lyricClue ? [s.lyricClue] : []
  const origs = s.originalLines ?? []
  return {
    title: s.title, artist: s.artist ?? '',
    spotifyUrl: s.spotifyUrl ?? '', coverUrl: s.coverUrl ?? '',
    line1: lines[0] ?? '', line2: lines[1] ?? '',
    line3: lines[2] ?? '', line4: lines[3] ?? '',
    orig1: origs[0] ?? '', orig2: origs[1] ?? '',
    orig3: origs[2] ?? '', orig4: origs[3] ?? '',
  }
}

// ── Defined OUTSIDE so React never remounts on re-render ──────────────────────

function SpotifyPreview({ url }: { url: string }) {
  const m = url.match(/track\/([A-Za-z0-9]+)/)
  const embedUrl = m ? `https://open.spotify.com/embed/track/${m[1]}?utm_source=generator&theme=0` : null
  if (!embedUrl) return <p className="text-xs text-red-400">URL לא חוקי — הדבק לינק לטראק מספוטיפיי</p>
  return (
    <div className="rounded-xl overflow-hidden border border-lavender-100">
      <p className="text-xs text-gray-400 px-3 pt-2">תצוגה מקדימה 🎧</p>
      <div className="relative" style={{ direction: 'ltr' }}>
        <iframe src={embedUrl} width="100%" height="152" frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy" style={{ display: 'block' }} />
        <div style={{ position: 'absolute', top: 43, left: 82, right: 8, height: 22, background: '#121212', pointerEvents: 'none', zIndex: 1 }} />
      </div>
    </div>
  )
}

function LinePairFields({ vals, onChange }: {
  vals: EditForm
  onChange: (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const pairs: [string, string, string][] = [
    ['line1', 'orig1', 'שורה 1 (תמיד מוצגת ראשונה)'],
    ['line2', 'orig2', 'שורה 2'],
    ['line3', 'orig3', 'שורה 3'],
    ['line4', 'orig4', 'שורה 4'],
  ]
  const v = vals as Record<string, string>
  return (
    <>
      {pairs.map(([lk, ok, label], i) => (
        <div key={lk} className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-gray-500">{label}{i === 0 ? ' *' : ' (אופציונלי)'}</p>
          <div className="relative">
            <input className="input-field pr-10" placeholder="מתורגמת"
              value={v[lk]} onChange={onChange(lk)} />
            <span className="absolute top-3 right-3 text-sm">🎵</span>
          </div>
          <div className="relative">
            <input className="input-field pr-10 bg-lavender-50" placeholder="מקורית (אופציונלי)"
              value={v[ok]} onChange={onChange(ok)} />
            <span className="absolute top-3 right-3 text-sm">🎼</span>
          </div>
        </div>
      ))}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminSongs() {
  const [songs, setSongs]   = useState<Song[]>([])
  const [form, setForm]     = useState(emptyForm())
  const [loading, setLoad]  = useState(true)
  const [saving, setSaving] = useState(false)
  const [expand, setExpand] = useState(false)

  const [editId, setEditId]     = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyForm())

  const load = async () => { setLoad(true); setSongs(await getSongs()); setLoad(false) }
  useEffect(() => { load() }, [])

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const ef = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditForm(prev => ({ ...prev, [k]: e.target.value }))

  const buildSongData = (fm: EditForm, order: number) => ({
    title:         fm.title.trim(),
    artist:        fm.artist.trim(),
    lyricClue:     fm.line1.trim(),
    lyricLines:    [fm.line1, fm.line2, fm.line3, fm.line4].filter(Boolean).map(s => s.trim()),
    originalLines: [fm.orig1, fm.orig2, fm.orig3, fm.orig4].filter(Boolean).map(s => s.trim()),
    hints:         [],
    spotifyUrl:    fm.spotifyUrl.trim(),
    coverUrl:      fm.coverUrl.trim(),
    order,
  })

  const add = async () => {
    if (!form.title.trim() || !form.line1.trim()) return
    setSaving(true)
    await addSong(buildSongData(form, songs.length) as Parameters<typeof addSong>[0])
    setForm(emptyForm())
    setExpand(false)
    await load()
    setSaving(false)
  }

  const startEdit  = (s: Song) => { setEditId(s.id); setEditForm(songToForm(s)) }
  const cancelEdit = () => { setEditId(null); setEditForm(emptyForm()) }

  const saveEdit = async (id: string) => {
    if (!editForm.title.trim() || !editForm.line1.trim()) return
    setSaving(true)
    const { order: _o, hints: _h, ...data } = buildSongData(editForm, 0)
    await updateSong(id, data)
    cancelEdit()
    await load()
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5">
        <h2 className="section-title">🎵 שירים</h2>
        <p className="section-subtitle">הוסיפי שירים לזיהוי — עד 4 שורות + שורה מקורית לכל אחת</p>

        <button onClick={() => setExpand(e => !e)} className="btn-secondary w-full mb-4">
          {expand ? '▲ סגור' : '+ הוסף שיר'}
        </button>

        <AnimatePresence>
          {expand && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex flex-col gap-3 mb-5 pt-1">
                <input className="input-field" placeholder="שם השיר *"  value={form.title}  onChange={f('title')} />
                <input className="input-field" placeholder="אמן *"       value={form.artist} onChange={f('artist')} />
                <LinePairFields vals={form} onChange={f} />
                <input className="input-field" placeholder="Spotify URL (אופציונלי)" value={form.spotifyUrl} onChange={f('spotifyUrl')} />
                {form.spotifyUrl && <SpotifyPreview url={form.spotifyUrl} />}
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
                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {editId === s.id ? (
                    <div className="card p-4 border-2 border-lavender-200 flex flex-col gap-3">
                      <p className="text-sm font-bold text-lavender-500">✏️ עריכת שיר</p>
                      <input className="input-field" placeholder="שם השיר *"  value={editForm.title}  onChange={ef('title')} />
                      <input className="input-field" placeholder="אמן *"       value={editForm.artist} onChange={ef('artist')} />
                      <LinePairFields vals={editForm} onChange={ef} />
                      <input className="input-field" placeholder="Spotify URL" value={editForm.spotifyUrl} onChange={ef('spotifyUrl')} />
                      {editForm.spotifyUrl && <SpotifyPreview url={editForm.spotifyUrl} />}
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(s.id)} disabled={saving} className="btn-primary flex-1">
                          {saving ? 'שומר...' : '💾 שמור'}
                        </button>
                        <button onClick={cancelEdit} className="btn-secondary flex-1">ביטול</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-lavender-50 rounded-2xl">
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
                      <button onClick={() => startEdit(s)}              className="text-lavender-400 hover:bg-lavender-100 rounded-xl p-1.5 flex-shrink-0">✏️</button>
                      <button onClick={() => deleteSong(s.id).then(load)} className="text-red-400 hover:bg-red-100 rounded-xl p-1.5 flex-shrink-0">🗑️</button>
                    </div>
                  )}
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
