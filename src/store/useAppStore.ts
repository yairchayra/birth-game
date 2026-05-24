import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, GameId, GameProgress } from '@/types'

const initialProgress = (): Record<GameId, GameProgress> => ({
  'wordle':    { id: 'wordle',    completed: false, videoWatched: false },
  'who-am-i': { id: 'who-am-i',  completed: false, videoWatched: false },
  'songs':     { id: 'songs',     completed: false, videoWatched: false },
  'luka':      { id: 'luka',      completed: false, videoWatched: false },
})

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      progress:         initialProgress(),
      splashDone:       false,
      currentVideoGame: null,

      setSplashDone: () => set({ splashDone: true }),

      completeGame: (id, score) =>
        set(state => ({
          progress: {
            ...state.progress,
            [id]: { ...state.progress[id], completed: true, score },
          },
        })),

      markVideoWatched: (id) => {
        if (id === 'finale') return
        set(state => ({
          progress: {
            ...state.progress,
            [id]: { ...state.progress[id], videoWatched: true },
          },
        }))
      },

      openVideo:  (gameId) => set({ currentVideoGame: gameId }),
      closeVideo: ()       => set({ currentVideoGame: null }),

      allGamesCompleted: () => {
        const { progress } = get()
        return Object.values(progress).every(p => p.completed)
      },
    }),
    {
      name: 'birth-games-progress',
    }
  )
)
