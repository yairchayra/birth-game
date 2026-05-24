import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getWhoAmICards, addWhoAmICard, deleteWhoAmICard, uploadFile } from '@/services/firebase'
import type { WhoAmICard } from '@/types'

const BLUR_PX = [40, 28, 18, 12, 7, 3.5, 1, 0]

export default function AdminWhoAmI() {
  const [cards, setCards]   = useState<WhoAmICard[]>([])
  const [loading, setLoad]  = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState({ answer: '', hints: '', initialPixelLevel: 0 })
  const [uploadPct, setUploadPct]   = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => { setLoad(true); setCards(await getWhoAmICards()); setLoad(false) }
  useEffect(() => { load() }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPreviewUrl(URL.createObjectURL(file))
  }

  const add = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file || !form.answer.trim()) return
    setSaving(true)
    try {
      const url = await uploadFile(file, `who_am_i/${Date.now()}_${file.name}`, p => setUploadPct(p))
      await addWhoAmICard({
        imageUrl: url, answer: form.answer.trim(),
        hints: form.hints.split('\n').filter(Boolean),
        order: cards.length, initialPixelLevel: form.initialPixelLevel,
      })
      setForm({ answer: '', hints: '', initialPixelLevel: 0 })
      setPreviewUrl(null)
      if (fileRef.current) fileRef.current.value = ''
      setUploadPct(null)
      await load()
    } finally { setSaving(false) }
  }

  const blurStyle = (level: number) => ({
    filter:    BLUR_PX[Math.min(level, 7)] > 0 ? `blur(${BLUR_PX[Math.min(level, 7)]}px)` : 'none',
    transform: level < 7 ? 'scale(1.08)' : 'scale(1)',
    transition: 'filter 0.3s ease',
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5">
        <h2 className="section-title">🔍 מי אני?</h2>
        <p className="section-subtitle">העלי תמונות — ראי בעצמך איך הטשטוש נראה</p>

        <div className="flex flex-col gap-3 mb-5">
          <input ref={fileRef} type="file" accept="image/*" className="input-field text-sm" onChange={handleFileChange} />

          {previewUrl && (
            <div className="rounded-2xl overflow-hidden aspect-square relative bg-gray-100">
              <img src={previewUrl} alt="תצוגה מקדימה" className="w-full h-full object-cover" style={blurStyle(form.initialPixelLevel)} />
              <div className="absolute bottom-2 right-2 bg-white/85 rounded-full px-2 py-0.5 text-xs font-bold text-blush-500">
                בהירות {form.initialPixelLevel}/7
              </div>
            </div>
          )}

          <input type="text" value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} placeholder="התשובה (שם האדם)" className="input-field" />
          <textarea value={form.hints} onChange={e => setForm(f => ({ ...f, hints: e.target.value }))} placeholder="רמזים (שורה אחת לכל רמז)" rows={3} className="input-field resize-none" />

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">
              רמת טשטוש התחלתית: {form.initialPixelLevel} &nbsp;(0 = בלתי ניתן לזיהוי · 6 = כמעט ברור)
            </label>
            <input type="range" min="0" max="6" value={form.initialPixelLevel}
              onChange={e => setForm(f => ({ ...f, initialPixelLevel: Number(e.target.value) }))}
              className="w-full accent-pink-400" />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>בלתי ניתן לזיהוי</span><span>כמעט ברור</span>
            </div>
            <p className="text-xs text-gray-300 mt-1">כל טעות תבהיר ב-1 — מרמה זו עד 7 (תמונה ברורה = כישלון אוטומטי)</p>
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
                <motion.div key={card.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative rounded-2xl overflow-hidden aspect-square">
                  <img src={card.imageUrl} alt={card.answer} className="w-full h-full object-cover" style={blurStyle(card.initialPixelLevel ?? 0)} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-2">
                    <p className="text-white font-bold text-sm">{card.answer}</p>
                    <p className="text-white/60 text-xs">רמה {card.initialPixelLevel ?? 0}/7</p>
                  </div>
                  <button onClick={() => deleteWhoAmICard(card.id).then(load)} className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs">✕</button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
