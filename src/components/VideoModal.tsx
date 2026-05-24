import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { getVideoByGame } from '@/services/firebase'
import type { GameId, HomeVideo } from '@/types'

interface Props { gameId: GameId | 'finale' }

export default function VideoModal({ gameId }: Props) {
  const closeVideo     = useAppStore(s => s.closeVideo)
  const markWatched    = useAppStore(s => s.markVideoWatched)
  const allDone        = useAppStore(s => s.allGamesCompleted)()
  const navigate       = useNavigate()
  const videoRef       = useRef<HTMLVideoElement>(null)
  const [video, setVideo] = useState<HomeVideo | null>(null)
  const [loading, setLoading] = useState(true)
  const [ended, setEnded]     = useState(false)

  useEffect(() => {
    getVideoByGame(gameId).then(v => {
      setVideo(v)
      setLoading(false)
    })
  }, [gameId])

  useEffect(() => {
    if (video && videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [video])

  const handleContinue = () => {
    if (gameId !== 'finale') markWatched(gameId as GameId)
    closeVideo()
    if (gameId === 'finale' || allDone) navigate('/finale')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{    scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="relative z-10 w-full max-w-lg mx-4 rounded-3xl overflow-hidden shadow-2xl bg-black"
      >
        {loading ? (
          <div className="aspect-video flex items-center justify-center bg-gradient-hero">
            <div className="flex flex-col items-center gap-3">
              <motion.div
                className="text-5xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🎬
              </motion.div>
              <p className="text-blush-400 font-medium">טוען סרטון...</p>
            </div>
          </div>
        ) : !video ? (
          <div className="aspect-video flex items-center justify-center bg-gradient-hero">
            <div className="text-center px-6">
              <div className="text-5xl mb-3">💕</div>
              <p className="text-gray-600 font-medium">
                הסרטון יהיה כאן בקרוב!
              </p>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={video.videoUrl}
            className="w-full aspect-video object-cover"
            playsInline
            controls
            onEnded={() => setEnded(true)}
          />
        )}

        {/* Info + continue */}
        <div className="bg-white p-5">
          {video && (
            <>
              <h3 className="text-lg font-bold text-gray-700 mb-1">
                {video.title}
              </h3>
              {video.description && (
                <p className="text-sm text-gray-400 mb-4">{video.description}</p>
              )}
            </>
          )}
          {!video && !loading && (
            <p className="text-sm text-gray-400 mb-4">הסרטון יועלה בקרוב 🎥</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleContinue}
              className="btn-primary flex-1"
            >
              {ended || !video ? 'המשך →' : 'דלג וסיים →'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Celebration particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: ['#f9a8d4','#d8b4fe','#fdba74','#86efac'][i % 4],
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale:   [0, 1.5, 0],
              y:       [0, -60 - Math.random() * 60],
            }}
            transition={{
              duration: 1.5 + Math.random(),
              delay:    Math.random() * 0.5,
              repeat:   Infinity,
              repeatDelay: 2 + Math.random() * 2,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
