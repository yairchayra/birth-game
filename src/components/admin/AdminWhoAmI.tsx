import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getWhoAmICards, addWhoAmICard, deleteWhoAmICard, updateWhoAmICard, uploadFile } from '@/services/firebase'
import type { WhoAmICard } from '@/types'

const BLUR_PX = [40, 28, 18, 12, 7, 3.5, 1, 0]

const blurStyle = (level: number) => ({
  filter:    BLUR_PX[Math.min(level, 7)] > 0 ? `blur(${BLUR_PX[Math.min(level, 7)]}px)` : 'none',
  transform: level < 7 ? 'scale(1.08)' : 'scale(1)',
  transition: 'filter 0.3s ease',
})

export default function AdminWhoAmI() {
  const [cards, setCards]   = useState<WhoAmICard[]>([])
  const [loading, setLoad]  = useState(true)
  const [saving, setSaving] = useState(false)

  // Add form
  const [form, setForm]         = useState({ answer: '', hints: '', initialPixelLevel: 0 })
  const [uploadPct, setUploadPct]   = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Edit state
  const [editId, setEditId]   = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ answer: '', hints: '', initialPixelLevel: 0 })
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null)
  const [editUploadPct, setEditUploadPct]   = useState<number | null>(null)
  const editFileRef = useRef<HTMLInputElement>(null)

  const load = async () => { setLoad(true); setCards(await getWhoAmICards()); setLoad(false) }
  useEffect(() => { load() }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPreviewUrl(URL.createObjectURL(file))
  }

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setEditPreviewUrl(URL.createObjectURL(file))
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

  const startEdit = (card: WhoAmICard) => {
    setEditId(card.id)
    setEditForm({
      answer: card.answer,
      hints:  (card.hints ?? []).join('\n'),
      initialPixelLevel: card.initialPixelLevel ?? 0,
    })
    setEditPreviewUrl(card.imageUrl)
    setEditUploadPct(null)
    if (editFileRef.current) editFileRef.current.value = ''
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditPreviewUrl(null)
    setEditUploadPct(null)
  }

  const saveEdit = async (card: WhoAmICard) => {
    setSaving(true)
    try {
      const newFile = editFileRef.current?.files?.[0]
      const imageUrl = newFile
        ? await uploadFile(newFile, `who_am_i/${Date.now()}_${newFile.name}`, p => setEditUploadPct(p))
        : card.imageUrl
      await updateWhoAmICard(card.id, {
        imageUrl,
        answer: editForm.answer.trim(),
        hints:  editForm.hints.split('\n').filter(Boolean),
        initialPixelLevel: editForm.initialPixelLevel,
      })
      cancelEdit()
      await load()
    } finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5">
        <h2 className="section-title">🔍 מי אני?</h2>
        <p className="section-subtitle">העלי תמונות — ראי בעצמך איך הטשטוש נראה</p>

        {/* Add form */}
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

        {/* Cards grid */}
        {loading ? (
          <div className="text-center py-6 text-2xl animate-pulse">🔍</div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {cards.map(card => (
                <motion.div key={card.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  {editId === card.id ? (
                    /* ── Edit panel ── */
                    <div className="card p-4 border-2 border-blush-200 flex flex-col gap-3">
                      <p className="text-sm font-bold text-blush-500">✏️ עריכת כרטיסיה</p>

                      {editPreviewUrl && (
                        <div className="rounded-2xl overflow-hidden aspect-square relative bg-gray-100">
                          <img src={editPreviewUrl} alt="preview" className="w-full h-full object-cover" style={blurStyle(editForm.initialPixelLevel)} />
                          <div className="absolute bottom-2 right-2 bg-white/85 rounded-full px-2 py-0.5 text-xs font-bold text-blush-500">
                            בהירות {editForm.initialPixelLevel}/7
                          </div>
                        </div>
                      )}

                      <input ref={editFileRef} type="file" accept="image/*" className="input-field text-sm" onChange={handleEditFileChange} />
                      <p className="text-xs text-gray-400 -mt-1">אם לא תבחרי תמונה חדשה — התמונה הקיימת תישמר</p>

                      <input type="text" value={editForm.answer} onChange={e => setEditForm(f => ({ ...f, answer: e.target.value }))} placeholder="התשובה (שם האדם)" className="input-field" />
                      <textarea value={editForm.hints} onChange={e => setEditForm(f => ({ ...f, hints: e.target.value }))} placeholder="רמזים (שורה אחת לכל רמז)" rows={3} className="input-field resize-none" />

                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">
                          רמת טשטוש התחלתית: {editForm.initialPixelLevel}
                        </label>
                        <input type="range" min="0" max="6" value={editForm.initialPixelLevel}
                          onChange={e => setEditForm(f => ({ ...f, initialPixelLevel: Number(e.target.value) }))}
                          className="w-full accent-pink-400" />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>בלתי ניתן לזיהוי</span><span>כמעט ברור</span>
                        </div>
                      </div>

                      {editUploadPct !== null && (
                        <div className="h-2 bg-blush-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blush-400 rounded-full transition-all" style={{ width: `${editUploadPct}%` }} />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(card)} disabled={saving} className="btn-primary flex-1">
                          {saving ? 'שומר...' : '💾 שמור שינויים'}
                        </button>
                        <button onClick={cancelEdit} className="btn-secondary flex-1">ביטול</button>
                      </div>
                    </div>
                  ) : (
                    /* ── Display card ── */
                    <div className="relative rounded-2xl overflow-hidden aspect-square">
                      <img src={card.imageUrl} alt={card.answer} className="w-full h-full object-cover" style={blurStyle(card.initialPixelLevel ?? 0)} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-2">
                        <p className="text-white font-bold text-sm">{card.answer}</p>
                        <p className="text-white/60 text-xs">רמה {card.initialPixelLevel ?? 0}/7</p>
                      </div>
                      <button onClick={() => startEdit(card)} className="absolute top-2 right-2 bg-white/90 text-blush-500 rounded-full w-7 h-7 flex items-center justify-center text-xs">✏️</button>
                      <button onClick={() => deleteWhoAmICard(card.id).then(load)} className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs">✕</button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
