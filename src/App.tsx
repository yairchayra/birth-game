import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import SplashScreen from '@/pages/SplashScreen'
import Home from '@/pages/Home'
import GameSelect from '@/pages/GameSelect'
import WordleGame from '@/games/Wordle/WordleGame'
import WhoAmIGame from '@/games/WhoAmI/WhoAmIGame'
import SongsGame from '@/games/Songs/SongsGame'
import LukaGame from '@/games/Luka/LukaGame'
import Finale from '@/pages/Finale'
import AdminLogin from '@/pages/admin/AdminLogin'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import VideoModal from '@/components/VideoModal'

export default function App() {
  const splashDone       = useAppStore(s => s.splashDone)
  const currentVideoGame = useAppStore(s => s.currentVideoGame)

  return (
    <HashRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/"         element={splashDone ? <Navigate to="/home" replace /> : <SplashScreen />} />
          <Route path="/home"     element={<Home />} />
          <Route path="/games"    element={<GameSelect />} />
          <Route path="/wordle"   element={<WordleGame />} />
          <Route path="/who-am-i" element={<WhoAmIGame />} />
          <Route path="/songs"    element={<SongsGame />} />
          <Route path="/luka"     element={<LukaGame />} />
          <Route path="/finale"   element={<Finale />} />
          <Route path="/admin"    element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>

      {/* Global video modal */}
      <AnimatePresence>
        {currentVideoGame && <VideoModal gameId={currentVideoGame} />}
      </AnimatePresence>
    </HashRouter>
  )
}
