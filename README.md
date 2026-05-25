# 🌸 Birth Games — משחקי חדר לידה

אפליקציית React PWA מלאה לחדר הלידה — 4 משחקים אישיים, סרטוני הפתעה, ופאנל אדמין מלא לניהול כל התוכן.

מבוססת על: **React 18 · Vite · TypeScript · TailwindCSS · Framer Motion · Firebase · Zustand**

🔗 **Live:** `https://yairchayra.github.io/birth-game/`

---

## 🎮 המשחקים

### 🔤 Wordle בעברית
- לוח ניחוש 6 ניסיונות עם מקלדת עברית מובנית
- צביעת תאים: ירוק (מיקום נכון) / צהוב (קיים במקום אחר) / אפור (לא קיים)
- עד 10 מילים — כל מילה = שלב נפרד עם שמירת התקדמות

### 🔍 מי אני?
- תמונה מטושטשת בגרדיאנט 8 רמות (blur CSS) — מבלתי ניתן לזיהוי עד ברור לחלוטין
- כל ניחוש שגוי מבהיר את התמונה ב-1 רמה אוטומטית
- הגעה לרמה 7 (ברורה לחלוטין) = כישלון אוטומטי
- כפתור "רמז" לחשיפת רמזים טקסטואליים
- הגדרת רמת טשטוש התחלתית לכל תמונה

### 🎵 זהי את השיר
- שורת מילים ממנה צריך לזהות את השיר
- כל ניחוש שגוי חושף שורה נוספת אוטומטית
- 2 רמות רמזים: (1) שם האמן · (2) Spotify embed עם עטיפת אלבום ו-30 שניות האזנה
- שם השיר מוסתר בנגן ספוטיפיי

### 🐾 כינויים ללוקה
- תמונת AI לכל כינוי
- ניחוש חופשי עם רמזים הדרגתיים
- ויתור זמין לאחר 2 ניסיונות כושלים

---

## ✨ תכונות כלליות

### מערכת שלבים
- כל משחק כולל עד 10 שלבים עצמאיים
- **StagePicker** — בורר שלבים ממוספר עם ✅/❌ על כל שלב שנפתר
- כפתורי **הבא / הקודם** בכל שלב
- **התקדמות נשמרת** ב-localStorage — אפשר לצאת ולחזור בלי לאבד שלבים
- מסך סיכום (GameReview) עם ציון, מספר ניסיונות ושימוש ברמזים לכל שלב

### מערכת סרטונים
- לאחר השלמת כל משחק — מודאל סרטון 9:16 (פורמט פורטרט כמו טלפון)
- סרטון הפתעה אישי מהבית לכל משחק
- אחרי כל 4 המשחקים — סרטון פינאלה ומכתב אישי

### ניווט ואיפוס
- כפתור **איפוס** תמיד גלוי לכל משחק במסך הבחירה
- אישור לפני איפוס
- כפתור **חזרה** בכל שלב

---

## 🔐 פאנל אדמין

גישה דרך `/admin` עם Firebase Email/Password Auth.

### ניהול כל סוגי התוכן — הוספה, עריכה, מחיקה:

| טאב | ניהול |
|-----|-------|
| 🔤 Wordle | מילים בעברית — עריכה inline |
| 🔍 מי אני | תמונות + תשובה + רמזים + רמת טשטוש התחלתית. תצוגה מקדימה חיה של הטשטוש בסליידר |
| 🎵 שירים | שם שיר + אמן + עד 4 שורות + Spotify URL. תצוגה מקדימה חיה של נגן ספוטיפיי |
| 🐾 לוקה | תמונה + כינוי + רמזים |
| 🎬 סרטונים | העלאת סרטון לכל משחק + שם + תיאור |
| 💌 מכתב | עורך טקסט עשיר למכתב הסיום |

**כפתור "נסה" בכותרת** — מעבר ישיר למשחקים מבלי להתנתק מהאדמין.

---

## 🗂 מבנה הפרויקט

```
src/
├── components/
│   ├── admin/           # AdminWordle, AdminWhoAmI, AdminSongs, AdminLuka, AdminVideos, AdminFinalLetter
│   ├── GameReview.tsx   # מסך סיכום שלבים
│   ├── StagePicker.tsx  # בורר שלבים ממוספר
│   ├── PageWrapper.tsx  # עטיפת עמוד עם אנימציה
│   └── VideoModal.tsx   # מודאל סרטון פורטרט 9:16
├── games/
│   ├── Wordle/          # WordleGame.tsx
│   ├── WhoAmI/          # WhoAmIGame.tsx
│   ├── Songs/           # SongsGame.tsx
│   └── Luka/            # LukaGame.tsx
├── pages/
│   ├── admin/           # AdminLogin.tsx, AdminDashboard.tsx
│   ├── Home.tsx
│   ├── GameSelect.tsx   # בחירת משחק + כפתור איפוס
│   ├── SplashScreen.tsx
│   └── Finale.tsx       # מסך סיום + מכתב אישי
├── firebase/            # config
├── services/            # Firebase CRUD (getAll / add / update / delete לכל entity)
├── store/               # Zustand + persist (progress, stageProgress, videoState)
└── types/               # TypeScript types
```

---

## 🗄️ מבנה Firestore

```
wordle_words/     { word, order }
who_am_i/         { imageUrl, answer, hints[], initialPixelLevel, order }
songs/            { title, artist, lyricClue, lyricLines[], hints[], spotifyUrl, coverUrl, order }
luka_nicknames/   { nickname, imageUrl, hints[], order }
home_videos/      { title, description, videoUrl, thumbnailUrl, relatedGame, order }
final_letter/     main: { content }
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

### 4. Firestore Rules

העתיקו את תוכן `firestore.rules` לקונסול Firebase (Firestore → Rules).
החליפו `REPLACE_WITH_YOUR_ADMIN_EMAIL` באימייל שלכם.

### 5. Storage Rules

העתיקו את תוכן `storage.rules` לקונסול Firebase (Storage → Rules).

### 6. משתמש אדמין

Firebase Console → Authentication → Add user:
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

### GitHub Secrets

כנסו ל: `Settings → Secrets → Actions` והוסיפו:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_ADMIN_EMAIL
```

### הפעלת Pages

`Settings → Pages → Source: GitHub Actions`

דחיפה ל-`main` תבנה ותפרוס אוטומטית.

**ניתוב SPA:** קובץ `public/404.html` מטפל בניתוב ישיר ל-URLs (כגון שיתוף קישור או PWA installed).

---

## 🛠 Stack

| שכבה | טכנולוגיה |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | TailwindCSS + custom design tokens |
| Animations | Framer Motion |
| Routing | React Router v6 (HashRouter) |
| State | Zustand + persist middleware |
| Backend | Firebase Auth + Firestore + Storage |
| PWA | vite-plugin-pwa (installable, offline-ready) |
| Deploy | GitHub Actions → GitHub Pages |

---

## 💕 נבנה עם אהבה

האפליקציה הזאת נבנתה מאהבה עבור הרגע המיוחד ביותר בחיים 🌸
