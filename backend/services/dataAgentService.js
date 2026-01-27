const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

// Simple in-memory cache for data agents (key: table identifier, value: agent resource name)
const dataAgentCache = new Map();

/**
 * Generate a unique identifier for a set of tables
 */
const generateTableIdentifier = (tableReferences) => {
    const sorted = tableReferences
        .map(t => `${t.projectId}.${t.datasetId}.${t.tableId}`)
        .sort()
        .join('|');
    return Buffer.from(sorted).toString('base64').substring(0, 32).replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Create or get a data agent for the given table references
 * Returns the agent resource name or null if creation fails (will fall back to inline context)
 */
const getOrCreateDataAgent = async (tableReferences, systemInstruction) => {
    try {
        const tableId = generateTableIdentifier(tableReferences);

        // Check cache first
        if (dataAgentCache.has(tableId)) {
            return dataAgentCache.get(tableId);
        }

        const projectId_env = process.env.GOOGLE_CLOUD_PROJECT_ID;
        const location = process.env.GCP_LOCATION || 'europe-west1';
        const agentId = `agent_${tableId.substring(0, 40)}`;

        const bigqueryDataSource = {
            bq: {
                tableReferences: tableReferences
            }
        };

        const agentPayload = {
            name: `projects/${projectId_env}/locations/${location}/dataAgents/${agentId}`,
            description: `Data agent for ${tableReferences.length} table(s)`,
            data_analytics_agent: {
                published_context: {
                    datasourceReferences: bigqueryDataSource,
                    systemInstruction: systemInstruction
                }
            }
        };

        const agentUrl = `https://geminidataanalytics.googleapis.com/v1beta/projects/${projectId_env}/locations/${location}/dataAgents`;

        // Get ADC token
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform'
        });
        const client = await auth.getClient();
        const accessToken = (await client.getAccessToken()).token;

        console.log(`Creating/Retrieving Data Agent for ${tableId}...`);

        try {
            const response = await axios.post(agentUrl, agentPayload, {
                params: { data_agent_id: agentId },
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 || response.status === 201) {
                const agentName = response.data.name || agentPayload.name;
                dataAgentCache.set(tableId, agentName);
                console.log(`Data Agent created: ${agentName}`);
                return agentName;
            }
        } catch (error) {
            // If agent already exists, try to get it
            if (error.response?.status === 409 || error.response?.status === 400) {
                try {
                    const getAgentUrl = `https://geminidataanalytics.googleapis.com/v1beta/projects/${projectId_env}/locations/${location}/dataAgents/${agentId}`;
                    const getResponse = await axios.get(getAgentUrl, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (getResponse.status === 200) {
                        const agentName = getResponse.data.name;
                        dataAgentCache.set(tableId, agentName);
                        console.log(`Data Agent retrieved: ${agentName}`);
                        return agentName;
                    }
                } catch (getError) {
                    console.warn(`Failed to retrieve existing agent: ${getError.message}`);
                }
            } else {
                console.warn(`Failed to create agent: ${error.message}`);
            }
        }
    } catch (error) {
        // Any error - fall back to inline context
        console.log('Data agent creation failed, using inline context:', error.message);
    }

    return null;
};

module.exports = {
    getOrCreateDataAgent,
    generateTableIdentifier
};
