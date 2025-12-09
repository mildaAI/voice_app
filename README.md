# Voice AI Assistant

A real-time voice-based AI assistant application that integrates with n8n to process voice commands and return audio responses.

## Features

- 🎤 **Voice Input**: Speech recognition to capture user voice commands
- 🔊 **Audio Output**: Automatic playback of AI-generated audio responses
- ⚡ **Real-time Processing**: Direct integration with n8n webhooks
- 📱 **Responsive UI**: Clean, modern chat interface
- 🔄 **Loading State**: Visual spinner during request processing
- ⏹️ **Audio Control**: Stop ongoing audio playback when recording new commands

## Tech Stack

- **Backend**: Node.js with Express
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **WebSocket**: Real-time communication with clients
- **HTTP Client**: Axios for webhook communication
- **Integration**: n8n webhook-based AI agent

## Project Structure

```
voice_app/
├── server.js           # Express server with WebSocket support
├── package.json        # Dependencies and scripts
├── public/
│   ├── index.html      # Main HTML interface
│   ├── script.js       # Client-side JavaScript logic
│   └── style.css       # Styling
├── .gitignore          # Git ignore configuration
└── README.md           # This file
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voice_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set environment variables**
   Create a `.env` file in the root directory:
   ```
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/voice-agent
   PORT=3000
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

## Usage

1. **Click the microphone button** (🎤) to start recording
2. **Speak your command** - the app will automatically detect when you finish speaking
3. **Wait for processing** - a spinner will appear while the AI processes your request
4. **Listen to the response** - the AI's audio response will automatically play
5. **Record again** - click the button to record another command (this will stop any playing audio)

## API Endpoints

### `/api/prompt` (POST)
Sends a text prompt to the n8n agent and receives audio response.

**Request:**
```json
{
  "text": "User's voice command as text"
}
```

**Response:**
```json
{
  "message": "Prompt processed successfully",
  "audio": "base64-encoded-audio-data"
}
```

### `/api/n8n-answer` (POST)
Alternative webhook endpoint for n8n to send audio responses (uses WebSocket broadcast).

**Request:**
```json
{
  "audio": "base64-encoded-audio" 
}
```

## Configuration

### Environment Variables
- `N8N_WEBHOOK_URL`: The n8n webhook endpoint (default: `http://localhost:5678/webhook/voice-agent`)
- `PORT`: Server port (default: `3000`)

### Browser Requirements
- Chrome, Firefox, Safari, or Edge (modern versions)
- Microphone access permission
- Speakers/Headphones for audio playback

## Features in Detail

### Voice Recognition
- Uses Web Speech API for speech-to-text conversion
- English (en-US) language support
- Automatic speech end detection

### Audio Playback
- Receives base64-encoded audio from server
- Converts to playable audio element
- Supports MP3 format (configurable)

### Real-time Updates
- WebSocket connection for bidirectional communication
- Optional audio broadcasting to multiple clients

### Error Handling
- User-friendly error messages displayed in chat
- Server-side validation and logging
- Network error recovery

## Development

### Run in Development Mode
```bash
npm start
```

### Check for Errors
The app logs important events to the browser console (F12) and server console.

## Troubleshooting

### Audio Not Playing
1. Check browser console (F12) for errors
2. Ensure microphone permissions are granted
3. Verify n8n is running and webhook URL is correct
4. Check that audio format from n8n is valid MP3

### Speech Recognition Not Working
1. Verify browser supports Web Speech API
2. Check microphone permissions
3. Try using Chrome/Edge as they have the best support

### No Response from n8n
1. Check n8n is running on the configured URL
2. Verify webhook endpoint is listening
3. Check server logs for connection errors
4. Ensure "respond with binary" option is enabled in n8n webhook

## Notes

- The app automatically converts n8n's binary audio response to base64 for browser compatibility
- Audio playback stops when a new recording starts
- Chat history is cleared on page refresh (not persisted)
- WebSocket connection is optional; the app works with direct HTTP polling too

## License

MIT
