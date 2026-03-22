# Dataplex Business User Interface

A web application that helps business users discover, explore, and request access to data assets in **Google Cloud Dataplex Universal Catalog**. Built with React + TypeScript (frontend) and Node.js + Express (backend), deployed as a single container on Cloud Run.

## What It Does

- **Search & Discover** data assets across your Dataplex catalog with natural language and filters
- **AI-Powered Chat** with your data tables using Google Conversational Analytics and Gemini
- **Data Products** browse and explore curated data products
- **Access Requests** workflow with admin approval, email notifications, and optional ServiceNow integration
- **Table Relationships** automatic detection of relationships between tables in a dataset
- **Data Quality** view Data Quality scan results and profiling
- **Data Lineage** visualize upstream/downstream data dependencies
- **Role-Based Access** with super-admin, project-admin, and data-steward roles

## Architecture

```
Browser ──► Cloud Run
             ├── Express Backend (port 8080)
             │    ├── Dataplex Catalog API
             │    ├── BigQuery API
             │    ├── Conversational Analytics API
             │    ├── Vertex AI (Gemini)
             │    ├── Data Lineage API
             │    ├── Cloud Resource Manager / IAM
             │    ├── Firestore (state: requests, notifications, roles)
             │    └── ServiceNow (optional)
             └── React Frontend (served as static files)
```

## Prerequisites

- **Node.js** v20 or later
- A **Google Cloud** project with billing enabled
- The following **APIs enabled**:
  - Dataplex API
  - BigQuery API
  - Cloud Resource Manager API
  - Firestore (Native mode)
  - Vertex AI API (for AI chat)
  - Data Lineage API (for lineage features)
- An **OAuth 2.0 Client ID** (Web application type)

## Quick Start (Local Development)

### 1. Clone and install

```bash
git clone <repository-url>
cd dataplex-business-user-interface

# Frontend dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:
- `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_SECRET` from your OAuth credentials
- `VITE_GOOGLE_PROJECT_ID` / `GOOGLE_CLOUD_PROJECT_ID` — your GCP project
- `GCP_LOCATION` — the region where your Dataplex resources are (e.g., `europe-west1`)
- `SUPER_ADMIN_EMAIL` — the email of the initial admin user

### 3. Authenticate to GCP

```bash
gcloud auth application-default login
```

This gives the backend Application Default Credentials to call GCP APIs.

### 4. Configure OAuth redirect URIs

In the [Google Cloud Console > Auth Clients](https://console.cloud.google.com/auth/clients):
- Add `http://localhost:5173` to **Authorized JavaScript origins**
- Add `http://localhost:5173` and `http://localhost:8080/auth/google/callback` to **Authorized redirect URIs**

### 5. Run the application

```bash
# Terminal 1 — Backend
cd backend
node server.js

# Terminal 2 — Frontend (Vite dev server with hot reload)
npm run dev
```

Open http://localhost:5173. Sign in with your Google account.

### 6. Configure Browse by Aspects (Optional)

Edit `backend/configData.json` to configure aspect types for the browse feature:

```json
{
  "aspectType": {
    "projects/PROJECT_NUMBER/locations/LOCATION/entryGroups/@dataplex/entries/ASPECT_ID_aspectType": [
      "field1",
      "field2"
    ]
  },
  "assets": {},
  "products": []
}
```

To find these values:
1. Go to **GCP Console > Cloud Overview > Dashboard** to get your project number
2. Go to **Dataplex Universal Catalog** and search for your aspect type to get its ID and location

## Deployment to Cloud Run

### Option A: Using Cloud Build (CI/CD)

The repo includes `cloudbuild.yaml` for automated builds. Set up a Cloud Build trigger:

1. **Enable APIs**:
```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  cloudresourcemanager.googleapis.com
```

2. **Create an Artifact Registry repository** (one-time):
```bash
gcloud artifacts repositories create dataplex-ui-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Dataplex Business UI"
```

3. **Create a Cloud Build trigger** in the console pointing to your repo, with substitution variables:
   - `_REGION`: e.g., `us-central1`
   - `_REPO_NAME`: `dataplex-ui-repo`
   - `_APP_NAME`: `dataplex-business-ui`
   - `_SERVICE_NAME`: `dataplex-business-ui`
   - `_ADMIN_EMAIL`: your admin email
   - `_CLIENT_ID`: your OAuth Client ID
   - `_CLIENT_SECRET`: your OAuth Client Secret
   - `_GCP_LOCATION`: region for Dataplex resources (e.g., `europe-west1`)
   - `_GCP_REGION`: same as above

### Option B: Manual deployment

```bash
# 1. Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Build
gcloud builds submit . \
  --tag us-central1-docker.pkg.dev/PROJECT_ID/dataplex-ui-repo/dataplex-ui:latest

# 3. Deploy
gcloud run deploy dataplex-ui \
  --image us-central1-docker.pkg.dev/PROJECT_ID/dataplex-ui-repo/dataplex-ui:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "VITE_API_URL=/api,VITE_API_VERSION=v1,VITE_ADMIN_EMAIL=admin@example.com,VITE_GOOGLE_PROJECT_ID=PROJECT_ID,VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID,VITE_GOOGLE_REDIRECT_URI=/auth/google/callback,GOOGLE_CLOUD_PROJECT_ID=PROJECT_ID,GCP_LOCATION=europe-west1,GCP_REGION=europe-west1,VITE_GOOGLE_CLIENT_SECRET=YOUR_SECRET,SUPER_ADMIN_EMAIL=admin@example.com"
```

