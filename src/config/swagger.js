import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Pure options object — no require() needed here.
// swaggerJSDoc(swaggerOptions) is called in index.js where require is already set up.
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Beat Circle Prelaunch API',
      version: '2.0.0',
      description: `
## Beat Circle – Founding Member Waitlist API

This API powers the Beat Circle prelaunch waitlist and internal admin dashboard.

### Authentication
Admin routes require a **Bearer JWT token**.
Obtain one via \`POST /api/admin/login\`, then pass it in the header:
\`\`\`
Authorization: Bearer <your_token>
\`\`\`
Tokens expire after **24 hours**.

### Rate Limiting
\`POST /api/waitlist/submit\` is limited to **3 requests per IP per hour**.

### User Types
| Value | Label |
|---|---|
| \`artist\` | 🎤 Artist |
| \`producer\` | 🎛️ Producer |
| \`music_fan\` | 🎧 Music Fan |
| \`brand_investor\` | 💼 Brand / Investor |

### Entry Statuses
| Value | Meaning |
|---|---|
| \`pending\` | Awaiting admin review (default) |
| \`approved\` | Accepted into founding cohort |
| \`rejected\` | Not accepted |
      `,
      contact: { name: 'Beat Circle Team', email: 'hello@beatcircle.app' },
      license: { name: 'ISC' },
    },
    servers: [
      {
        url: '{protocol}://{host}',
        description: 'Dynamic server',
        variables: {
          protocol: { enum: ['https', 'http'], default: 'https' },
          host: { default: 'localhost:5000', description: 'API host' },
        },
      },
    ],
    tags: [
      { name: 'System',            description: 'Health checks and server status' },
      { name: 'Waitlist',          description: 'Public endpoint for joining the waitlist' },
      { name: 'Admin – Auth',      description: 'Admin login and token management' },
      { name: 'Admin – Dashboard', description: 'Aggregated stats and recent activity' },
      { name: 'Admin – Users',     description: 'Full CRUD management of waitlist entries' },
      { name: 'Feedback – Public', description: 'Public endpoints for submitting and viewing reviews' },
      { name: 'Feedback – Admin',  description: 'Moderate, approve, feature, and delete feedback' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT from `POST /api/admin/login`. Expires in 24 h.',
        },
      },
      schemas: {
        WaitlistSubmit: {
          type: 'object',
          required: ['userType', 'fullName', 'email', 'country'],
          properties: {
            userType:     { type: 'string', enum: ['artist','producer','music_fan','brand_investor'], example: 'artist' },
            fullName:     { type: 'string', maxLength: 120, example: 'Tunde Okafor' },
            email:        { type: 'string', format: 'email', example: 'tunde@example.com' },
            stageName:    { type: 'string', maxLength: 80, example: 'T-Smooth', description: 'Recommended for artists & producers' },
            primaryGenre: { type: 'string', example: 'Afrobeats', description: 'Recommended for artists & producers' },
            country:      { type: 'string', example: 'Nigeria' },
            musicLink:    { type: 'string', format: 'uri', example: 'https://soundcloud.com/tsmooth' },
          },
        },
        AdminLogin: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'admin' },
            password: { type: 'string', format: 'password', example: 'YourPassword123' },
          },
        },
        StatusUpdate: {
          type: 'object',
          required: ['status'],
          properties: {
            status:     { type: 'string', enum: ['pending','approved','rejected'], example: 'approved' },
            adminNotes: { type: 'string', maxLength: 1000, example: 'Strong portfolio. Approve for founding batch.' },
          },
        },
        WaitlistEntry: {
          type: 'object',
          properties: {
            _id:          { type: 'string',  example: '665f1a2b3c4d5e6f7a8b9c0d' },
            userType:     { type: 'string',  enum: ['artist','producer','music_fan','brand_investor'] },
            fullName:     { type: 'string',  example: 'Tunde Okafor' },
            email:        { type: 'string',  example: 'tunde@example.com' },
            stageName:    { type: 'string',  example: 'T-Smooth' },
            primaryGenre: { type: 'string',  example: 'Afrobeats' },
            country:      { type: 'string',  example: 'Nigeria' },
            musicLink:    { type: 'string',  example: 'https://soundcloud.com/tsmooth' },
            status:       { type: 'string',  enum: ['pending','approved','rejected'], example: 'pending' },
            adminNotes:   { type: 'string',  example: '' },
            createdAt:    { type: 'string',  format: 'date-time' },
            updatedAt:    { type: 'string',  format: 'date-time' },
          },
        },
        DashboardStats: {
          type: 'object',
          properties: {
            total:    { type: 'integer', example: 128 },
            byType:   {
              type: 'object',
              properties: {
                artist:         { type: 'integer', example: 45 },
                producer:       { type: 'integer', example: 30 },
                music_fan:      { type: 'integer', example: 40 },
                brand_investor: { type: 'integer', example: 13 },
              },
            },
            byStatus: {
              type: 'object',
              properties: {
                pending:  { type: 'integer', example: 80 },
                approved: { type: 'integer', example: 40 },
                rejected: { type: 'integer', example: 8 },
              },
            },
            recentEntries: { type: 'array', items: { $ref: '#/components/schemas/WaitlistEntry' } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 128 },
            page:  { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 25 },
            pages: { type: 'integer', example: 6 },
          },
        },

        FeedbackSubmit: {
          type: 'object',
          required: ['name', 'role', 'country', 'feedback'],
          properties: {
            name:     { type: 'string', maxLength: 120, example: 'Tunde Okafor' },
            role:     { type: 'string', maxLength: 100, example: 'Independent Artist' },
            country:  { type: 'string', example: 'Nigeria' },
            feedback: { type: 'string', maxLength: 2000, example: 'Beat Circle is exactly what the African music scene has been missing!' },
          },
        },

        FeedbackEntry: {
          type: 'object',
          properties: {
            _id:        { type: 'string',  example: '665f1a2b3c4d5e6f7a8b9c0d' },
            name:       { type: 'string',  example: 'Tunde Okafor' },
            role:       { type: 'string',  example: 'Independent Artist' },
            country:    { type: 'string',  example: 'Nigeria' },
            feedback:   { type: 'string',  example: 'Beat Circle is exactly what the African music scene has been missing!' },
            status:     { type: 'string',  enum: ['pending','approved','rejected'], example: 'pending' },
            featured:   { type: 'boolean', example: false },
            adminNotes: { type: 'string',  example: '' },
            createdAt:  { type: 'string',  format: 'date-time' },
            updatedAt:  { type: 'string',  format: 'date-time' },
          },
        },

        PublicReview: {
          type: 'object',
          description: 'A featured, approved feedback entry — safe for public display.',
          properties: {
            _id:      { type: 'string',  example: '665f1a2b3c4d5e6f7a8b9c0d' },
            name:     { type: 'string',  example: 'Tunde Okafor' },
            role:     { type: 'string',  example: 'Independent Artist' },
            country:  { type: 'string',  example: 'Nigeria' },
            feedback: { type: 'string',  example: 'Beat Circle is exactly what the African music scene has been missing!' },
            createdAt:{ type: 'string',  format: 'date-time' },
          },
        },

        SuccessMessage: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string',  example: 'Operation successful' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string',  example: 'Descriptive error message' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Missing or invalid Bearer token',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Unauthorized: no token provided' } } },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'User not found.' } } },
        },
        ServerError: {
          description: 'Internal server error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Internal server error' } } },
        },
        ValidationError: {
          description: 'Request body failed validation',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Missing required fields: email, country' } } },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, '../routes/waitlist.routes.js'),
    path.join(__dirname, '../routes/admin.routes.js'),
    path.join(__dirname, '../routes/feedback.routes.js'),
  ],
};

export default swaggerOptions;