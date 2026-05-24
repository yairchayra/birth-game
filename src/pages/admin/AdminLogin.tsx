import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase/config'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin/dashboard')
    } catch {
      setError('אימייל או סיסמה שגויים')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card w-full max-w-sm p-8"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚙️</div>
          <h1 className="text-2xl font-black text-gray-700">כניסת אדמין</h1>
          <p className="text-sm text-gray-400 mt-1">Birth Games Management</p>
        </div>

        <form onSubmit={login} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="אימייל"
            className="input-field"
            required
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="סיסמה"
            className="input-field"
            required
          />
          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl p-2">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? 'מתחבר...' : 'כניסה →'}
          </button>
        </form>

        <button
          onClick={() => navigate('/home')}
          className="btn-ghost w-full text-center mt-4 text-sm"
        >
          חזרה לאפליקציה
        </button>
      </motion.div>
    </div>
  )
}
