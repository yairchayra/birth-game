import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getWhoAmICards, addWhoAmICard, deleteWhoAmICard,
} from '@/services/firebase'
import { uploadFile } from '@/services/firebase'
import type { WhoAmICard } from '@/types'

export default function AdminWhoAmI() {
  const [cards, setCards]   = useState<WhoAmICard[]>([])
  const [loading, setLoad]  = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState({ answer: '', hints: '', initialPixelLevel: '0' })
  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoad(true)
    setCards(await getWhoAmICards())
    setLoad(false)
  }
  useEffect(() => { load() }, [])

  const add = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file || !form.answer.trim()) return
    setSaving(true)
    try {
      const url = await uploadFile(file, `who_am_i/${Date.now()}_${file.name}`, p => setUploadPct(p))
      await addWhoAmICard({
        imageUrl:          url,
        answer:            form.answer.trim(),
        hints:             form.hints.split('\n').filter(Boolean),
        order:             cards.length,
        initialPixelLevel: parseInt(form.initialPixelLevel) || 0,
      })
      setForm({ answer: '', hints: '', initialPixelLevel: '0' })
      if (fileRef.current) fileRef.current.value = ''
      setUploadPct(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5">
        <h2 className="section-title">🔍 מי אני?</h2>
        <p className="section-subtitle">העלי תמונות עם תשובות ורמזים</p>

        <div className="flex flex-col gap-3 mb-5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="input-field text-sm"
          />
          <input
            type="text"
            value={form.answer}
            onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
            placeholder="התשובה (שם האדם)"
            className="input-field"
          />
          <textarea
            value={form.hints}
            onChange={e => setForm(f => ({ ...f, hints: e.target.value }))}
            placeholder="רמזים (שורה אחת לכל רמז)"
            rows={3}
            className="input-field resize-none"
          />
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">
              רמת פיקסול התחלתית: {form.initialPixelLevel} (0=הכי מפוקסל, 6=כמעט ברור)
            </label>
            <input
              type="range"
              min="0"
              max="6"
              value={form.initialPixelLevel}
              onChange={e => setForm(f => ({ ...f, initialPixelLevel: e.target.value }))}
              className="w-full accent-pink-400"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>בלתי ניתן לזיהוי</span>
              <span>כמעט ברור</span>
            </div>
          </div>
          {uploadPct !== null && (
            <div className="h-2 bg-blush-100 rounded-full overflow-hidden">
              <div className="h-full bg-blush-400 rounded-full transition-all" style={{ width: `${uploadPct}%` }} />
            </div>
          )}
          <button onClick={add} disabled={saving} className="btn-primary">
            {saving ? 'מעלה...' : '+ הוסף תמונה'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-6 text-2xl animate-pulse">🔍</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {cards.map(card => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative rounded-2xl overflow-hidden aspect-square"
                >
                  <img src={card.imageUrl} alt={card.answer} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-2">
                    <p className="text-white font-bold text-sm">{card.answer}</p>
                  </div>
                  <button
                    onClick={() => deleteWhoAmICard(card.id).then(load)}
                    className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs"
                  >✕</button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
