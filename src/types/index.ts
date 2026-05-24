// ─── Game Types ────────────────────────────────────────────────────────────────

export type GameId = 'wordle' | 'who-am-i' | 'songs' | 'luka'

export interface GameMeta {
  id:          GameId
  title:       string
  description: string
  emoji:       string
  color:       string
  bgColor:     string
}

export interface GameProgress {
  id:        GameId
  completed: boolean
  score?:    number
  videoWatched: boolean
}

// ─── Wordle ────────────────────────────────────────────────────────────────────

export interface WordleWord {
  id:    string
  word:  string
  order: number
}

export type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'tbd'

export interface WordleGuess {
  letters: { char: string; state: LetterState }[]
}

// ─── Who Am I ─────────────────────────────────────────────────────────────────

export interface WhoAmICard {
  id:          string
  imageUrl:    string
  answer:      string
  hints:       string[]
  order:       number
}

// ─── Songs ────────────────────────────────────────────────────────────────────

export interface Song {
  id:           string
  title:        string
  artist:       string
  lyricClue:    string   // The mangled/translated lyric shown to user
  hints:        string[] // [artist, album art url, spotify link]
  spotifyUrl:   string
  coverUrl:     string
  order:        number
}

// ─── Luka ─────────────────────────────────────────────────────────────────────

export interface LukaNickname {
  id:       string
  nickname: string
  imageUrl: string
  hints:    string[]
  order:    number
}

// ─── Videos ───────────────────────────────────────────────────────────────────

export interface HomeVideo {
  id:           string
  title:        string
  description:  string
  videoUrl:     string
  thumbnailUrl: string
  relatedGame:  GameId | 'finale'
  order:        number
}

// ─── Final Letter ─────────────────────────────────────────────────────────────

export interface FinalLetter {
  id:      string
  content: string
}

// ─── Store ────────────────────────────────────────────────────────────────────

export interface AppState {
  progress:           Record<GameId, GameProgress>
  splashDone:         boolean
  currentVideoGame:   GameId | 'finale' | null
  setSplashDone:      () => void
  completeGame:       (id: GameId, score?: number) => void
  markVideoWatched:   (id: GameId | 'finale') => void
  openVideo:          (gameId: GameId | 'finale') => void
  closeVideo:         () => void
  allGamesCompleted:  () => boolean
}
