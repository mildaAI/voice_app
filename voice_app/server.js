const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Diagnostic root endpoint. If you see this message in the browser,
 * it means the server is running but there might be an issue with static file serving.
 */
app.get('/', (req, res) => {
  res.send('Server is running. If you see this, check that your `public` folder contains index.html.');
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Store all active WebSocket clients in a Set for efficient management.
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    clients.add(ws);

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// IMPORTANT: Replace with your actual n8n webhook URL
// Using the Production URL is recommended so you don't have to "Listen for Test Event" each time.
const N8N_AGENT_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/voice-agent';

/**
 * Endpoint to receive prompt from the frontend,
 * then trigger the n8n agent webhook.
 */
app.post('/api/prompt', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        console.log(`Received no text`);

        return res.status(400).json({ error: 'Text is required' });
    }

    console.log(`Received prompt: "${text}". Forwarding to n8n...`);

    try {
        // Make sure your n8n webhook is configured to expect a POST request with a JSON body like { "text": "..." }
        // The n8n Response Webhook Node with "respond with binary" will return the binary audio data directly
        const response = await axios.post(N8N_AGENT_WEBHOOK_URL, { text }, { 
            responseType: 'arraybuffer' // Expect binary data from n8n
        });
        console.log('--- PROMPT FORWARDED TO N8N SUCCESSFULLY ---');
        
        // Convert the binary audio data to base64 for sending to the UI
        const audioBase64 = Buffer.from(response.data).toString('base64');
        
        if (!audioBase64 || audioBase64.length === 0) {
            return res.status(500).json({ error: 'No audio data received from n8n' });
        }
        
        // Return the audio response from n8n to the UI
        res.status(200).json({ 
            message: 'Prompt processed successfully',
            audio: audioBase64
        });
    } catch (error) {
        console.error('--- ERROR FORWARDING PROMPT TO N8N ---');
        if (error.response) {
            // The request was made and the server responded with a status code that falls out of the range of 2xx
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
        } else if (error.request) {
            // The request was made but no response was received (e.g., n8n is not running)
            console.error('No response received from n8n. Is the n8n application running?');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error:', error.message);
        }
        console.error('-----------------------------------------');
        res.status(500).json({ error: 'Failed to forward prompt to n8n' });
    }
});

/**
 * Webhook to listen for the answer from the n8n agent.
 * n8n should call this endpoint with the audio file.
 * Expected body: { "audio": "base64-encoded-audio" } or { "audioUrl": "https://..." }
 */
app.post('/api/n8n-answer', (req, res) => {
    const { audio, audioUrl } = req.body;
    
    if (!audio && !audioUrl) {
        return res.status(400).json({ error: 'Audio data or URL is required' });
    }

    console.log(`Received audio response from n8n`);

    // Broadcast the audio to all connected clients.
    const audioData = audio || audioUrl; // Use base64 or URL
    clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify({ 
                type: 'ai-answer-audio', 
                data: audioData,
                isBase64: !!audio,
                isUrl: !!audioUrl
            }));
        }
    });
    res.status(200).json({ message: 'Audio received and broadcast to clients' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));