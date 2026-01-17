const { Firestore } = require('@google-cloud/firestore');

// Initialize Firestore
// This automatically uses Application Default Credentials (ADC)
const firestore = new Firestore({
    // projectId is omitted so it will be auto-detected from the Cloud Run environment (ADC).
    // This allows the code to run correctly in 'new-version-tst-54254020796'.
    databaseId: 'admin-panel'
});

const COLLECTION_NAME = 'access-requests';

/**
 * Access Request Entity Structure:
 * {
 *   id: string,                 // Unique ID (e.g., req_12345)
 *   requesterEmail: string,     // Who requested
 *   assetName: string,          // What resource (e.g. bigquery table name)
 *   gcpProjectId: string,       // The GCP Project ID where the resource lives
 *   requestedRole: string,      // The IAM role requested
 *   justification: string,      // "message" from the frontend
 *   status: 'PENDING' | 'APPROVED' | 'REJECTED',
 *   adminNote: string,          // Optional note
 *   submittedAt: string (ISO),  // Creation time
 *   updatedAt: string (ISO),    // Last update time
 *   reviewedBy: string | null,  // Email of admin who reviewed
 *   reviewedAt: string | null,  // Time of review
 *   projectAdmin: string[],     // List of project admins notified
 * }
 */

/**
 * Create a new access request
 */
const createAccessRequest = async (requestData) => {
    try {
        const docRef = firestore.collection(COLLECTION_NAME).doc(requestData.id);

        // Ensure standard fields
        const newRequest = {
            ...requestData,
            status: 'PENDING',
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            adminNote: '',
            reviewedBy: null,
            reviewedAt: null
        };

        await docRef.set(newRequest);
        return newRequest;
    } catch (error) {
        console.error('Error creating access request in Firestore:', error);
        throw error;
    }
};

/**
 * Get all access requests
 * Can filter by status, project, requester
 */
const getAccessRequests = async (filters = {}) => {
    try {
        let query = firestore.collection(COLLECTION_NAME);

        // Apply filters if provided
        if (filters.status) {
            query = query.where('status', '==', filters.status);
        }
        if (filters.projectId) {
            query = query.where('gcpProjectId', '==', filters.projectId);
        }
        if (filters.requesterEmail) {
            query = query.where('requesterEmail', '==', filters.requesterEmail);
        }

        // Get snapshot
        const snapshot = await query.orderBy('submittedAt', 'desc').get();

        if (snapshot.empty) {
            return [];
        }

        const requests = [];
        snapshot.forEach(doc => {
            requests.push(doc.data());
        });

        return requests;
    } catch (error) {
        console.error('Error fetching access requests from Firestore:', error);
        throw error;
    }
};

/**
 * Get a single access request by ID
 */
const getAccessRequestById = async (id) => {
    try {
        const docRef = firestore.collection(COLLECTION_NAME).doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return null;
        }
        return doc.data();
    } catch (error) {
        console.error(`Error fetching access request ${id}:`, error);
        throw error;
    }
};

/**
 * Update an access request status
 */
const updateAccessRequestStatus = async (id, status, adminNote, reviewerEmail) => {
    try {
        const docRef = firestore.collection(COLLECTION_NAME).doc(id);

        const updateData = {
            status: status,
            updatedAt: new Date().toISOString(),
            reviewedBy: reviewerEmail || 'system',
            reviewedAt: new Date().toISOString()
        };

        if (adminNote) {
            updateData.adminNote = adminNote;
        }

        await docRef.update(updateData);

        // Fetch and return the updated document
        const updatedDoc = await docRef.get();
        return updatedDoc.data();
    } catch (error) {
        console.error(`Error updating access request ${id}:`, error);
        throw error;
    }
};

module.exports = {
    createAccessRequest,
    getAccessRequests,
    getAccessRequestById,
    updateAccessRequestStatus
};
