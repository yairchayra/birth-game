import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'

export default function SplashScreen() {
  const navigate    = useNavigate()
  const setSplash   = useAppStore(s => s.setSplashDone)

  useEffect(() => {
    const t = setTimeout(() => {
      setSplash()
      navigate('/home', { replace: true })
    }, 3200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center overflow-hidden relative">
      {/* Decorative blobs */}
      <motion.div
        className="absolute top-10 right-10 w-48 h-48 rounded-full bg-blush-200/40 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-lavender-200/40 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-peach-200/30 blur-3xl"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Logo emoji */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.2 }}
          className="text-8xl"
        >
          🌸
        </motion.div>

        {/* App name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-black text-gradient mb-2 tracking-tight">
            Birth Games
          </h1>
          <p className="text-blush-400 font-medium text-lg">
            משחקים מהלב 💕
          </p>
        </motion.div>

        {/* Loader dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex gap-2 mt-4"
        >
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-blush-300"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}
