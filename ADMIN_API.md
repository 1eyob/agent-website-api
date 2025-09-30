# Admin API - Website Generation Jobs

Admin endpoints for managing website generation jobs.

## Base URL

All admin endpoints are prefixed with `/api/v1/admin`

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

> **Note**: Currently uses agent authentication. For production, implement admin-only middleware.

---

## Endpoints

### 1. Get All Website Generation Jobs

**GET** `/api/v1/admin/website-jobs`

Retrieve a paginated list of all website generation jobs.

#### Query Parameters

- `status` (optional): Filter by job status (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `CANCELLED`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

#### Example Request

```bash
curl -X GET "http://localhost:5001/api/v1/admin/website-jobs?status=PENDING&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Success Response (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx123456",
      "createdAt": "2025-09-30T10:11:54.820Z",
      "updatedAt": "2025-09-30T10:11:54.820Z",
      "agentId": "agent-uuid",
      "subdomain": "john-doe",
      "prompt": "Enhanced prompt text...",
      "agentData": "{\"fullName\":\"John Doe\",\"bio\":\"...\"}",
      "status": "PENDING",
      "agent": {
        "id": "agent-uuid",
        "fullName": "John Doe",
        "email": "john@example.com",
        "subdomain": "john-doe",
        "profilePhoto": "/uploads/agents/photo.jpg"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### 2. Get Website Generation Job by ID

**GET** `/api/v1/admin/website-jobs/:id`

Retrieve detailed information about a specific website generation job.

#### Path Parameters

- `id` (required): The job ID

#### Example Request

```bash
curl -X GET "http://localhost:5001/api/v1/admin/website-jobs/clxxx123456" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": "clxxx123456",
    "createdAt": "2025-09-30T10:11:54.820Z",
    "updatedAt": "2025-09-30T10:11:54.820Z",
    "agentId": "agent-uuid",
    "subdomain": "john-doe",
    "prompt": "Create a modern, elegant real estate website for John Doe...",
    "agentData": {
      "fullName": "John Doe",
      "bio": "Experienced real estate agent",
      "designStyle": "modern",
      "primaryColor": "#1E40AF",
      "mustHaveFeatures": ["Property Listings", "Contact Form"],
      "company": "Luxury Realty"
    },
    "status": "PENDING",
    "agent": {
      "id": "agent-uuid",
      "fullName": "John Doe",
      "email": "john@example.com",
      "subdomain": "john-doe",
      "profilePhoto": "/uploads/agents/photo.jpg",
      "phone": "+1234567890",
      "bio": "Experienced real estate agent specializing in luxury properties"
    }
  }
}
```

#### Error Response (404)

```json
{
  "error": "Website generation job not found"
}
```

---

### 3. Update Website Generation Job Status

**PATCH** `/api/v1/admin/website-jobs/:id/status`

Update the status of a website generation job.

#### Path Parameters

- `id` (required): The job ID

#### Request Body

```json
{
  "status": "IN_PROGRESS"
}
```

#### Valid Status Values

- `PENDING` - Job created, awaiting processing
- `IN_PROGRESS` - Website generation in progress
- `COMPLETED` - Website successfully generated
- `FAILED` - Generation failed
- `CANCELLED` - Job cancelled

#### Example Request

```bash
curl -X PATCH "http://localhost:5001/api/v1/admin/website-jobs/clxxx123456/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "COMPLETED"
  }'
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Job status updated successfully",
  "data": {
    "id": "clxxx123456",
    "createdAt": "2025-09-30T10:11:54.820Z",
    "updatedAt": "2025-09-30T12:30:00.000Z",
    "agentId": "agent-uuid",
    "subdomain": "john-doe",
    "prompt": "Enhanced prompt text...",
    "agentData": "{...}",
    "status": "COMPLETED",
    "agent": {
      "id": "agent-uuid",
      "fullName": "John Doe",
      "email": "john@example.com",
      "subdomain": "john-doe"
    }
  }
}
```

#### Error Responses

**400 Bad Request**

```json
{
  "error": "Status is required"
}
```

or

```json
{
  "error": "Invalid status. Must be one of: PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED"
}
```

**404 Not Found**

```json
{
  "error": "Website generation job not found"
}
```

---

### 4. Delete Website Generation Job

**DELETE** `/api/v1/admin/website-jobs/:id`

Delete a website generation job.

#### Path Parameters

- `id` (required): The job ID

#### Example Request

```bash
curl -X DELETE "http://localhost:5001/api/v1/admin/website-jobs/clxxx123456" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Website generation job deleted successfully"
}
```

#### Error Response (404)

```json
{
  "error": "Website generation job not found"
}
```

---

## Usage Examples

### JavaScript/Fetch

#### Get All Jobs

```javascript
const response = await fetch(
  "http://localhost:5001/api/v1/admin/website-jobs?status=PENDING",
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  }
);

const data = await response.json();
console.log(data.data); // Array of jobs
```

#### Get Job by ID

```javascript
const jobId = "clxxx123456";
const response = await fetch(
  `http://localhost:5001/api/v1/admin/website-jobs/${jobId}`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  }
);

const data = await response.json();
console.log(data.data); // Job details
```

#### Update Job Status

```javascript
const jobId = "clxxx123456";
const response = await fetch(
  `http://localhost:5001/api/v1/admin/website-jobs/${jobId}/status`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({
      status: "COMPLETED",
    }),
  }
);

const data = await response.json();
console.log(data.message);
```

#### Delete Job

```javascript
const jobId = "clxxx123456";
const response = await fetch(
  `http://localhost:5001/api/v1/admin/website-jobs/${jobId}`,
  {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  }
);

const data = await response.json();
console.log(data.message);
```

---

## Admin Workflow

1. **View Pending Jobs**: `GET /api/v1/admin/website-jobs?status=PENDING`
2. **Get Job Details**: `GET /api/v1/admin/website-jobs/:id` to see the enhanced prompt and agent data
3. **Mark as In Progress**: `PATCH /api/v1/admin/website-jobs/:id/status` with `status: "IN_PROGRESS"`
4. **Use the prompt in Lovable**: Copy the enhanced prompt from the job details or from the saved file in `prompts/` directory
5. **Mark as Completed**: `PATCH /api/v1/admin/website-jobs/:id/status` with `status: "COMPLETED"`

---

## Files Created

- `src/controller/admin.controller.ts` - Admin controller with job management functions
- `src/routes/admin.route.ts` - Admin route definitions
- `src/server.ts` - Updated to include admin router

---

## Security Note

⚠️ **Important**: The current implementation uses the same authentication as agents. For production:

1. Create an admin-specific authentication middleware
2. Add role-based access control (RBAC)
3. Implement admin user management
4. Add audit logging for admin actions
