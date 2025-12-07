const axios = require('axios');

// This is the same URL from your server.js file.
const N8N_AGENT_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/voice-agent';

/**
 * A minimal function to test the connection to the n8n webhook.
 */
async function testN8nWebhook() {
    console.log(`Attempting to send a POST request to: ${N8N_AGENT_WEBHOOK_URL}`);
    
    const testData = {
        text: 'This is a direct test from the test-n8n.js script.'
    };

    try {
        await axios.post(N8N_AGENT_WEBHOOK_URL, testData);
        console.log('--- SUCCESS ---');
        console.log('The test message was sent to n8n successfully!');
        console.log('Check your n8n workflow executions to confirm it was received.');
        console.log('-----------------');
    } catch (error) {
        console.error('--- ERROR CONNECTING TO N8N ---');
        if (error.response) {
            // The request was made and the server responded with a status code that falls out of the range of 2xx
            console.error('n8n server responded with an error.');
            console.error(`Status: ${error.response.status} (${error.response.statusText})`);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response was received from the n8n server.');
            console.error('Troubleshooting: Is the n8n application running? Is the URL correct? Is there a firewall blocking the connection?');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('An error occurred while setting up the request:', error.message);
        }
        console.error('---------------------------------');
    }
}

testN8nWebhook();