// MongoDB initialization script for Video Creation Platform

// Switch to the video_creation database
db = db.getSiblingDB('video_creation');

// Create collections with validation schemas

// Video metadata collection
db.createCollection('videometadata', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'title', 'status'],
      properties: {
        userId: {
          bsonType: 'string',
          description: 'User ID is required'
        },
        title: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 255,
          description: 'Title must be a string between 1 and 255 characters'
        },
        script: {
          bsonType: 'string',
          description: 'Video script content'
        },
        status: {
          bsonType: 'string',
          enum: ['draft', 'processing', 'completed', 'published', 'failed'],
          description: 'Status must be one of the predefined values'
        },
        seriesId: {
          bsonType: 'string',
          description: 'Optional series ID'
        },
        duration: {
          bsonType: 'number',
          minimum: 0,
          description: 'Duration in seconds'
        },
        aspectRatio: {
          bsonType: 'string',
          enum: ['16:9', '9:16', '1:1', '4:3'],
          description: 'Video aspect ratio'
        },
        quality: {
          bsonType: 'string',
          enum: ['720p', '1080p', '4K'],
          description: 'Video quality'
        },
        templateId: {
          bsonType: 'string',
          description: 'Template used for video creation'
        },
        media: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              type: {
                bsonType: 'string',
                enum: ['image', 'video', 'audio', 'text']
              },
              url: {
                bsonType: 'string'
              },
              startTime: {
                bsonType: 'number'
              },
              duration: {
                bsonType: 'number'
              },
              position: {
                bsonType: 'object',
                properties: {
                  x: { bsonType: 'number' },
                  y: { bsonType: 'number' },
                  width: { bsonType: 'number' },
                  height: { bsonType: 'number' }
                }
              }
            }
          }
        },
        hashtags: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          }
        },
        videoUrl: {
          bsonType: 'string',
          description: 'URL of the generated video'
        },
        thumbnailUrl: {
          bsonType: 'string',
          description: 'URL of the video thumbnail'
        },
        socialMediaLinks: {
          bsonType: 'object',
          description: 'Links to published social media posts'
        },
        analytics: {
          bsonType: 'object',
          properties: {
            views: { bsonType: 'number' },
            likes: { bsonType: 'number' },
            comments: { bsonType: 'number' },
            shares: { bsonType: 'number' },
            watchTime: { bsonType: 'number' },
            engagement: { bsonType: 'number' }
          }
        },
        aiMetadata: {
          bsonType: 'object',
          properties: {
            topicGenerated: { bsonType: 'bool' },
            scriptGenerated: { bsonType: 'bool' },
            imagesGenerated: { bsonType: 'bool' },
            voiceGenerated: { bsonType: 'bool' },
            hashtagsGenerated: { bsonType: 'bool' },
            processingTime: { bsonType: 'number' },
            tokensUsed: { bsonType: 'number' }
          }
        },
        publishedAt: {
          bsonType: 'date',
          description: 'When the video was published'
        },
        createdAt: {
          bsonType: 'date',
          description: 'When the video was created'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'When the video was last updated'
        }
      }
    }
  }
});

// AI processing jobs collection
db.createCollection('aiprocessingjobs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'jobType', 'status'],
      properties: {
        userId: {
          bsonType: 'string',
          description: 'User ID is required'
        },
        videoId: {
          bsonType: 'string',
          description: 'Associated video ID'
        },
        jobType: {
          bsonType: 'string',
          enum: ['topic_discovery', 'script_generation', 'image_generation', 'voice_generation', 'video_rendering'],
          description: 'Type of AI processing job'
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'processing', 'completed', 'failed'],
          description: 'Job status'
        },
        priority: {
          bsonType: 'number',
          minimum: 1,
          maximum: 10,
          description: 'Job priority (1-10)'
        },
        input: {
          bsonType: 'object',
          description: 'Input data for the job'
        },
        output: {
          bsonType: 'object',
          description: 'Output data from the job'
        },
        error: {
          bsonType: 'string',
          description: 'Error message if job failed'
        },
        processingTime: {
          bsonType: 'number',
          description: 'Time taken to process in milliseconds'
        },
        retryCount: {
          bsonType: 'number',
          minimum: 0,
          description: 'Number of retry attempts'
        },
        scheduledAt: {
          bsonType: 'date',
          description: 'When the job was scheduled'
        },
        startedAt: {
          bsonType: 'date',
          description: 'When the job started processing'
        },
        completedAt: {
          bsonType: 'date',
          description: 'When the job completed'
        },
        createdAt: {
          bsonType: 'date',
          description: 'When the job was created'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'When the job was last updated'
        }
      }
    }
  }
});

