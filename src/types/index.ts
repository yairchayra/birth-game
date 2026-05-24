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
  id:               string
  imageUrl:         string
  answer:           string
  hints:            string[]
  order:            number
  initialPixelLevel?: number  // 0 = most pixelated (default), 6 = nearly clear
}

// ─── Songs ────────────────────────────────────────────────────────────────────

export interface Song {
  id:           string
  title:        string
  artist:       string
  lyricClue:    string    // שמור לתאימות לאחור — שורה ראשונה
  lyricLines:   string[]  // עד 4 שורות, נחשפות הדרגתית
  hints:        string[]  // [artist, album art url, spotify link]
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

// ─── Game Review ──────────────────────────────────────────────────────────────

export interface StageResult {
  stageNum:  number   // 1-based
  answer:    string
  attempts:  number   // wrong guesses (display as attempts+1 if correct)
  hintsUsed: boolean
  correct:   boolean
  detail?:   string   // e.g. "אמן — שם שיר"
}

// ─── Stage Progress (persisted per-game) ──────────────────────────────────────

export interface StageProgressData {
  results: Record<number, StageResult>  // 0-based stageIdx → StageResult
}

// ─── Store ────────────────────────────────────────────────────────────────────

export interface AppState {
  progress:           Record<GameId, GameProgress>
  stageProgress:      Record<GameId, StageProgressData>
  splashDone:         boolean
  currentVideoGame:   GameId | 'finale' | null
  setSplashDone:      () => void
  completeGame:       (id: GameId, score?: number) => void
  markVideoWatched:   (id: GameId | 'finale') => void
  openVideo:          (gameId: GameId | 'finale') => void
  closeVideo:         () => void
  allGamesCompleted:  () => boolean
  resetGame:          (id: GameId) => void
  markStageComplete:  (gameId: GameId, stageIdx: number, result: StageResult) => void
  clearStageProgress: (gameId: GameId) => void
}
