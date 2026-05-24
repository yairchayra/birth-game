import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSongs, addSong, deleteSong } from '@/services/firebase'
import type { Song } from '@/types'

const empty = (): Omit<Song, 'id'> => ({
  title: '', artist: '', lyricClue: '',
  hints: [], spotifyUrl: '', coverUrl: '', order: 0,
})

export default function AdminSongs() {
  const [songs, setSongs]   = useState<Song[]>([])
  const [form, setForm]     = useState(empty())
  const [loading, setLoad]  = useState(true)
  const [saving, setSaving] = useState(false)
  const [expand, setExpand] = useState(false)

  const load = async () => {
    setLoad(true); setSongs(await getSongs()); setLoad(false)
  }
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!form.title || !form.lyricClue) return
    setSaving(true)
    await addSong({ ...form, order: songs.length })
    setForm(empty())
    setExpand(false)
    await load()
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5">
        <h2 className="section-title">🎵 שירים</h2>
        <p className="section-subtitle">הוסיפי שירים לזיהוי</p>

        <button
          onClick={() => setExpand(e => !e)}
          className="btn-secondary w-full mb-4"
        >
          {expand ? '▲ סגור טופס' : '+ הוסף שיר'}
        </button>

        <AnimatePresence>
          {expand && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 mb-5 pt-2">
                {[
                  ['title',      'שם השיר',             'text'],
                  ['artist',     'אמן',                  'text'],
                  ['lyricClue',  'שורה מבולבלת / מתורגמת', 'text'],
                  ['spotifyUrl', 'Spotify URL',           'url'],
                  ['coverUrl',   'URL של עטיפה',          'url'],
                ].map(([k, label, type]) => (
                  <input
                    key={k}
                    type={type}
                    value={(form as Record<string, string>)[k]}
                    onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    placeholder={label}
                    className="input-field"
                  />
                ))}
                <button onClick={add} disabled={saving} className="btn-primary">
                  {saving ? 'שומר...' : 'הוסף שיר'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="text-center py-6 text-2xl animate-pulse">🎵</div>
        ) : (
          <div className="flex flex-col gap-3">
            {songs.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-lavender-50 rounded-2xl">
                {s.coverUrl && (
                  <img src={s.coverUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-700 truncate">{s.title}</p>
                  <p className="text-xs text-gray-400 truncate">{s.artist}</p>
                </div>
                <button
                  onClick={() => deleteSong(s.id).then(load)}
                  className="text-red-400 hover:bg-red-100 rounded-xl p-1.5"
                >🗑️</button>
              </div>
            ))}
            {songs.length === 0 && <p className="text-center text-gray-300 py-4">אין שירים עדיין</p>}
          </div>
        )}
      </div>
    </div>
  )
}
