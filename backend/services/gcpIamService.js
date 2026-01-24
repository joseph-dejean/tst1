const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');

/**
 * Grant an IAM role to a user on a specific project.
 * 
 * @param {string} projectId - The GCP Project ID.
 * @param {string} email - The email of the user or service account.
 * @param {string} role - The IAM role to grant (e.g., 'roles/bigquery.dataViewer').
 */
const grantIamAccess = async (projectId, email, role) => {
    console.log(`Granting IAM access: User=${email}, Role=${role}, Project=${projectId}`);

    try {
        // Use ADC
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform'
        });

        // Initialize Cloud Resource Manager API v1
        const cloudResourceManager = google.cloudresourcemanager({
            version: 'v1',
            auth: auth
        });

        // 1. Get current IAM Policy
        const getResponse = await cloudResourceManager.projects.getIamPolicy({
            resource: projectId,
            requestBody: {}
        });

        const policy = getResponse.data;
        let bindings = policy.bindings || [];
        const member = email.includes(':') ? email : `user:${email}`;

        // 2. Modify Policy
        let roleBinding = bindings.find(b => b.role === role);

        if (roleBinding) {
            // Check if member already exists
            if (!roleBinding.members.includes(member)) {
                roleBinding.members.push(member);
                console.log(`Added ${member} to existing binding for ${role}`);
            } else {
                console.log(`User ${member} already has role ${role}`);
                return true; // Already exists
            }
        } else {
            // Create new binding
            bindings.push({
                role: role,
                members: [member]
            });
            console.log(`Created new binding for ${role} with member ${member}`);
        }

        // 3. Set updated IAM Policy
        const setResponse = await cloudResourceManager.projects.setIamPolicy({
            resource: projectId,
            requestBody: {
                policy: {
                    bindings: bindings,
                    etag: policy.etag
                }
            }
        });

        console.log(`Successfully updated IAM policy for ${projectId}`);
        return true;

    } catch (error) {
        console.error('Error granting IAM access:', error);
        // Throwing error so calling service knows it failed
        throw new Error(`Failed to grant IAM access: ${error.message}`);
    }
};

module.exports = {
    grantIamAccess
};
