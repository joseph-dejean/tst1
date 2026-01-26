const { Firestore } = require('@google-cloud/firestore');

// Lazy Firestore initialization to avoid blocking server startup
// Uses GOOGLE_CLOUD_PROJECT_ID from Cloud Run environment
let firestore = null;
const getFirestore = () => {
    if (!firestore) {
        firestore = new Firestore({
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
        });
    }
    return firestore;
};

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
        const docRef = getFirestore().collection(COLLECTION_NAME).doc(requestData.id);

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
        let query = getFirestore().collection(COLLECTION_NAME);

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

        // Get snapshot (without sorting at DB level to avoid composite index requirement)
        const snapshot = await query.get();

        if (snapshot.empty) {
            return [];
        }

        const requests = [];
        snapshot.forEach(doc => {
            requests.push(doc.data());
        });

        // Sort in memory (newest first)
        requests.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        return requests;
    } catch (error) {
        console.error('ERROR_FETCH_ACCESS_REQUESTS', JSON.stringify({
            message: error.message,
            code: error.code,
            type: error.constructor.name,
            stack: error.stack
        }));
        throw error;
    }
};

/**
 * Get a single access request by ID
 */
const getAccessRequestById = async (id) => {
    try {
        const docRef = getFirestore().collection(COLLECTION_NAME).doc(id);
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
        const docRef = getFirestore().collection(COLLECTION_NAME).doc(id);

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
