# 🚀 Blind Music Player - Quick Start Guide

## 1️⃣ Setup Environment Variables

### Option A: Using ngrok (Recommended for Phone/Network Access)

1. Get your ngrok authtoken from https://dashboard.ngrok.com/get-started/your-authtoken and configure:
```bash
ngrok authtoken YOUR_AUTHTOKEN
```

2. Copy the example file:
```bash
cp .env.local.example .env.local
```

3. Get your Spotify credentials:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app (if you haven't already)
   - Copy your **Client ID** and **Client Secret**
   - Add redirect URI: `https://your-ngrok-url.ngrok-free.dev/api/auth/callback`

4. Edit `.env.local` with your credentials:
```
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_REDIRECT_URI=https://your-ngrok-url.ngrok-free.dev/api/auth/callback
```

### Option B: Using localhost (Local Machine Only)

1. Copy the example file:
```bash
cp .env.local.example .env.local
```

2. Get your Spotify credentials:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app (if you haven't already)
   - Copy your **Client ID** and **Client Secret**
   - Add redirect URI: `http://localhost:3000/api/auth/callback`

3. Edit `.env.local` with your credentials:
```
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

## 2️⃣ Add Songs to Database

Edit `src/data/song-id-mapping.json` and replace the entries with your songs:

```json
{
  "song01": "spotify_track_id_1",
  "song02": "spotify_track_id_2",
  "song03": "spotify_track_id_3"
}
```

**How to find Spotify Track IDs:**
1. Open Spotify and find a song
2. Right-click the song → Share → Copy Song Link
3. Extract the ID from the URL: `https://open.spotify.com/track/[ID_HERE]`

## 3️⃣ Generate QR Codes

Use a QR code generator to create codes containing your mapping keys:
- `song01`
- `song02`
- `song03`
- etc.

Services: [QR Code Generator](https://www.qr-code-generator.com/), [QRCode.com](https://www.qrcode.com/), or [Segno](https://segno.readthedocs.io/)

## 4️⃣ Start Development Server

### If using ngrok:

In one terminal, start ngrok:
```bash
ngrok http 3000
```

In another terminal, start your app:
```bash
npm run dev
```

Access your app via the ngrok HTTPS URL shown in the ngrok terminal.

### If using localhost:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 5️⃣ Test the App

1. Click **"Login with Spotify"**
2. Authorize the application
3. Make sure Spotify is open on another device (required for playback)
4. Click **"Scan QR Code"**
5. Point your camera at a QR code
6. The song should play without showing track details!

## 📋 File Structure Quick Reference

```
src/
├── app/
│   ├── page.tsx              ← Main app logic
│   └── api/
│       ├── auth/
│       │   └── callback/
│       │       └── route.ts  ← OAuth token exchange
│       └── player/
│           └── route.ts      ← Playback control
├── components/
│   ├── QRScanner.tsx         ← QR scanning UI
│   ├── NowPlaying.tsx        ← Progress display
│   └── ErrorModal.tsx        ← Error notifications
├── data/
│   └── song-id-mapping.json  ← YOUR SONG DATABASE
└── lib/
    └── spotify.ts            ← Utility functions
```

## ⚠️ Important Requirements

- **Spotify Premium account** required for playback
- **Spotify must be open** on another device during playback
- **Camera permissions** needed for QR scanning
- **HTTPS required** for production deployment (QR scanner needs camera)

## 🔧 Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## ❓ Need Help?

Check the [README.md](./README.md) for detailed documentation and troubleshooting.
