import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { getFinalLetter } from '@/services/firebase'
import PageWrapper from '@/components/PageWrapper'

const DEFAULT_LETTER = `אהובתי,

רציתי שתדעי שכל רגע בחדר הלידה הזה, אני איתך — גם כשאני לא פיזית לצידך.
האפליקציה הזאת נבנתה מאהבה, רק בשבילך, כדי להכניס קצת קלילות ושמחה לרגעים הכי מיוחדים.

אני כל כך גאה בך. ביכולת שלך, בחוזק שלך, בלב הגדול שלך.
את יולדת חיים חדשים, ואין בעולם שום דבר יפה יותר מזה.

כל צעד, כל נשימה, כל כאב — מובילים אותנו ביחד לרגע שחיכינו לו כל כך הרבה זמן.

אני אוהב אותך מעל ומעבר,
לנצח שלך 💕`

export default function Finale() {
  const navigate   = useNavigate()
  const [letter, setLetter]     = useState<string>(DEFAULT_LETTER)
  const [showLetter, setShowLetter] = useState(false)
  const hasConfetti = useRef(false)

  useEffect(() => {
    getFinalLetter().then(l => { if (l) setLetter(l.content) })
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setShowLetter(true)
      if (!hasConfetti.current) {
        hasConfetti.current = true
        launchConfetti()
      }
    }, 500)
    return () => clearTimeout(t)
  }, [])

  const launchConfetti = () => {
    const colors = ['#f9a8d4', '#d8b4fe', '#fdba74', '#86efac', '#fde68a']
    const end    = Date.now() + 4000

    const frame = () => {
      confetti({
        particleCount: 3,
        angle:         60,
        spread:        55,
        origin:        { x: 0 },
        colors,
      })
      confetti({
        particleCount: 3,
        angle:         120,
        spread:        55,
        origin:        { x: 1 },
        colors,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-hero flex flex-col overflow-hidden relative">
        {/* Background decorations */}
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blush-200/30 blur-3xl"
          animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-lavender-200/30 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />

        <div className="relative z-10 flex flex-col items-center px-5 py-12">
          {/* Trophy */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10, delay: 0.2 }}
            className="text-7xl mb-4"
          >
            🏆
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-black text-gradient text-center mb-2"
          >
            כל הכבוד!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-gray-500 text-center mb-8"
          >
            סיימת את כל המשחקים 🎉
          </motion.p>

          {/* Letter card */}
          <AnimatePresence>
            {showLetter && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1,   y: 0  }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="card w-full max-w-lg p-7 relative"
              >
                <div className="absolute -top-4 right-6 text-3xl">💌</div>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-blush-500 mb-4">
                    מכתב אהבה
                  </h2>
                  <motion.div
                    className="text-gray-700 leading-8 whitespace-pre-line text-base"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 1 }}
                  >
                    {letter}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            onClick={() => navigate('/home')}
            className="btn-secondary mt-8"
          >
            חזרה לבית 🏠
          </motion.button>
        </div>
      </div>
    </PageWrapper>
  )
}
