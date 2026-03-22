# API Reference

All endpoints are prefixed with `/api/v1` unless noted otherwise. Authentication is via `Authorization: Bearer <google_access_token>` header. User email is also passed via `x-user-email` header.

---

## Search & Discovery

### POST `/api/v1/search`
Search the Dataplex catalog with access-level annotations.

**Body:**
| Field | Type | Description |
|-------|------|-------------|
| `query` | string | Search query |
| `pageSize` | number | Results per page (optional) |
| `pageToken` | string | Pagination token (optional) |

**GCP APIs:** Dataplex `CatalogServiceClient.searchEntries()`, Cloud Resource Manager (IAM checks), BigQuery (dataset access checks)

**Response:** `{ results: [{ name, fullyQualifiedName, entryType, hasAccess, ... }], totalSize, pageToken }`

---

### POST `/api/v1/ai-search`
AI-powered semantic search using Gemini to interpret queries and rank results.

**Body:**
| Field | Type | Description |
|-------|------|-------------|
| `query` | string | Natural language query (min 2 chars) |
| `type` | string | `'table'`, `'asset'`, or `'all'` (default) |

**GCP APIs:** Vertex AI (Gemini 2.5 Flash), Dataplex `CatalogServiceClient.searchEntries()`

**Response:** `{ query, intent, searchTerms, results, totalResults }`

---

## Catalog Entries

### GET `/api/v1/get-entry`
Fetch full details for a Dataplex entry.

**Query Params:** `entryName` (string) — full resource name

**GCP APIs:** Dataplex `CatalogServiceClient.getEntry()` with FULL view

---

### POST `/api/v1/get-entry`
Same as above but via POST body: `{ entryName }`

---

### POST `/api/v1/aspects`
Fetch all aspects (metadata) for an entry.

**Body:** `{ entryName }`

**GCP APIs:** Dataplex `CatalogServiceClient.getEntry()` with FULL view

---

### POST `/api/v1/update-entry-aspects`
Update aspects on an entry (contacts, custom metadata).

**Body:** `{ entryName, aspects, updateMask }`

**GCP APIs:** Dataplex `CatalogServiceClient.updateEntry()`

---

### GET `/api/v1/get-entry-by-fqn`
Fetch entry by fully qualified name.

**Query Params:** `fqn` or `entryName`

---

### GET `/api/v1/lookup-entry`
Lookup entry by various identifiers.

---

### POST `/api/v1/batch-aspects`
Fetch aspects for multiple entries.

**Body:** `{ entryNames: string[] }`

---

### GET `/api/v1/get-aspect`
Get aspect for entry with optional type filter.

**Query Params:** `entryName`, `aspectType` (optional)

---

### GET `/api/v1/aspect/:urn`
Get specific aspect by URN.

---

### GET `/api/v1/entry-types`
List all available entry types in Dataplex.

**GCP APIs:** Dataplex `CatalogServiceClient`

---

### GET `/api/v1/aspect-types`
List all available aspect types.

**GCP APIs:** Dataplex `CatalogServiceClient`

---

### GET `/api/v1/tag-templates`
List all Data Catalog tag templates.

**GCP APIs:** `DataCatalogClient.listTagTemplates()`

---

## Data Products

### POST `/api/v1/data-products`
Create a new data product.

**Body:** `{ displayName, description, location, entryGroupId }`

**GCP APIs:** Dataplex `CatalogServiceClient`

---

### POST `/api/v1/data-products/assets`
Associate assets (tables) with a data product.

**Body:** `{ dataProductName, assets: [{ entryName, displayName }] }`

**GCP APIs:** Dataplex `CatalogServiceClient.updateEntry()`

---

## AI Chat

### POST `/api/v1/chat`
Chat with a data table using natural language.

**Body:**
| Field | Type | Description |
|-------|------|-------------|
| `message` | string | User's question |
| `context.fullyQualifiedName` | string | BigQuery table FQN |
| `context.name` | string | Table name |
| `context.schema` | array | Column definitions |
| `context.conversationHistory` | array | Previous messages (optional) |
| `context.isDataProduct` | boolean | If chatting with a data product |
| `context.tables` | array | Tables in the data product |