// User analytics collection
db.createCollection('useranalytics', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'date'],
      properties: {
        userId: {
          bsonType: 'string',
          description: 'User ID is required'
        },
        date: {
          bsonType: 'date',
          description: 'Analytics date'
        },
        videosCreated: {
          bsonType: 'number',
          minimum: 0
        },
        videosPublished: {
          bsonType: 'number',
          minimum: 0
        },
        totalViews: {
          bsonType: 'number',
          minimum: 0
        },
        totalLikes: {
          bsonType: 'number',
          minimum: 0
        },
        totalComments: {
          bsonType: 'number',
          minimum: 0
        },
        totalShares: {
          bsonType: 'number',
          minimum: 0
        },
        watchTime: {
          bsonType: 'number',
          minimum: 0
        },
        aiTokensUsed: {
          bsonType: 'number',
          minimum: 0
        },
        platformBreakdown: {
          bsonType: 'object',
          properties: {
            youtube: { bsonType: 'object' },
            instagram: { bsonType: 'object' },
            tiktok: { bsonType: 'object' },
            facebook: { bsonType: 'object' }
          }
        }
      }
    }
  }
});

// Media assets collection
db.createCollection('mediaassets', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'type', 'url'],
      properties: {
        userId: {
          bsonType: 'string',
          description: 'User ID is required'
        },
        type: {
          bsonType: 'string',
          enum: ['image', 'video', 'audio', 'font', 'template'],
          description: 'Asset type'
        },
        url: {
          bsonType: 'string',
          description: 'Asset URL'
        },
        filename: {
          bsonType: 'string',
          description: 'Original filename'
        },
        size: {
          bsonType: 'number',
          minimum: 0,
          description: 'File size in bytes'
        },
        mimeType: {
          bsonType: 'string',
          description: 'MIME type of the file'
        },
        dimensions: {
          bsonType: 'object',
          properties: {
            width: { bsonType: 'number' },
            height: { bsonType: 'number' }
          }
        },
        duration: {
          bsonType: 'number',
          description: 'Duration for video/audio assets'
        },
        tags: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          }
        },
        isPublic: {
          bsonType: 'bool',
          description: 'Whether the asset is publicly accessible'
        },
        usageCount: {
          bsonType: 'number',
          minimum: 0,
          description: 'Number of times asset has been used'
        },
        createdAt: {
          bsonType: 'date'
        },
        updatedAt: {
          bsonType: 'date'
        }
      }
    }
  }
});

// Create indexes for better performance

// Video metadata indexes
db.videometadata.createIndex({ userId: 1 });
db.videometadata.createIndex({ status: 1 });
db.videometadata.createIndex({ seriesId: 1 });
db.videometadata.createIndex({ createdAt: -1 });
db.videometadata.createIndex({ publishedAt: -1 });
db.videometadata.createIndex({ userId: 1, status: 1 });
db.videometadata.createIndex({ userId: 1, createdAt: -1 });

// Text search index for video content
db.videometadata.createIndex({
  title: 'text',
  script: 'text',
  hashtags: 'text'
}, {
  weights: {
    title: 10,
    script: 5,
    hashtags: 1
  },
  name: 'video_text_search'
});

// AI processing jobs indexes
db.aiprocessingjobs.createIndex({ userId: 1 });
db.aiprocessingjobs.createIndex({ status: 1 });
db.aiprocessingjobs.createIndex({ jobType: 1 });
db.aiprocessingjobs.createIndex({ scheduledAt: 1 });
db.aiprocessingjobs.createIndex({ priority: -1, createdAt: 1 });
db.aiprocessingjobs.createIndex({ userId: 1, status: 1 });

// User analytics indexes
db.useranalytics.createIndex({ userId: 1 });
db.useranalytics.createIndex({ date: -1 });
db.useranalytics.createIndex({ userId: 1, date: -1 });

// Media assets indexes
db.mediaassets.createIndex({ userId: 1 });
db.mediaassets.createIndex({ type: 1 });
db.mediaassets.createIndex({ tags: 1 });
db.mediaassets.createIndex({ isPublic: 1 });
db.mediaassets.createIndex({ userId: 1, type: 1 });
db.mediaassets.createIndex({ createdAt: -1 });

// Insert sample data for development

