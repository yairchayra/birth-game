import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getLukaNicknames, addLukaNickname, deleteLukaNickname } from '@/services/firebase'
import { uploadFile } from '@/services/firebase'
import type { LukaNickname } from '@/types'

export default function AdminLuka() {
  const [cards, setCards]   = useState<LukaNickname[]>([])
  const [form, setForm]     = useState({ nickname: '', hints: '' })
  const [loading, setLoad]  = useState(true)
  const [saving, setSaving] = useState(false)
  const [pct, setPct]       = useState<number | null>(null)
  const fileRef             = useRef<HTMLInputElement>(null)

  const load = async () => { setLoad(true); setCards(await getLukaNicknames()); setLoad(false) }
  useEffect(() => { load() }, [])

  const add = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file || !form.nickname.trim()) return
    setSaving(true)
    const url = await uploadFile(file, `luka/${Date.now()}_${file.name}`, p => setPct(p))
    await addLukaNickname({
      nickname: form.nickname.trim(),
      imageUrl: url,
      hints:    form.hints.split('\n').filter(Boolean),
      order:    cards.length,
    })
    setForm({ nickname: '', hints: '' })
    if (fileRef.current) fileRef.current.value = ''
    setPct(null)
    await load()
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5">
        <h2 className="section-title">🐾 כינויים ללוקה</h2>
        <p className="section-subtitle">תמונות AI לכל כינוי</p>

        <div className="flex flex-col gap-3 mb-5">
          <input ref={fileRef} type="file" accept="image/*" className="input-field text-sm" />
          <input
            type="text"
            value={form.nickname}
            onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
            placeholder="הכינוי של לוקה"
            className="input-field"
          />
          <textarea
            value={form.hints}
            onChange={e => setForm(f => ({ ...f, hints: e.target.value }))}
            placeholder="רמזים (שורה לכל רמז)"
            rows={2}
            className="input-field resize-none"
          />
          {pct !== null && (
            <div className="h-2 bg-peach-100 rounded-full overflow-hidden">
              <div className="h-full bg-peach-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
          <button onClick={add} disabled={saving} className="btn-primary">
            {saving ? 'מעלה...' : '+ הוסף כינוי'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-6 text-2xl animate-pulse">🐾</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {cards.map(card => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative rounded-2xl overflow-hidden aspect-square"
                >
                  <img src={card.imageUrl} alt={card.nickname} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                    <p className="text-white font-bold text-sm">{card.nickname}</p>
                  </div>
                  <button
                    onClick={() => deleteLukaNickname(card.id).then(load)}
                    className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs"
                  >✕</button>
                </motion.div>
              ))}
            </AnimatePresence>
            {cards.length === 0 && <p className="col-span-2 text-center text-gray-300 py-4">אין כינויים עדיין</p>}
          </div>
        )}
      </div>
    </div>
  )
}
