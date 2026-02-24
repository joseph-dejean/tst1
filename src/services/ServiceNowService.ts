/**
 * Mock Service for ServiceNow Integration
 * 
 * This service simulates the interaction with ServiceNow API for creating and checking tickets.
 * In a real implementation, this would make HTTP requests to the ServiceNow REST API.
 */

export interface ServiceNowTicket {
    number: string;
    short_description: string;
    state: string;
    sys_id: string;
    opened_at: string;
}

class ServiceNowServiceMock {
    /**
     * Helper to get the current configuration
     */
    getConfig() {
        try {
            const saved = localStorage.getItem('servicenow_integration_config');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Checks if the service is enabled and configured
     */
    isConfigured(): boolean {
        const config = this.getConfig();
        return !!(config && config.enabled && config.instanceUrl);
    }

    /**
     * Creates a new access request ticket in ServiceNow
     */
    async createAccessRequestTicket(userEmail: string, resourceName: string, role: string, _justification: string): Promise<ServiceNowTicket> {
        const config = this.getConfig();
        const instance = config?.instanceUrl || 'https://dev-mock.service-now.com';

        console.log(`[ServiceNow] Connecting to ${instance}...`);
        console.log(`[ServiceNow] Authenticating as ${config?.username || 'mock_user'}...`);
        console.log(`[ServiceNow] Creating ticket for ${userEmail} requesting ${role} on ${resourceName}`);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock response
        return {
            number: `RITM${Math.floor(Math.random() * 1000000)}`,
            short_description: `Access Request: ${role} on ${resourceName}`,
            state: 'New',
            sys_id: `sys_${Math.random().toString(36).substr(2, 9)}`,
            opened_at: new Date().toISOString()
        };
    }

    /**
     * Checks the status of an existing ticket
     */
    async checkTicketStatus(ticketNumber: string): Promise<string> {
        const config = this.getConfig();
        const instance = config?.instanceUrl || 'https://dev-mock.service-now.com';

        console.log(`[ServiceNow] Checking status for ${ticketNumber} on ${instance}`);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const states = ['New', 'In Progress', 'Awaiting Approval', 'Resolved', 'Closed'];
        return states[Math.floor(Math.random() * states.length)];
    }
}

export const ServiceNowService = new ServiceNowServiceMock();
