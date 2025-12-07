const recordBtn = document.getElementById('record-btn');
const chatBox = document.getElementById('chat-box');
let currentAudio = null;

// --- WebSocket Setup ---
const socket = new WebSocket(`ws://${window.location.host}`);

socket.onopen = () => {
    console.log('WebSocket connection established');
};

socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'ai-answer-audio') {
        // Remove the "thinking" message before adding the real answer
        const thinkingMessage = document.getElementById('thinking-message');
        if (thinkingMessage) thinkingMessage.remove();

        console.log('Received audio response');
        playAudio(message.data, message.isBase64);
    }
};

socket.onclose = () => {
    console.log('WebSocket connection closed');
    addMessageToChat('Connection lost. Please refresh the page.', 'ai');
};

socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    addMessageToChat('An error occurred with the connection.', 'ai');
};

// --- Speech Recognition Setup ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        recordBtn.textContent = '...';
        recordBtn.classList.add('is-recording');
    };

    recognition.onend = () => {
        recordBtn.textContent = '🎤';
        recordBtn.classList.remove('is-recording');
    };

    recognition.onresult = (event) => {
        const userPrompt = event.results[0][0].transcript;
        addMessageToChat(userPrompt, 'user');
        sendPromptToServer(userPrompt);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        addMessageToChat(`Error: ${event.error}`, 'ai');
    };

} else {
    console.error('Speech Recognition not supported in this browser.');
    recordBtn.disabled = true;
    recordBtn.textContent = '❌';
    addMessageToChat('Sorry, your browser does not support speech recognition.', 'ai');
}

recordBtn.addEventListener('click', () => {
    // Stop any currently playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    
    // If the AI is currently speaking, stop it.
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        return; // Exit the function after stopping speech
    }

    // If not recording, start recognition.
    if (recognition && !recordBtn.classList.contains('is-recording')) {        
        recognition.start();
    }
});

// --- Helper Functions ---

function addMessageToChat(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    messageElement.textContent = text;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the latest message
    return messageElement;
}

function showThinkingIndicator() {
    const thinkingElement = addMessageToChat('...', 'ai');
    thinkingElement.id = 'thinking-message'; // Give it an ID to find and remove it later
    // Optional: Add a class for styling the dots (e.g., with an animation)
    // thinkingElement.classList.add('thinking'); 
}

async function sendPromptToServer(text) {
    // Show the thinking indicator and spinner
    showThinkingIndicator();
    const spinner = document.getElementById('spinner');
    spinner.classList.remove('hidden');
    
    try {
        const response = await fetch('/api/prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        const data = await response.json();
        
        // Hide spinner and remove the thinking indicator
        spinner.classList.add('hidden');
        const thinkingMessage = document.getElementById('thinking-message');
        if (thinkingMessage) thinkingMessage.remove();

        if (!response.ok) {
            addMessageToChat(`Error: ${data.error}`, 'ai');
            return;
        }
        
        // Play the audio response
        if (data.audio) {
            playAudio(data.audio, true); // true indicates it's base64
        } else {
            addMessageToChat('No audio response received.', 'ai');
        }

    } catch (error) {
        console.error('Error sending prompt to server:', error);
        spinner.classList.add('hidden');
        const thinkingMessage = document.getElementById('thinking-message');
        if (thinkingMessage) thinkingMessage.remove();
        addMessageToChat('Could not send your message to the server.', 'ai');
    }
}

function playAudio(audioData, isBase64) {
    try {
        let audioUrl;
        
        if (isBase64) {
            // Create a data URL from base64
            audioUrl = 'data:audio/mpeg;base64,' + audioData;
        } else {
            // Use the URL directly
            audioUrl = audioData;
        }
        
        // Stop any currently playing audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        
        // Create and play audio element
        const audio = new Audio();
        audio.src = audioUrl;
        currentAudio = audio; // Store reference to stop it later
        
        audio.onerror = (e) => {
            console.error('Audio playback error:', e);
            addMessageToChat('Could not play audio response.', 'ai');
        };
        
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
            addMessageToChat('Could not play audio response.', 'ai');
        });
    } catch (error) {
        console.error('Error processing audio:', error);
        addMessageToChat('Could not play audio response.', 'ai');
    }
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
        };
        window.speechSynthesis.speak(utterance);
    } else {
        console.error('Speech Synthesis not supported in this browser.');
    }
}