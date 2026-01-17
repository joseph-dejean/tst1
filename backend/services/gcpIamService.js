/**
 * Google Cloud IAM Service (Placeholder)
 * 
 * This service will eventually handle the automated provisioning of IAM roles
 * when an access request is approved.
 * 
 * For now, it provides a mock implementation to be integrated into the workflow.
 */

const grantIamAccess = async (projectId, email, role) => {
    console.log(`[MOCK] Granting IAM access: User=${email}, Role=${role}, Project=${projectId}`);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return true to simulate success
    return true;
};

module.exports = {
    grantIamAccess
};
