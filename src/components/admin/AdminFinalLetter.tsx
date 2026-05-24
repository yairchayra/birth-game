import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getFinalLetter, saveFinalLetter } from '@/services/firebase'

export default function AdminFinalLetter() {
  const [content, setContent] = useState('')
  const [loading, setLoad]    = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    getFinalLetter().then(l => {
      if (l) setContent(l.content)
      setLoad(false)
    })
  }, [])

  const save = async () => {
    setSaving(true)
    await saveFinalLetter(content)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  return (
    <div className="card p-5">
      <h2 className="section-title">💌 מכתב הסיום</h2>
      <p className="section-subtitle">המסר שיוצג בסיום כל המשחקים</p>

      {loading ? (
        <div className="text-center py-8 text-2xl animate-pulse">💌</div>
      ) : (
        <div className="flex flex-col gap-4">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={16}
            placeholder="כתבי כאן את המכתב האישי..."
            className="input-field resize-none text-base leading-8"
          />

          <motion.button
            onClick={save}
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            className={`btn-primary transition-all ${saved ? 'bg-green-500 from-green-500 to-green-600' : ''}`}
          >
            {saving ? 'שומר...' : saved ? '✓ נשמר!' : '💾 שמור מכתב'}
          </motion.button>

          <div className="card p-4 bg-blush-50">
            <p className="text-xs text-gray-400 font-medium mb-2">תצוגה מקדימה:</p>
            <div className="text-gray-700 text-sm leading-7 whitespace-pre-line">
              {content || 'כתבי משהו...'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