// Sample video templates data
db.videometadata.insertMany([
  {
    userId: 'sample-user-1',
    title: 'Sample Explainer Video',
    script: 'This is a sample script for an explainer video about AI technology.',
    status: 'completed',
    duration: 120,
    aspectRatio: '16:9',
    quality: '1080p',
    templateId: 'modern-explainer',
    hashtags: ['AI', 'technology', 'explainer'],
    videoUrl: 'https://example.com/videos/sample1.mp4',
    thumbnailUrl: 'https://example.com/thumbnails/sample1.jpg',
    analytics: {
      views: 1250,
      likes: 89,
      comments: 23,
      shares: 12,
      watchTime: 95000,
      engagement: 7.1
    },
    aiMetadata: {
      topicGenerated: true,
      scriptGenerated: true,
      imagesGenerated: true,
      voiceGenerated: true,
      hashtagsGenerated: true,
      processingTime: 45000,
      tokensUsed: 1200
    },
    createdAt: new Date('2023-12-01T10:00:00Z'),
    updatedAt: new Date('2023-12-01T10:30:00Z'),
    publishedAt: new Date('2023-12-01T11:00:00Z')
  }
]);

// Sample AI processing jobs
db.aiprocessingjobs.insertMany([
  {
    userId: 'sample-user-1',
    videoId: 'sample-video-1',
    jobType: 'script_generation',
    status: 'completed',
    priority: 5,
    input: {
      topic: 'AI in Healthcare',
      duration: 60,
      style: 'educational'
    },
    output: {
      script: 'Generated script content...',
      wordCount: 150
    },
    processingTime: 3500,
    retryCount: 0,
    scheduledAt: new Date('2023-12-01T09:00:00Z'),
    startedAt: new Date('2023-12-01T09:00:05Z'),
    completedAt: new Date('2023-12-01T09:00:08Z'),
    createdAt: new Date('2023-12-01T09:00:00Z'),
    updatedAt: new Date('2023-12-01T09:00:08Z')
  }
]);

// Sample user analytics
db.useranalytics.insertMany([
  {
    userId: 'sample-user-1',
    date: new Date('2023-12-01'),
    videosCreated: 3,
    videosPublished: 2,
    totalViews: 2500,
    totalLikes: 180,
    totalComments: 45,
    totalShares: 28,
    watchTime: 180000,
    aiTokensUsed: 2400,
    platformBreakdown: {
      youtube: { views: 1500, likes: 120, comments: 30 },
      instagram: { views: 800, likes: 45, comments: 12 },
      tiktok: { views: 200, likes: 15, comments: 3 }
    }
  }
]);

// Sample media assets
db.mediaassets.insertMany([
  {
    userId: 'sample-user-1',
    type: 'image',
    url: 'https://example.com/assets/background1.jpg',
    filename: 'background1.jpg',
    size: 2048576,
    mimeType: 'image/jpeg',
    dimensions: {
      width: 1920,
      height: 1080
    },
    tags: ['background', 'technology', 'blue'],
    isPublic: false,
    usageCount: 5,
    createdAt: new Date('2023-11-15T14:30:00Z'),
    updatedAt: new Date('2023-12-01T10:00:00Z')
  },
  {
    userId: 'sample-user-1',
    type: 'audio',
    url: 'https://example.com/assets/background-music.mp3',
    filename: 'background-music.mp3',
    size: 5242880,
    mimeType: 'audio/mpeg',
    duration: 180,
    tags: ['music', 'background', 'upbeat'],
    isPublic: false,
    usageCount: 3,
    createdAt: new Date('2023-11-20T16:45:00Z'),
    updatedAt: new Date('2023-12-01T09:30:00Z')
  }
]);

// Create a function to clean up old completed jobs
db.system.js.save({
  _id: 'cleanupOldJobs',
  value: function(daysOld) {
    var cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (daysOld || 30));
    
    var result = db.aiprocessingjobs.deleteMany({
      status: { $in: ['completed', 'failed'] },
      completedAt: { $lt: cutoffDate }
    });
    
    return result;
  }
});

// Create a function to get user video statistics
db.system.js.save({
  _id: 'getUserVideoStats',
  value: function(userId) {
    return db.videometadata.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$analytics.views' },
          totalLikes: { $sum: '$analytics.likes' }
        }
      }
    ]).toArray();
  }
});

print('MongoDB initialization completed successfully!');
print('Collections created: videometadata, aiprocessingjobs, useranalytics, mediaassets');
print('Indexes created for optimal performance');
print('Sample data inserted for development');
print('Helper functions created: cleanupOldJobs, getUserVideoStats');

