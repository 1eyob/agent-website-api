# Website Generation API

This endpoint uses OpenAI GPT-4 to refine prompts and initiates website generation for real estate agents.

## Endpoint

**POST** `/api/v1/agent/generate-website`

## Setup

### Environment Variables

Add your OpenAI API key to `.env`:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Database Migration

Run the Prisma migration to create the `WebsiteGenerationJob` table:

```bash
npx prisma migrate dev --name add_website_generation_job
```

## Authentication

This endpoint requires authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Request Body

```json
{
  "subdomain": "john-doe",
  "prompt": "Create a modern real estate website with property listings",
  "agentData": {
    "fullName": "John Doe",
    "bio": "Experienced real estate agent specializing in luxury properties",
    "designStyle": "modern",
    "primaryColor": "#1E40AF",
    "mustHaveFeatures": ["Property Listings", "Contact Form", "Testimonials"],
    "company": "Luxury Realty Inc.",
    "specialRequests": "Include a virtual tour feature"
  }
}
```

## Request Parameters

- `subdomain` (required): The subdomain for the agent's website
- `prompt` (required): The initial prompt describing the website requirements
- `agentData` (optional): Object containing agent information to provide context

## Response

### Success (200)

```json
{
  "success": true,
  "message": "Website generation initiated",
  "subdomain": "john-doe"
}
```

### Error Responses

**401 Unauthorized**

```json
{
  "error": "Authentication required"
}
```

**400 Bad Request**

```json
{
  "error": "Prompt is required"
}
```

or

```json
{
  "error": "Subdomain is required"
}
```

**500 Internal Server Error**

```json
{
  "error": "Failed to generate website"
}
```

## How It Works

1. **Prompt Refinement**: The endpoint uses OpenAI GPT-4 to enhance and optimize the provided prompt
2. **Database Storage**: Creates a `WebsiteGenerationJob` record with status `PENDING`
3. **Subdomain Update**: Updates the agent's subdomain in the database
4. **Manual Processing**: The job is marked for manual processing (can be automated with Lovable API when available)

## Database Schema

### WebsiteGenerationJob Model

```prisma
model WebsiteGenerationJob {
  id        String                     @id @default(cuid())
  createdAt DateTime                   @default(now())
  updatedAt DateTime                   @updatedAt
  agentId   String
  subdomain String
  prompt    String                     @db.Text
  agentData String?                    @db.Text
  status    WebsiteGenerationStatus    @default(PENDING)
  agent     Agent                      @relation(fields: [agentId], references: [id])
}

enum WebsiteGenerationStatus {
  PENDING      // Job created, awaiting processing
  IN_PROGRESS  // Website generation in progress
  COMPLETED    // Website successfully generated
  FAILED       // Generation failed
  CANCELLED    // Job cancelled
}
```

## Usage Example

### Using cURL

```bash
curl -X POST http://localhost:5001/api/v1/agent/generate-website \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "subdomain": "jane-smith",
    "prompt": "Create a stunning real estate website",
    "agentData": {
      "fullName": "Jane Smith",
      "bio": "Top-performing agent in Vermont",
      "designStyle": "elegant",
      "primaryColor": "#2C3E50",
      "mustHaveFeatures": ["Property Search", "Virtual Tours", "Blog"],
      "company": "Smith Realty",
      "specialRequests": "Mobile-first design with dark mode option"
    }
  }'
```

### Using JavaScript/Fetch

```javascript
const response = await fetch(
  "http://localhost:5001/api/v1/agent/generate-website",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({
      subdomain: "jane-smith",
      prompt: "Create a stunning real estate website",
      agentData: {
        fullName: "Jane Smith",
        bio: "Top-performing agent in Vermont",
        designStyle: "elegant",
        primaryColor: "#2C3E50",
        mustHaveFeatures: ["Property Search", "Virtual Tours", "Blog"],
        company: "Smith Realty",
        specialRequests: "Mobile-first design with dark mode option",
      },
    }),
  }
);

const data = await response.json();
console.log(data.message); // "Website generation initiated"
```

## Integration Workflow

1. **Agent fills out form** → Provides subdomain, preferences, and initial prompt
2. **Frontend sends request** → Calls `/api/v1/agent/generate-website` endpoint
3. **Prompt refinement** → OpenAI enhances the prompt for better website generation
4. **Job creation** → System creates a `WebsiteGenerationJob` with status `PENDING`
5. **Manual/Automated processing** → Admin or automated system uses the enhanced prompt with Lovable
6. **Website deployment** → Generated website is deployed to the agent's subdomain

## Future Enhancements

- Direct integration with Lovable API (when available)
- Automated CLI-based website generation
- Webhook notifications on job completion
- Job status tracking endpoint
- Retry mechanism for failed jobs
