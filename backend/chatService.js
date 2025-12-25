const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || 'us-central1';
const API_ENDPOINT = `https://${LOCATION}-geminidataanalytics.googleapis.com/v1alpha/projects/${PROJECT_ID}/locations/${LOCATION}:queryData`;

async function chatWithData(query, context) {
    try {
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform'
        });
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        // Construct the request body for Conversational Analytics
        // Note: This is a simplified structure based on the API preview. 
        // We might need to adjust based on the exact API definition for "Authored Context".
        const requestBody = {
            query: query,
            // context: context // Pass context if the API supports it in this field
        };

        const response = await axios.post(API_ENDPOINT, requestBody, {
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error querying Conversational Analytics API:', error.response ? error.response.data : error.message);
        throw new Error('Failed to process chat request');
    }
}

module.exports = { chatWithData };
