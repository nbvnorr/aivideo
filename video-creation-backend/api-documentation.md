# API Documentation - Autonomous AI Video Creation Platform

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string"
  }
}
```

#### POST /auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string"
  }
}
```

#### GET /auth/profile
Get current user profile (requires authentication).

**Response:**
```json
{
  "id": "number",
  "username": "string",
  "email": "string"
}
```

### Videos

#### POST /videos
Create a new video project.

**Request Body:**
```json
{
  "title": "string",
  "seriesId": "string (optional)",
  "script": "string (optional)",
  "media": [
    {
      "type": "image|video|icon",
      "url": "string",
      "source": "stock|generated|uploaded"
    }
  ],
  "narration": {
    "voice": "string",
    "text": "string",
    "audioUrl": "string"
  },
  "hashtags": ["string"]
}
```

#### GET /videos
Get all videos for the authenticated user.

**Query Parameters:**
- `status`: Filter by status (draft, processing, completed, failed)
- `seriesId`: Filter by series ID
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

#### GET /videos/dashboard-stats
Get dashboard statistics for the authenticated user.

**Response:**
```json
{
  "totalVideos": "number",
  "totalViews": "number",
  "totalLikes": "number",
  "avgEngagement": "number",
  "recentVideos": [
    {
      "title": "string",
      "status": "string",
      "thumbnailUrl": "string",
      "createdAt": "date"
    }
  ],
  "scheduledVideos": [
    {
      "title": "string",
      "scheduledAt": "date"
    }
  ]
}
```

#### GET /videos/:id
Get a specific video by ID.

#### PATCH /videos/:id
Update a video project.

#### DELETE /videos/:id
Delete a video project.

#### POST /videos/:id/generate
Start video generation process.

#### POST /videos/:id/schedule
Schedule a video for publishing.

**Request Body:**
```json
{
  "scheduledAt": "date"
}
```

#### POST /videos/:id/publish
Publish a video to social media platforms.

**Request Body:**
```json
{
  "platforms": ["youtube", "tiktok", "instagram", "facebook"]
}
```

### Series

#### POST /series
Create a new video series.

**Request Body:**
```json
{
  "title": "string",
  "description": "string (optional)",
  "frequency": "daily|weekly|monthly"
}
```

#### GET /series
Get all series for the authenticated user.

#### GET /series/:id
Get a specific series by ID.

#### PATCH /series/:id
Update a series.

#### DELETE /series/:id
Delete a series and all associated videos.

#### POST /series/:id/generate-next
Generate the next video in the series using AI.

#### GET /series/:id/videos
Get all videos in a specific series.

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["Validation error messages"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Access denied",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- Video generation endpoints: 10 requests per hour
- Other endpoints: 100 requests per minute

## WebSocket Events

The platform supports real-time updates via WebSocket connections:

### Events
- `video-processing-started`: Video generation has started
- `video-processing-completed`: Video generation completed successfully
- `video-processing-failed`: Video generation failed
- `series-video-generated`: New video generated for a series
- `social-media-published`: Video published to social media platform

