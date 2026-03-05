const axios = require('axios');

/**
 * ServiceNow Integration Service (Backend)
 */
class ServiceNowService {
    constructor() {
        this.instanceUrl = process.env.SERVICENOW_INSTANCE_URL;
        this.username = process.env.SERVICENOW_USERNAME;
        this.password = process.env.SERVICENOW_PASSWORD;
        this.auth = this.username && this.password ? {
            username: this.username,
            password: this.password
        } : null;
    }

    isEnabled() {
        return !!(this.instanceUrl && this.auth);
    }

    /**
     * Create a ticket in ServiceNow
     */
    async createTicket(data) {
        if (!this.isEnabled()) {
            console.log('[ServiceNow] Service not configured, skipping ticket creation.');
            return { number: `MOCK-SN-${Date.now()}`, sys_id: 'mock' };
        }

        try {
            const response = await axios.post(
                `${this.instanceUrl}/api/now/table/u_access_request`,
                {
                    u_requester: data.requesterEmail,
                    u_asset_name: data.assetName,
                    u_justification: data.message,
                    short_description: `Dataplex Access: ${data.assetName}`,
                    description: `User ${data.requesterEmail} requested access to ${data.assetName}.\nJustification: ${data.message}`
                },
                { auth: this.auth }
            );

            return {
                number: response.data.result.number,
                sys_id: response.data.result.sys_id
            };
        } catch (error) {
            console.error('[ServiceNow] Error creating ticket:', error.message);
            // Return a mock or throw? For now let's return a placeholder so the flow doesn't break
            return { number: 'ERROR-CREATING-SN', sys_id: 'error' };
        }
    }

    /**
     * Add a comment to a ticket
     */
    async addComment(sysId, comment) {
        if (!this.isEnabled() || sysId === 'mock' || sysId === 'error') return;

        try {
            await axios.put(
                `${this.instanceUrl}/api/now/table/u_access_request/${sysId}`,
                {
                    comments: comment
                },
                { auth: this.auth }
            );
        } catch (error) {
            console.error('[ServiceNow] Error adding comment:', error.message);
        }
    }
}

module.exports = new ServiceNowService();