4. **Update OAuth redirect URIs** with the Cloud Run URL (e.g., `https://dataplex-ui-xxxxx.run.app`)

### Option C: Using GitHub Actions

The repo includes `.github/workflows/deploy.yml`. Configure these GitHub secrets:
- `GCP_PROJECT_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT`
- `VITE_GOOGLE_CLIENT_SECRET`

## Admin Setup

After deployment, the user specified in `SUPER_ADMIN_EMAIL` automatically has super-admin access.

### Role hierarchy

| Role | Scope | Can do |
|------|-------|--------|
| **Super Admin** | Global | Manage all admins, approve/reject all requests, manage all projects |
| **Project Admin** | Per-project | Approve/reject requests for assigned projects |
| **Data Steward** | Auto-detected | Users who are Data Stewards in Dataplex get admin-like access for their assets |

### Managing admins

Go to **Admin Panel > Role Management** in the UI to:
- Add project admins and assign them to specific projects
- View all admin roles

## Features Guide

### Search
- Type in the search bar to find tables, datasets, and data products
- Results show access status (green check = you have access)
- Click any result to view its details, schema, sample data, and quality scans

### AI Chat
- Open any table and go to the **Chat** tab
- Ask natural language questions about the data (e.g., "What are the top 5 departments by employee count?")
- The AI generates SQL, runs it, and can create charts from the results

### Access Requests
- When you don't have access to a dataset, click **Request Access**
- Provide a justification message
- Admins receive email notifications and can approve/reject with an optional reason
- Once approved, IAM permissions are granted automatically on the GCP project

### Table Relationships
- Open any table and scroll to the **Relationships** section
- Relationships are detected automatically by analyzing column names across all tables in the dataset
- Click any related table to navigate to it

### Data Products
- Browse curated data products in the **Data Products** page
- View all tables contained in a data product
- Request access to data within a product

### Data Quality
- View Data Quality scan results for any table
- See rule pass/fail rates, row-level statistics, and quality scores

## Project Structure

```
dataplex-business-user-interface/
├── backend/
│   ├── server.js              # Express API server (all endpoints)
│   ├── services/              # Business logic services
│   │   ├── accessRequestService.js
│   │   ├── adminService.js
│   │   ├── dataAgentService.js
│   │   ├── datasetRelationshipService.js
│   │   ├── emailService.js
│   │   ├── gcpIamService.js
│   │   ├── grantedAccessService.js
│   │   ├── notificationService.js
│   │   └── serviceNowService.js
│   ├── configData.json        # Browse-by-aspects configuration
│   └── package.json
├── src/                       # React frontend source
│   ├── component/             # UI components
│   ├── features/              # Redux slices
│   ├── services/              # API client functions
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets (images, icons)
├── .env.example               # Environment variable template
├── cloudbuild.yaml            # Cloud Build configuration
├── Dockerfile                 # Multi-stage Docker build
├── entrypoint.sh              # Runtime env var injection
└── vite.config.ts             # Frontend build config
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_PROJECT_ID` | Yes | GCP project ID |
| `GOOGLE_CLOUD_PROJECT_ID` | Yes | GCP project ID (backend) |
| `VITE_GOOGLE_CLIENT_ID` | Yes | OAuth 2.0 Client ID |
| `VITE_GOOGLE_CLIENT_SECRET` | Yes | OAuth 2.0 Client Secret |
| `VITE_GOOGLE_REDIRECT_URI` | Yes | OAuth redirect URI (usually `/auth/google/callback`) |
| `VITE_API_URL` | Yes | API base URL (usually `/api`) |
| `VITE_API_VERSION` | Yes | API version (usually `v1`) |
| `GCP_LOCATION` | Yes | Dataplex resource region (e.g., `europe-west1`) |
| `GCP_REGION` | Yes | Same as GCP_LOCATION |
| `SUPER_ADMIN_EMAIL` | Yes | Initial super-admin email |
| `SMTP_EMAIL` | No | Gmail address for email notifications |
| `SMTP_PASSWORD` | No | Gmail App Password for SMTP |
| `SERVICENOW_INSTANCE_URL` | No | ServiceNow instance for ticket integration |
| `SERVICENOW_USERNAME` | No | ServiceNow API username |
| `SERVICENOW_PASSWORD` | No | ServiceNow API password |

## GCP APIs Used

| API | Purpose |
|-----|---------|
| Dataplex API | Catalog search, entry details, aspects, data products, data scans |
| BigQuery API | Table schemas, sample data, dataset access checks |
| Conversational Analytics API | AI chat with data tables |
| Vertex AI API | Gemini for AI search and chart generation |
| Data Lineage API | Upstream/downstream data flow visualization |
| Cloud Resource Manager API | Project listing, IAM policy management |
| Firestore | Persistent storage for access requests, notifications, admin roles |

## License

ISC License. See [LICENSE](LICENSE) for details.
