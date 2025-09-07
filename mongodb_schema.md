


_**MongoDB Schema**_

```json
// Video Metadata Collection
{
  "_id": "ObjectId",
  "userId": "ObjectId", // Reference to users collection in PostgreSQL
  "seriesId": "ObjectId", // Reference to series collection in PostgreSQL
  "title": "String",
  "script": "String",
  "status": "String", // e.g., pending, processing, completed, failed
  "media": [
    {
      "type": "String", // image, video, icon
      "url": "String",
      "source": "String" // stock, generated, uploaded
    }
  ],
  "narration": {
    "voice": "String",
    "text": "String",
    "audioUrl": "String"
  },
  "captions": [
    {
      "text": "String",
      "startTime": "Number",
      "endTime": "Number"
    }
  ],
  "backgroundMusic": {
    "style": "String",
    "url": "String"
  },
  "hashtags": ["String"],
  "videoUrl": "String",
  "thumbnailUrl": "String",
  "scheduledAt": "Date",
  "publishedAt": "Date",
  "socialMediaLinks": {
    "youtube": "String",
    "tiktok": "String",
    "instagram": "String"
  },
  "analytics": {
    "views": "Number",
    "likes": "Number",
    "shares": "Number",
    "engagementRate": "Number"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```


