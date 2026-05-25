import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, GameId, GameProgress, StageProgressData } from '@/types'

const initialProgress = (): Record<GameId, GameProgress> => ({
  'wordle':    { id: 'wordle',    completed: false, videoWatched: false },
  'who-am-i': { id: 'who-am-i',  completed: false, videoWatched: false },
  'songs':     { id: 'songs',     completed: false, videoWatched: false },
  'luka':      { id: 'luka',      completed: false, videoWatched: false },
})

const initialStageProgress = (): Record<GameId, StageProgressData> => ({
  'wordle':    { results: {} },
  'who-am-i': { results: {} },
  'songs':     { results: {} },
  'luka':      { results: {} },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initialStageState = (): Record<GameId, Record<number, any>> => ({
  'wordle':    {},
  'who-am-i': {},
  'songs':     {},
  'luka':      {},
})

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      progress:         initialProgress(),
      stageProgress:    initialStageProgress(),
      stageState:       initialStageState(),
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

      resetGame: (id) =>
        set(state => ({
          progress: {
            ...state.progress,
            [id]: { id, completed: false, videoWatched: false },
          },
          stageProgress: {
            ...state.stageProgress,
            [id]: { results: {} },
          },
          stageState: {
            ...state.stageState,
            [id]: {},
          },
        })),

      allGamesCompleted: () => {
        const { progress } = get()
        return Object.values(progress).every(p => p.completed)
      },

      markStageComplete: (gameId, stageIdx, result) =>
        set(state => ({
          stageProgress: {
            ...state.stageProgress,
            [gameId]: {
              results: {
                ...(state.stageProgress[gameId]?.results ?? {}),
                [stageIdx]: result,
              },
            },
          },
        })),

      clearStageProgress: (gameId) =>
        set(state => ({
          stageProgress: {
            ...state.stageProgress,
            [gameId]: { results: {} },
          },
        })),

      saveStageState: (gameId, stageIdx, state) =>
        set(prev => ({
          stageState: {
            ...prev.stageState,
            [gameId]: {
              ...prev.stageState[gameId],
              [stageIdx]: state,
            },
          },
        })),

      clearGameStageState: (gameId) =>
        set(state => ({
          stageState: {
            ...state.stageState,
            [gameId]: {},
          },
        })),
    }),
    {
      name: 'birth-games-progress',
    }
  )
)