**GCP APIs:** Google Conversational Analytics API (`geminidataanalytics.googleapis.com`), Vertex AI (Gemini 2.5 Flash) as fallback

**Response:** `{ reply }` — may include SQL, results table, or Vega-Lite chart spec

---

## Data Quality & Scans

### GET `/api/v1/data-scans`
List all data quality scans.

**Query Params:** `project` (optional)

**GCP APIs:** Dataplex `DataScanServiceClient.listDataScans()`

---

### GET `/api/v1/data-quality-scan-jobs/:scanId`
List jobs/runs for a data quality scan.

**GCP APIs:** `DataScanServiceClient.listDataScanJobs()`

---

### POST `/api/v1/entry-data-quality`
Get data quality results for an entry.

**Body:** `{ name, resourceName, parent }`

---

### GET `/api/v1/get-data-scan`
Get details of a specific data scan.

**Query Params:** `name` (resource name)

---

## Data Lineage

### GET `/api/v1/lineage`
BFS traversal for lineage up to specified depth.

**Query Params:** `fqn` (string), `depth` (number, default 3, max 6)

**GCP APIs:** `LineageClient.searchLinks()`

**Response:** `{ relationships: [{ table1, table2, relationship }] }`

---

### POST `/api/v1/lineage`
Get full data lineage for an entry (bidirectional).

**Body:** `{ parent, fqn }`

**GCP APIs:** `LineageClient`

---

### POST `/api/v1/lineage-downstream`
Get downstream lineage only.

**Body:** `{ parent, fqn }`

---

### POST `/api/v1/lineage-upstream`
Get upstream lineage only.

**Body:** `{ parent, fqn }`

---

## Table Relationships

### GET `/api/v1/dataset-relationships`
Get inferred relationships between tables in a BigQuery dataset. Detects FK patterns in column names (e.g., `department_id` -> `department` table) and shared join-key columns across tables.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `project` | string | GCP Project ID |
| `dataset` | string | BigQuery dataset ID |
| `refresh` | string | `'true'` to bypass cache |

**GCP APIs:** `DataCatalogClient.searchCatalog()`, `BigQuery.table().getMetadata()`, `DataScanServiceClient.listDataScans()`, Firestore (cache)

**Response:**
```json
{
  "relationships": [
    { "table1": "department", "table2": "employee", "relationship": "department_id", "confidence": "high" }
  ],
  "nodes": [{ "id": "employee", "label": "employee" }],
  "edges": [...],
  "source": "inferred",
  "tableCount": 4
}
```

---

### POST `/api/v1/dataset-relationships/manual`
Add a user-defined relationship.

**Body:** `{ project, dataset, table1, table2, relationship }`

**GCP APIs:** Firestore

---

### DELETE `/api/v1/dataset-relationships/cache`
Invalidate relationship cache for a dataset.

**Query Params:** `project`, `dataset`

---

## BigQuery Data

### GET `/api/v1/get-sample-data`
Fetch sample rows from a BigQuery table.

**Query Params:** `fqn` (string), additional params as needed

**GCP APIs:** `BigQuery`

---

### GET `/api/v1/accessible-tables`
List all tables the user has access to.

**GCP APIs:** BigQuery, Cloud Resource Manager

---

## Access Requests

### POST `/api/v1/access-request`
Create a new access request.

**Body:**
| Field | Type | Description |
|-------|------|-------------|
| `assetName` | string | Full resource name |
| `linkedResource` | string | Linked BigQuery resource |
| `message` | string | Justification |
| `requesterEmail` | string | Requester's email |
| `projectId` | string | GCP project |
| `projectAdmin` | string[] | Admin emails to notify |
| `assetType` | string | Type of asset |

**Services:** Firestore, Email, ServiceNow (optional), Notifications

---

### GET `/api/v1/access-requests`
Get access requests (filtered by user role).

**Query Params:** `userEmail` (optional, defaults to header)

---

### POST `/api/v1/access-request/update`
Approve or reject a request. Supports dual-approval workflow.

**Body:** `{ requestId, status, adminNote, approverEmail }`

**Services:** Firestore, GCP IAM (grant/revoke), Email, Notifications, ServiceNow

---

### POST `/api/v1/check-access`
Check if user has access to a BigQuery table/dataset.

