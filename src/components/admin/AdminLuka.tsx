import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getLukaNicknames, addLukaNickname, deleteLukaNickname, updateLukaNickname, uploadFile } from '@/services/firebase'
import type { LukaNickname } from '@/types'

export default function AdminLuka() {
  const [cards, setCards]   = useState<LukaNickname[]>([])
  const [form, setForm]     = useState({ nickname: '', hints: '' })
  const [loading, setLoad]  = useState(true)
  const [saving, setSaving] = useState(false)
  const [pct, setPct]       = useState<number | null>(null)
  const fileRef             = useRef<HTMLInputElement>(null)

  // Edit state
  const [editId, setEditId]     = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nickname: '', hints: '' })
  const [editPct, setEditPct]   = useState<number | null>(null)
  const [editPreview, setEditPreview] = useState<string | null>(null)
  const editFileRef = useRef<HTMLInputElement>(null)

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

  const startEdit = (card: LukaNickname) => {
    setEditId(card.id)
    setEditForm({ nickname: card.nickname, hints: (card.hints ?? []).join('\n') })
    setEditPreview(card.imageUrl)
    setEditPct(null)
    if (editFileRef.current) editFileRef.current.value = ''
  }

  const cancelEdit = () => { setEditId(null); setEditPreview(null); setEditPct(null) }

  const saveEdit = async (card: LukaNickname) => {
    if (!editForm.nickname.trim()) return
    setSaving(true)
    try {
      const newFile = editFileRef.current?.files?.[0]
      const imageUrl = newFile
        ? await uploadFile(newFile, `luka/${Date.now()}_${newFile.name}`, p => setEditPct(p))
        : card.imageUrl
      await updateLukaNickname(card.id, {
        imageUrl,
        nickname: editForm.nickname.trim(),
        hints:    editForm.hints.split('\n').filter(Boolean),
      })
      cancelEdit()
      await load()
    } finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5">
        <h2 className="section-title">🐾 כינויים ללוקה</h2>
        <p className="section-subtitle">תמונות AI לכל כינוי</p>

        {/* Add form */}
        <div className="flex flex-col gap-3 mb-5">
          <input ref={fileRef} type="file" accept="image/*" className="input-field text-sm" />
          <input
            type="text" value={form.nickname}
            onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
            placeholder="הכינוי של לוקה" className="input-field"
          />
          <textarea
            value={form.hints}
            onChange={e => setForm(f => ({ ...f, hints: e.target.value }))}
            placeholder="רמזים (שורה לכל רמז)" rows={2} className="input-field resize-none"
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
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {cards.map(card => (
                <motion.div key={card.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  {editId === card.id ? (
                    /* ── Edit panel ── */
                    <div className="card p-4 border-2 border-peach-200 flex flex-col gap-3">
                      <p className="text-sm font-bold text-peach-400">✏️ עריכת כינוי</p>

                      {editPreview && (
                        <div className="rounded-2xl overflow-hidden aspect-square relative bg-gray-100">
                          <img src={editPreview} alt="preview" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <input ref={editFileRef} type="file" accept="image/*" className="input-field text-sm"
                        onChange={e => { const f = e.target.files?.[0]; if (f) setEditPreview(URL.createObjectURL(f)) }} />
                      <p className="text-xs text-gray-400 -mt-1">אם לא תבחרי תמונה חדשה — התמונה הקיימת תישמר</p>

                      <input
                        type="text" value={editForm.nickname}
                        onChange={e => setEditForm(f => ({ ...f, nickname: e.target.value }))}
                        placeholder="הכינוי של לוקה" className="input-field"
                      />
                      <textarea
                        value={editForm.hints}
                        onChange={e => setEditForm(f => ({ ...f, hints: e.target.value }))}
                        placeholder="רמזים (שורה לכל רמז)" rows={2} className="input-field resize-none"
                      />

                      {editPct !== null && (
                        <div className="h-2 bg-peach-100 rounded-full overflow-hidden">
                          <div className="h-full bg-peach-400 rounded-full transition-all" style={{ width: `${editPct}%` }} />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(card)} disabled={saving} className="btn-primary flex-1">
                          {saving ? 'שומר...' : '💾 שמור'}
                        </button>
                        <button onClick={cancelEdit} className="btn-secondary flex-1">ביטול</button>
                      </div>
                    </div>
                  ) : (
                    /* ── Display card (list row, not grid) ── */
                    <div className="flex items-center gap-3 p-3 bg-peach-50 rounded-2xl">
                      <img src={card.imageUrl} alt={card.nickname} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-700 truncate">🐾 {card.nickname}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{(card.hints ?? []).length} רמזים</p>
                      </div>
                      <button onClick={() => startEdit(card)}                    className="text-peach-400 hover:bg-peach-100 rounded-xl p-1.5 flex-shrink-0">✏️</button>
                      <button onClick={() => deleteLukaNickname(card.id).then(load)} className="text-red-400 hover:bg-red-100 rounded-xl p-1.5 flex-shrink-0">🗑️</button>
                    </div>
                  )}
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
