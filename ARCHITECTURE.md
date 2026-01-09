# 🏗️ Blind Music Player - Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Frontend (React + TypeScript)                         │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ Main Page Component (page.tsx)                   │  │ │
│  │  │ - State Management                               │  │ │
│  │  │ - Login Flow Handling                            │  │ │
│  │  │ - Player Initialization                          │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                         ↓                               │ │
│  │  ┌─────────────────┬──────────────────┬──────────────┐ │ │
│  │  │ QRScanner       │ NowPlaying       │ ErrorModal   │ │ │
│  │  │ Component       │ Component        │ Component    │ │ │
│  │  └─────────────────┴──────────────────┴──────────────┘ │ │
│  │                         ↓                               │ │
│  │  Spotify Web Playback SDK (JavaScript)                 │ │
│  │  - Manages browser-based playback                      │ │
│  │  - Communicates with Spotify services                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↑↓
                    HTTP Requests/Responses
                           ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Backend                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ API Routes (Route Handlers)                           │ │
│  │ ┌────────────────────┐      ┌────────────────────┐   │ │
│  │ │ /api/auth/callback │      │ /api/player        │   │ │
│  │ │ - OAuth Code       │      │ - Play Action      │   │ │
│  │ │ - Token Exchange   │      │ - Pause Action     │   │ │
│  │ │ - Secure Comms     │      │ - Skip Action      │   │ │
│  │ └────────────────────┘      └────────────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Data & Utilities                                       │ │
│  │ ┌──────────────────────┐      ┌────────────────────┐  │ │
│  │ │ song-id-mapping.json │      │ spotify.ts (lib)   │  │ │
│  │ │ - QR ID Mappings     │      │ - Auth URL Gen     │  │ │
│  │ │ - Track Lookup       │      │ - Token Helpers    │  │ │
│  │ └──────────────────────┘      └────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↑↓
                    Secure HTTP/HTTPS
                           ↓↑
┌─────────────────────────────────────────────────────────────┐
│              Spotify Web API & Services                     │
│  - OAuth Authorization Server                              │
│  - Web Playback API                                         │
│  - Player Device Management                                │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow: User Login

```
1. User clicks "Login with Spotify"
   ↓
2. Frontend redirects to Spotify OAuth URL with:
   - Client ID
   - Redirect URI
   - Required Scopes
   ↓
3. User logs in and authorizes app on Spotify
   ↓
4. Spotify redirects back with authorization code
   ↓
5. Frontend receives code in URL params
   ↓
6. Frontend calls /api/auth/callback with code
   ↓
7. Backend securely exchanges code for access token using:
   - Client ID
   - Client Secret (never exposed to frontend)
   - Authorization Code
   ↓
8. Backend returns access token to frontend
   ↓
9. Frontend stores token in localStorage
   ↓
10. Spotify Web Playback SDK initializes with token
    ↓
11. Player becomes ready for playback commands
```

## Data Flow: QR Code Scanning

```
1. User clicks "Scan QR Code"
   ↓
2. QRScanner component requests camera access
   ↓
3. Camera feed displays in scanner
   ↓
4. QR Scanner library detects QR code
   ↓
5. Scanned data (e.g., "song01") extracted
   ↓
6. Frontend looks up "song01" in song-id-mapping.json
   → Gets Spotify Track ID (e.g., "3n3Ppam7vgaVa1iaRUc9Lp")
   ↓
7. Frontend calls /api/player with:
   - action: "play"
   - trackUri: "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp"
   - accessToken
   ↓
8. Backend:
   - Fetches available Spotify devices
   - Sends play command to primary device
   ↓
9. Spotify Web Playback SDK or Spotify app starts playing
   ↓
10. NowPlaying component polls current playback state
    ↓
11. UI shows progress bar but NO track details
```

## Component Responsibilities

### `page.tsx` (Main Page Component)
- **Purpose**: Central state management and orchestration
- **Key State**:
  - `playerState`: Login status, player readiness, playback state, errors
  - `showScanner`: Toggle between main view and QR scanner
  - `songMapping`: In-memory cache of song ID mappings
- **Key Functions**:
  - `handleLogin()`: Initiates Spotify OAuth flow
  - `exchangeCodeForToken()`: Processes OAuth callback
  - `handleScan()`: Processes scanned QR codes and plays tracks
  - `handlePause()/handleSkip()`: Playback controls
