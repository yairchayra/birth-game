import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getWordleWords, addWordleWord, deleteWordleWord, updateWordleWord } from '@/services/firebase'
import type { WordleWord } from '@/types'

export default function AdminWordle() {
  const [words, setWords]     = useState<WordleWord[]>([])
  const [newWord, setNewWord] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [editId, setEditId]   = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  const load = async () => { setLoading(true); setWords(await getWordleWords()); setLoading(false) }
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!newWord.trim()) return
    setSaving(true)
    await addWordleWord({ word: newWord.trim(), order: words.length })
    setNewWord('')
    await load()
    setSaving(false)
  }

  const del = async (id: string) => {
    await deleteWordleWord(id)
    await load()
  }

  const startEdit = (w: WordleWord) => { setEditId(w.id); setEditVal(w.word) }
  const cancelEdit = () => { setEditId(null); setEditVal('') }

  const saveEdit = async (id: string) => {
    if (!editVal.trim()) return
    setSaving(true)
    await updateWordleWord(id, { word: editVal.trim() })
    cancelEdit()
    await load()
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5">
        <h2 className="section-title">🔤 מילות Wordle</h2>
        <p className="section-subtitle">עד 10 מילים בעברית</p>

        <div className="flex gap-3 mb-5">
          <input
            type="text" value={newWord}
            onChange={e => setNewWord(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="מילה חדשה בעברית..."
            className="input-field flex-1"
          />
          <button onClick={add} disabled={saving} className="btn-primary px-5">
            {saving ? '...' : '+ הוסף'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-300 text-2xl animate-pulse">🔤</div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {words.map((w, i) => (
                <motion.div key={w.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {editId === w.id ? (
                    <div className="flex items-center gap-2 p-3 bg-blush-50 rounded-2xl border border-blush-200">
                      <span className="text-sm text-gray-400 w-5 text-center">{i + 1}</span>
                      <input
                        type="text" value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(w.id); if (e.key === 'Escape') cancelEdit() }}
                        className="input-field flex-1 py-1.5 text-lg font-bold"
                        autoFocus
                      />
                      <button onClick={() => saveEdit(w.id)} disabled={saving} className="btn-primary text-xs px-3 py-1.5">שמור</button>
                      <button onClick={cancelEdit} className="btn-secondary text-xs px-3 py-1.5">ביטול</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-2xl">
                      <span className="text-sm text-gray-400 w-5 text-center">{i + 1}</span>
                      <span className="flex-1 font-bold text-gray-700 text-lg">{w.word}</span>
                      <button onClick={() => startEdit(w)} className="text-blush-400 hover:bg-blush-50 rounded-xl p-1.5 transition-colors">✏️</button>
                      <button onClick={() => del(w.id)}     className="text-red-400 hover:bg-red-100 rounded-xl p-1.5 transition-colors">🗑️</button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {words.length === 0 && <p className="text-center text-gray-300 py-6">אין מילים עדיין</p>}
          </div>
        )}
      </div>
    </div>
  )
}
