# 🎵 Blind Music Player

A Next.js web application that turns your browser into a Spotify-controlled player for playing mystery songs scanned from QR codes.

## Features

- 🔐 Spotify Premium OAuth 2.0 authentication
- 📱 QR code scanning to identify and play songs
- 🎧 Spotify Web Playback SDK integration
- ⏸️ Playback controls (play, pause, skip)
- 📊 Now playing progress display
- 🚨 Error handling with modal dialogs

## Prerequisites

- Node.js 16+ and npm
- Spotify Premium account
- Spotify Developer application credentials

## Setup

### 1. Create a Spotify Developer Application

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application and accept the terms
3. Copy your **Client ID** and **Client Secret**
4. Add a Redirect URI: `http://192.168.2.10:3000` (for local development)

### 2. Clone and Install Dependencies

```bash
cd blind-music-player
npm install
```

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Spotify credentials:
   ```
   NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   NEXT_PUBLIC_REDIRECT_URI=http://192.168.2.10:3000
   ```

### 4. Add Songs to QR Mapping

Edit `src/data/song-id-mapping.json` to add your songs. The format is:
```json
{
  "song01": "spotify_track_id",
  "song02": "another_spotify_track_id"
}
```

To find Spotify Track IDs:
1. Open a song in Spotify
2. Right-click → Copy Spotify URI (e.g., `spotify:track:3n3Ppam7vgaVa1iaRUc9Lp`)
3. Extract the ID after the last colon

### 5. Generate QR Codes

Use any QR code generator to create codes containing the keys from your mapping (e.g., "song01", "song02").

## Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://192.168.2.10:3000](http://192.168.2.10:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## User Flow

1. **Login**: Click "Login with Spotify" and authorize the application
2. **Player Ready**: Wait for the Spotify player to be ready (Spotify must be open on another device)
3. **Scan QR Code**: Click "Scan QR Code" and point your device's camera at a QR code
4. **Play Song**: The app looks up the track ID and plays it without showing details
5. **Controls**: Use Pause to pause, Skip to prepare for the next song

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts          # OAuth token exchange
│   │   └── player/
│   │       └── route.ts              # Spotify playback control
│   ├── page.tsx                      # Main application page
│   └── layout.tsx                    # Root layout
├── components/
│   ├── QRScanner.tsx                 # QR code scanner component
│   ├── ErrorModal.tsx                # Error notification modal
│   └── NowPlaying.tsx                # Progress and playback status
├── lib/
│   └── spotify.ts                    # Spotify utility functions
├── data/
│   └── song-id-mapping.json          # Song ID to Spotify track mapping
├── types/
│   └── index.ts                      # TypeScript interfaces
└── styles/
    └── globals.css                   # Global styles
```

## Required Spotify Scopes

The application requests the following Spotify scopes:
- `streaming` - Control playback
- `user-read-email` - Read email address
- `user-read-private` - Read user profile
- `user-modify-playback-state` - Control playback state
- `user-read-playback-state` - Read playback state

## Important Notes

⚠️ **Spotify Premium Required**: The Web Playback SDK only works with Spotify Premium accounts.

⚠️ **Active Device**: You must have Spotify open on at least one device (desktop, mobile, or web) for the player to work.

⚠️ **Security**: Never commit `.env.local` to version control. The `SPOTIFY_CLIENT_SECRET` should always remain private.

## Troubleshooting

### "Player not ready" Error
- Make sure Spotify is open and active on another device
- Try refreshing the page
- Check that you have a Spotify Premium account

### "No available devices" Error
- Open Spotify on your computer, phone, or web player
- Make sure you're logged into the same Spotify account
- Check your internet connection

### QR Scanner Not Working
- Grant camera permissions when prompted
- Ensure the QR code is clearly visible
- Try moving closer to or adjusting the angle of the QR code

### Track Not Found Error
- Verify the Spotify track ID in `song-id-mapping.json`
- Ensure the track is available in your region
- Check that the QR code contains the correct mapping key

## Technologies Used

- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Spotify Web API** - For playback control
- **Spotify Web Playback SDK** - Browser-based player
- **QR Scanner** - QR code detection library
- **Axios** - HTTP client

## License

MIT

## Support

For issues with Spotify API integration, visit the [Spotify Developer Documentation](https://developer.spotify.com/documentation/web-api/).
