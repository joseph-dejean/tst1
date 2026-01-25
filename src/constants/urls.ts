const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

export const URLS = {
    API_URL: API_BASE_URL + '/' + API_VERSION,
    APP_CONFIG: '/app-configs',
    ADMIN_CONFIGURE: '/admin/configure',
    CHECK_IAM_ROLE: '/check-iam-role',
    SEARCH: '/search',
    GET_ENTRY: '/get-entry',
    GET_ENTRY_BY_FQN: '/get-entry-by-fqn',
    GET_SAMPLE_DATA: '/get-sample-data',
    BATCH_ASPECTS: '/batch-aspects',
    LINEAGE_SEARCH: '/lineage',
    ENTRY_DATA_QUALITY: '/entry-data-quality',
    GET_DATA_SCAN: '/get-data-scan',
    GET_ALL_DATA_SCANS: '/data-scans',
    GET_ASPECT_DETAIL: '/get-aspect-detail',
    GET_PROCESS_AND_JOB_DETAILS: '/get-process-and-job-details',
    ACCESS_REQUEST: '/access-request',
    GET_PROJECTS: '/get-projects',
    SEND_FEEDBACK: '/send-feedback',
    CHAT: '/chat',
    GET_ASPECT: '/aspect',
    GET_ACCESS_REQUESTS: '/access-requests',
    UPDATE_ACCESS_REQUEST: '/access-request/update',
    GET_ASPECT_TYPES: '/aspect-types',
    LINEAGE_SEARCH_COLUMN_LEVEL: '/lineage-column-level',

    // Admin Role Management
    ADMIN_CHECK: '/admin/check',
    ADMIN_ROLES: '/admin/roles',
    ADMIN_PROJECT_ADMINS: '/admin/project-admins',

    // Access Management
    GRANTED_ACCESSES: '/access/granted',
    ACCESS_BY_ASSET: '/access/asset',
    REVOKE_ACCESS: '/access/revoke',
    BULK_APPROVE: '/access/bulk-approve',
    BULK_REJECT: '/access/bulk-reject',
    ACCESS_STATS: '/access/stats',

    // Notifications
    NOTIFICATIONS: '/notifications',
    NOTIFICATIONS_UNREAD_COUNT: '/notifications/unread-count',
    NOTIFICATIONS_MARK_READ: '/notifications/mark-read',
    NOTIFICATIONS_MARK_ALL_READ: '/notifications/mark-all-read',
}