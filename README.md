# 🌸 Birth Games — משחקי חדר לידה

אפליקציית React מלאה, מושקעת ו-production ready עבור חדר הלידה.
מבוססת על: React + Vite + TypeScript + TailwindCSS + Framer Motion + Firebase.

---

## 🗂 מבנה הפרויקט

```
src/
├── components/
│   ├── admin/          # רכיבי ניהול אדמין
│   ├── PageWrapper.tsx # עטיפת עמוד עם אנימציה
│   └── VideoModal.tsx  # Modal סרטון מהבית
├── games/
│   ├── Wordle/         # משחק Wordle בעברית
│   ├── WhoAmI/         # זיהוי תמונה מפוקסלת
│   ├── Songs/          # זהי את השיר
│   └── Luka/           # כינויים ללוקה
├── pages/
│   ├── admin/          # כניסת אדמין + dashboard
│   ├── Home.tsx        # מסך בית
│   ├── GameSelect.tsx  # בחירת משחק
│   ├── SplashScreen.tsx
│   └── Finale.tsx      # מסך סיום + מכתב
├── firebase/           # Firebase config
├── services/           # Firebase CRUD
├── store/              # Zustand store
└── types/              # TypeScript types
```

---

## ⚙️ הגדרה ראשונית

### 1. שכפול הריפו

```bash
git clone https://github.com/yairchayra/birth-game.git
cd birth-game
npm install
```

### 2. יצירת פרויקט Firebase

1. כנסו ל-[Firebase Console](https://console.firebase.google.com/)
2. צרו פרויקט חדש
3. הפעילו:
   - **Authentication** → Email/Password
   - **Firestore Database** (Production mode)
   - **Storage**
4. העתיקו את הגדרות ה-Firebase

### 3. הגדרת משתני סביבה

```bash
cp .env.example .env
```

ערכו את `.env`:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_ADMIN_EMAIL=your@email.com
```

### 4. הגדרת Firestore Rules

העתיקו את תוכן `firestore.rules` לקונסול Firebase (Firestore → Rules).
החליפו `REPLACE_WITH_YOUR_ADMIN_EMAIL` באימייל שלכם.

### 5. הגדרת Storage Rules

העתיקו את תוכן `storage.rules` לקונסול Firebase (Storage → Rules).

### 6. יצירת משתמש אדמין

בקונסול Firebase → Authentication → Add user:
- אימייל: `your@email.com`
- סיסמה: (בחרו סיסמה חזקה)

---

## 🚀 הרצה מקומית

```bash
npm run dev
```

פתחו `http://localhost:5173`

---

## 🌐 פריסה ל-GitHub Pages

### הגדרת Secrets ב-GitHub

1. כנסו ל: `https://github.com/yairchayra/birth-game/settings/secrets/actions`
2. הוסיפו כל משתנה מ-`.env` כ-Secret:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_ADMIN_EMAIL`

### הפעלת GitHub Pages

1. כנסו ל: `Settings → Pages`
2. Source: **GitHub Actions**
3. דחפו ל-`main` — ה-workflow יבנה ויפרוס אוטומטית!

האתר יהיה זמין ב: `https://yairchayra.github.io/birth-game/`

---

## 🎮 המשחקים

| משחק | תיאור |
|------|-------|
| 🔤 Wordle | נחשי מילה בעברית תוך 6 ניסיונות |
| 🔍 מי אני? | זהי מי מסתתר בתמונה המפוקסלת |
| 🎵 זהי את השיר | שורה מבולבלת — איזה שיר זה? |
| 🐾 כינויים ללוקה | נחשי את הכינוי של לוקה מהתמונה |

---

## 🗄️ מבנה Firestore

```
wordle_words/     { word, order }
who_am_i/         { imageUrl, answer, hints[], order }
songs/            { title, artist, lyricClue, hints[], spotifyUrl, coverUrl, order }
luka_nicknames/   { nickname, imageUrl, hints[], order }
home_videos/      { title, description, videoUrl, thumbnailUrl, relatedGame, order }
final_letter/     main: { content }
```

---

## 🛠 Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: TailwindCSS + Framer Motion
- **Routing**: React Router v6
- **State**: Zustand (persisted)
- **Backend**: Firebase (Auth + Firestore + Storage)
- **PWA**: vite-plugin-pwa
- **Deploy**: GitHub Actions → GitHub Pages

---

## 💕 נבנה עם אהבה

האפליקציה הזאת נבנתה מאהבה עבור רגע המיוחד ביותר בחיים 🌸