**Body:** `{ fullyQualifiedName, linkedResource }`

**GCP APIs:** Cloud Resource Manager (IAM)

---

### POST `/api/v1/access/revoke`
Revoke previously granted access.

**Body:** `{ grantId }`

**Services:** GCP IAM (revoke role), Email, Notifications

---

### GET `/api/v1/access/granted`
List all granted accesses.

---

### POST `/api/v1/access/bulk-approve`
Bulk approve multiple requests.

**Body:** `{ requestIds }`

---

### POST `/api/v1/access/bulk-reject`
Bulk reject multiple requests.

**Body:** `{ requestIds, reason }`

---

### GET `/api/v1/access/stats/:projectId`
Access statistics for a project.

**Response:** `{ activeGrants, revokedGrants, uniqueUsers }`

---

## Admin & Roles

### GET `/api/v1/admin/check`
Check if user is admin and get their role.

**Response:** `{ isAdmin, role, assignedProjects }`

Roles are resolved from multiple sources: Firestore > env vars > GCP IAM > Dataplex Data Steward.

---

### GET `/api/v1/admin/roles`
List all admin roles (super-admin only).

---

### POST `/api/v1/admin/roles`
Create/update an admin role.

**Body:** `{ email, role, assignedProjects }`

---

### DELETE `/api/v1/admin/roles/:email`
Remove an admin role.

---

### GET `/api/v1/admin/project-admins/:projectId`
Get admins for a specific project.

---

## Notifications

### GET `/api/v1/notifications`
Get notifications for current user. Polls every 30s from frontend.

---

### GET `/api/v1/notifications/unread-count`
Get unread notification count.

**Response:** `{ unreadCount }`

---

### POST `/api/v1/notifications/mark-read`
Mark notifications as read.

**Body:** `{ notificationIds }`

---

### POST `/api/v1/notifications/mark-all-read`
Mark all as read.

---

### DELETE `/api/v1/notifications/:id`
Delete a notification.

---

## ServiceNow Integration

### GET `/api/v1/servicenow/ticket/:requestId`
Get ServiceNow ticket status for an access request.

---

### GET `/api/v1/servicenow/open-tickets`
List all open ServiceNow tickets.

---

### POST `/api/v1/access-request/webhook`
Webhook for ServiceNow callbacks when ticket state changes.

---

## GCP Projects & IAM

### GET `/api/v1/projects`
List accessible GCP projects.

**GCP APIs:** Cloud Resource Manager `ProjectsClient.listProjects()`

---

### POST `/api/v1/check-iam-role`
Check if user has a specific IAM role.

**Body:** `{ email, role }`

**Response:** `{ hasRole, roles, permissions }`

---

## Health

### GET `/api/health`
Health check.

**Response:** `{ status: 'ok', version: '...' }`

---

## Backend Services

| Service | Storage | GCP APIs | Purpose |
|---------|---------|----------|---------|
| `accessRequestService` | Firestore `access-requests` | — | CRUD for access requests |
| `adminService` | Firestore `admin-roles` | Dataplex (steward check) | Admin role management |
| `gcpIamService` | — | Cloud Resource Manager | Grant/revoke IAM roles |
| `emailService` | — | SMTP (Nodemailer) | Email notifications |
| `grantedAccessService` | Firestore `granted-accesses` | — | Track active/revoked access grants |
| `notificationService` | Firestore `notifications` | — | In-app notifications (30-day TTL) |
| `serviceNowService` | — | ServiceNow REST API | Ticket management |
| `datasetRelationshipService` | Firestore `dataset-relationships` | DataScanServiceClient | Table relationship inference + cache |
| `dataAgentService` | In-memory cache | Conversational Analytics API | Gemini data agent management |

## Firestore Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `access-requests` | Access request records | `requesterEmail`, `assetName`, `status`, `approvals[]` |
| `granted-accesses` | Active/revoked access grants | `userEmail`, `assetName`, `role`, `status` |
| `admin-roles` | Admin role assignments | `email`, `role`, `assignedProjects[]`, `isActive` |
| `notifications` | In-app notifications | `recipientEmail`, `type`, `read`, `expiresAt` |
| `dataset-relationships` | Cached table relationships | `relationships[]`, `cachedAt` (24h TTL) |