- **Conditional Rendering**: Shows login → player controls → QR scanner based on state

### `QRScanner.tsx`
- **Purpose**: Camera access and QR code detection
- **Dependencies**: `qr-scanner` library
- **Key Features**:
  - Auto-starts camera on mount
  - Handles camera permission requests
  - Calls `onScan()` callback when code detected
  - Provides pause/resume controls
  - Error handling for camera access failures

### `NowPlaying.tsx`
- **Purpose**: Display playback progress and status
- **Features**:
  - Polls Spotify API every second for current playback state
  - Shows play/pause indicator
  - Progress bar with time markers
  - Formats time (mm:ss)
- **Note**: Never displays track title or artist (blind player concept)

### `ErrorModal.tsx`
- **Purpose**: User-friendly error notifications
- **Features**:
  - Modal overlay with error message
  - Auto-closes after 5 seconds
  - Manual close button
  - Prevents accidental clicks on background

### `spotify.ts` (Utilities Library)
- **Functions**:
  - `generateAuthUrl()`: Creates Spotify OAuth authorization URL
  - `exchangeCodeForToken()`: API call to backend for token exchange
  - `loadSongIdMapping()`: Imports song mapping JSON

### `song-id-mapping.json`
- **Purpose**: Simple database for QR ID → Spotify Track ID mapping
- **Format**: Key-value pairs
- **Example**:
  ```json
  {
    "song01": "3n3Ppam7vgaVa1iaRUc9Lp",
    "song02": "11dFghVo02aNIVRiX3d3Zl"
  }
  ```
- **Extensible**: Add as many songs as needed

## API Routes

### `/api/auth/callback` (POST)
- **Purpose**: Securely exchange authorization code for access token
- **Request**:
  ```json
  { "code": "authorization_code_from_spotify" }
  ```
- **Process**:
  1. Receive authorization code from frontend
  2. Create Base64-encoded client credentials
  3. POST to Spotify token endpoint
  4. Return access token to frontend
- **Security**: Client secret stays on backend only
- **Response**:
  ```json
  {
    "access_token": "token...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": "refresh..."
  }
  ```

### `/api/player` (POST)
- **Purpose**: Control Spotify playback through authenticated requests
- **Actions**:
  - `play`: Start playing a track URI
  - `pause`: Pause current playback
  - `next`: Skip to next track
- **Request**:
  ```json
  {
    "action": "play",
    "trackUri": "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp",
    "accessToken": "token..."
  }
  ```
- **Process**:
  1. Validate access token
  2. Fetch available devices from Spotify
  3. Select primary device
  4. Send playback command to device
- **Response**:
  ```json
  { "success": true }
  ```

## Environment Variables

| Variable | Type | Required | Purpose |
|----------|------|----------|---------|
| `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` | String | ✅ | Public Spotify app ID |
| `SPOTIFY_CLIENT_SECRET` | String | ✅ | Backend-only secret key |
| `NEXT_PUBLIC_REDIRECT_URI` | String | ✅ | OAuth redirect URL |

**Naming Convention**:
- `NEXT_PUBLIC_*`: Exposed to frontend (safe to expose)
- No prefix: Backend-only (secure)

## Security Considerations

1. **Client Secret Protection**: Never sent to frontend
2. **OAuth Flow**: Uses Authorization Code flow (industry standard)
3. **Token Storage**: Kept in browser localStorage
4. **CORS**: Backend APIs only accept requests from authorized frontend
5. **Scopes**: Requests minimum necessary permissions from Spotify

## Performance Optimizations

1. **Song Mapping**: Loaded once at component mount (cached in state)
2. **Playback Polling**: Uses 1-second interval (balance between responsiveness and API calls)
3. **Code Splitting**: React components lazy-loaded as needed
4. **Build Optimization**: Next.js automatic code splitting for routes

## Browser Requirements

- Modern browser with:
  - ES2020+ JavaScript support
  - Camera API (for QR scanner)
  - localStorage support
  - Fetch API

## Testing Checklist

- [ ] OAuth login redirects to Spotify
- [ ] Authorization code exchanged for token
- [ ] Token stored and persists on page reload
- [ ] Spotify player SDK initializes
- [ ] Camera permission request appears
- [ ] QR codes scan successfully
- [ ] Scanned songs play without track info
- [ ] Play/pause controls work
- [ ] Error messages display and auto-close
- [ ] Logout clears state and tokens
