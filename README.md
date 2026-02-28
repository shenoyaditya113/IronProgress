<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1kxAd5gYoUlV5fBcQkpx3ITKaerKx5g6o

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a local env file (recommended): copy `env.example` → `.env.local` and fill in values
   - `GEMINI_API_KEY` (optional)
   - `VITE_FIREBASE_*` (recommended for Google sign-in + cloud sync)
3. Run the app:
   `npm run dev`

## Firebase setup (Google Auth + Firestore)

1. In Firebase Console → **Authentication** → **Sign-in method**: enable **Google**
2. In Firebase Console → **Firestore Database**: create a database (production or test mode)
3. Add your domain to **Authentication → Settings → Authorized domains** if you’re not using plain `localhost`
4. Firestore security rules (recommended):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/sessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
