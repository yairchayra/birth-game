import {
  collection, doc, getDocs, getDoc, setDoc, addDoc,
  updateDoc, deleteDoc, orderBy, query, Timestamp,
} from 'firebase/firestore'
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from 'firebase/storage'
import { db, storage } from '@/firebase/config'
import type {
  WordleWord, WhoAmICard, Song, LukaNickname, HomeVideo, FinalLetter,
} from '@/types'

// ─── Generic helpers ──────────────────────────────────────────────────────────

async function fetchCollection<T>(col: string): Promise<T[]> {
  const q = query(collection(db, col), orderBy('order', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T))
}

// ─── Wordle ───────────────────────────────────────────────────────────────────

export const getWordleWords    = () => fetchCollection<WordleWord>('wordle_words')
export const addWordleWord     = (data: Omit<WordleWord, 'id'>) =>
  addDoc(collection(db, 'wordle_words'), data)
export const updateWordleWord  = (id: string, data: Partial<WordleWord>) =>
  updateDoc(doc(db, 'wordle_words', id), data)
export const deleteWordleWord  = (id: string) =>
  deleteDoc(doc(db, 'wordle_words', id))

// ─── Who Am I ────────────────────────────────────────────────────────────────

export const getWhoAmICards    = () => fetchCollection<WhoAmICard>('who_am_i')
export const addWhoAmICard     = (data: Omit<WhoAmICard, 'id'>) =>
  addDoc(collection(db, 'who_am_i'), data)
export const updateWhoAmICard  = (id: string, data: Partial<WhoAmICard>) =>
  updateDoc(doc(db, 'who_am_i', id), data)
export const deleteWhoAmICard  = (id: string) =>
  deleteDoc(doc(db, 'who_am_i', id))

// ─── Songs ───────────────────────────────────────────────────────────────────

export const getSongs    = () => fetchCollection<Song>('songs')
export const addSong     = (data: Omit<Song, 'id'>) =>
  addDoc(collection(db, 'songs'), data)
export const updateSong  = (id: string, data: Partial<Song>) =>
  updateDoc(doc(db, 'songs', id), data)
export const deleteSong  = (id: string) =>
  deleteDoc(doc(db, 'songs', id))

// ─── Luka ────────────────────────────────────────────────────────────────────

export const getLukaNicknames   = () => fetchCollection<LukaNickname>('luka_nicknames')
export const addLukaNickname    = (data: Omit<LukaNickname, 'id'>) =>
  addDoc(collection(db, 'luka_nicknames'), data)
export const updateLukaNickname = (id: string, data: Partial<LukaNickname>) =>
  updateDoc(doc(db, 'luka_nicknames', id), data)
export const deleteLukaNickname = (id: string) =>
  deleteDoc(doc(db, 'luka_nicknames', id))

// ─── Home Videos ─────────────────────────────────────────────────────────────

export const getHomeVideos = () => fetchCollection<HomeVideo>('home_videos')

export const addHomeVideo = (data: Omit<HomeVideo, 'id'>) =>
  addDoc(collection(db, 'home_videos'), { ...data, createdAt: Timestamp.now() })

export const updateHomeVideo = (id: string, data: Partial<HomeVideo>) =>
  updateDoc(doc(db, 'home_videos', id), data)

export const deleteHomeVideo = (id: string) =>
  deleteDoc(doc(db, 'home_videos', id))

export const getVideoByGame = async (gameId: string): Promise<HomeVideo | null> => {
  const videos = await getHomeVideos()
  return videos.find(v => v.relatedGame === gameId) ?? null
}

// ─── Final Letter ────────────────────────────────────────────────────────────

export const getFinalLetter = async (): Promise<FinalLetter | null> => {
  const snap = await getDoc(doc(db, 'final_letter', 'main'))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as FinalLetter
}

export const saveFinalLetter = (content: string) =>
  setDoc(doc(db, 'final_letter', 'main'), { content })

// ─── File Upload ─────────────────────────────────────────────────────────────

export const uploadFile = (
  file: File,
  path: string,
  onProgress?: (pct: number) => void
): Promise<string> =>
  new Promise((resolve, reject) => {
    const storageRef = ref(storage, path)
    const task = uploadBytesResumable(storageRef, file)
    task.on(
      'state_changed',
      snap => onProgress && onProgress((snap.bytesTransferred / snap.totalBytes) * 100),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    )
  })

export const deleteFile = (path: string) =>
  deleteObject(ref(storage, path))
