const recordBtn = document.getElementById('record-btn');
const chatBox = document.getElementById('chat-box');

// --- WebSocket Setup ---
const socket = new WebSocket(`ws://${window.location.host}`);

socket.onopen = () => {
    console.log('WebSocket connection established');
};

socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'ai-answer') {
        // Remove the "thinking" message before adding the real answer
        const thinkingMessage = document.getElementById('thinking-message');
        if (thinkingMessage) thinkingMessage.remove();

        const aiAnswer = message.data;
        console.log('Received AI answer:', aiAnswer);
        addMessageToChat(aiAnswer, 'ai');
        speakText(aiAnswer);
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
    // Show the thinking indicator immediately
    showThinkingIndicator();
    try {
        const response = await fetch('/api/prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            // If the server failed to forward the prompt (e.g., n8n is down), show an error.
            const thinkingMessage = document.getElementById('thinking-message');
            if (thinkingMessage) thinkingMessage.remove();
            addMessageToChat('Sorry, I could not connect to the AI agent. Please try again later.', 'ai');
        }

    } catch (error) {
        console.error('Error sending prompt to server:', error);
        addMessageToChat('Could not send your message to the server.', 'ai');
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