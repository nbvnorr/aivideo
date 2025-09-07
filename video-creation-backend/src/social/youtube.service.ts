import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiConfiguration } from '../users/api-configuration.entity';
import axios from 'axios';

export interface YouTubeUploadOptions {
  title: string;
  description: string;
  tags: string[];
  categoryId?: string;
  privacy: 'private' | 'public' | 'unlisted';
  thumbnailPath?: string;
  scheduledPublishTime?: Date;
}

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  status: string;
}

@Injectable()
export class YouTubeService {
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(
    @InjectRepository(ApiConfiguration)
    private apiConfigRepository: Repository<ApiConfiguration>,
  ) {}

  private async getAccessToken(userId: number): Promise<string> {
    const config = await this.apiConfigRepository.findOne({
      where: { user_id: userId, service_name: 'YouTube' },
    });

    if (!config) {
      throw new Error('YouTube API credentials not configured');
    }

    // In a real implementation, you would handle OAuth2 token refresh
    return config.api_key;
  }

  async uploadVideo(
    userId: number,
    videoPath: string,
    options: YouTubeUploadOptions
  ): Promise<{ videoId: string; url: string }> {
    const accessToken = await this.getAccessToken(userId);

    // Step 1: Initialize upload
    const metadata = {
      snippet: {
        title: options.title,
        description: options.description,
        tags: options.tags,
        categoryId: options.categoryId || '22', // People & Blogs
      },
      status: {
        privacyStatus: options.privacy,
        publishAt: options.scheduledPublishTime?.toISOString(),
      },
    };

    try {
      // In a real implementation, you would use the YouTube Data API v3
      // This is a simplified mock implementation
      const uploadResponse = await this.mockYouTubeUpload(metadata, videoPath);

      // Step 2: Upload thumbnail if provided
      if (options.thumbnailPath) {
        await this.uploadThumbnail(userId, uploadResponse.videoId, options.thumbnailPath);
      }

      return {
        videoId: uploadResponse.videoId,
        url: `https://www.youtube.com/watch?v=${uploadResponse.videoId}`,
      };
    } catch (error) {
      console.error('YouTube upload failed:', error);
      throw new Error(`YouTube upload failed: ${error.message}`);
    }
  }

  async uploadThumbnail(
    userId: number,
    videoId: string,
    thumbnailPath: string
  ): Promise<void> {
    const accessToken = await this.getAccessToken(userId);

    // Mock thumbnail upload
    console.log(`Uploading thumbnail for video ${videoId} from ${thumbnailPath}`);
  }

  async updateVideo(
    userId: number,
    videoId: string,
    updates: Partial<YouTubeUploadOptions>
  ): Promise<void> {
    const accessToken = await this.getAccessToken(userId);

    const updateData = {
      id: videoId,
      snippet: {},
      status: {},
    };

    if (updates.title) updateData.snippet['title'] = updates.title;
    if (updates.description) updateData.snippet['description'] = updates.description;
    if (updates.tags) updateData.snippet['tags'] = updates.tags;
    if (updates.privacy) updateData.status['privacyStatus'] = updates.privacy;

    try {
      await axios.put(`${this.baseUrl}/videos`, updateData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        params: {
          part: 'snippet,status',
        },
      });
    } catch (error) {
      console.error('YouTube video update failed:', error);
      throw new Error(`YouTube video update failed: ${error.message}`);
    }
  }

  async getVideoInfo(userId: number, videoId: string): Promise<YouTubeVideoInfo> {
    const accessToken = await this.getAccessToken(userId);

    try {
      const response = await axios.get(`${this.baseUrl}/videos`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params: {
          part: 'snippet,statistics,status,contentDetails',
          id: videoId,
        },
      });

      const video = response.data.items[0];
      if (!video) {
        throw new Error('Video not found');
      }

      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        thumbnailUrl: video.snippet.thumbnails.high.url,
        viewCount: parseInt(video.statistics.viewCount || '0'),
        likeCount: parseInt(video.statistics.likeCount || '0'),
        commentCount: parseInt(video.statistics.commentCount || '0'),
        duration: video.contentDetails.duration,
        status: video.status.privacyStatus,
      };
    } catch (error) {
      console.error('Failed to get YouTube video info:', error);
      throw new Error(`Failed to get YouTube video info: ${error.message}`);
    }
  }

  async deleteVideo(userId: number, videoId: string): Promise<void> {
    const accessToken = await this.getAccessToken(userId);

    try {
      await axios.delete(`${this.baseUrl}/videos`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params: {
          id: videoId,
        },
      });
    } catch (error) {
      console.error('YouTube video deletion failed:', error);
      throw new Error(`YouTube video deletion failed: ${error.message}`);
    }
  }

  async getChannelInfo(userId: number): Promise<{
    id: string;
    title: string;
    subscriberCount: number;
    videoCount: number;
    viewCount: number;
  }> {
    const accessToken = await this.getAccessToken(userId);

    try {
      const response = await axios.get(`${this.baseUrl}/channels`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params: {
          part: 'snippet,statistics',
          mine: true,
        },
      });

      const channel = response.data.items[0];
      if (!channel) {
        throw new Error('Channel not found');
      }

      return {
        id: channel.id,
        title: channel.snippet.title,
        subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
        videoCount: parseInt(channel.statistics.videoCount || '0'),
        viewCount: parseInt(channel.statistics.viewCount || '0'),
      };
    } catch (error) {
      console.error('Failed to get YouTube channel info:', error);
      throw new Error(`Failed to get YouTube channel info: ${error.message}`);
    }
  }

  async getVideoAnalytics(
    userId: number,
    videoId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    views: number;
    watchTime: number;
    likes: number;
    comments: number;
    shares: number;
  }> {
    const accessToken = await this.getAccessToken(userId);

    // Mock analytics data
    return {
      views: Math.floor(Math.random() * 10000),
      watchTime: Math.floor(Math.random() * 50000),
      likes: Math.floor(Math.random() * 500),
      comments: Math.floor(Math.random() * 100),
      shares: Math.floor(Math.random() * 50),
    };
  }

  async scheduleVideo(
    userId: number,
    videoId: string,
    publishTime: Date
  ): Promise<void> {
    const accessToken = await this.getAccessToken(userId);

    const updateData = {
      id: videoId,
      status: {
        privacyStatus: 'private',
        publishAt: publishTime.toISOString(),
      },
    };

    try {
      await axios.put(`${this.baseUrl}/videos`, updateData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        params: {
          part: 'status',
        },
      });
    } catch (error) {
      console.error('YouTube video scheduling failed:', error);
      throw new Error(`YouTube video scheduling failed: ${error.message}`);
    }
  }

  private async mockYouTubeUpload(metadata: any, videoPath: string): Promise<{ videoId: string }> {
    // Mock implementation - in reality, this would upload to YouTube
    const videoId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Mock YouTube upload:', {
      videoId,
      metadata,
      videoPath,
    });

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return { videoId };
  }

  async generateOAuthUrl(userId: number, redirectUri: string): Promise<string> {
    // In a real implementation, this would generate the OAuth2 authorization URL
    const clientId = 'your-youtube-client-id';
    const scope = 'https://www.googleapis.com/auth/youtube.upload';
    
    return `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline`;
  }

  async exchangeCodeForTokens(
    userId: number,
    code: string,
    redirectUri: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    // In a real implementation, this would exchange the authorization code for tokens
    // and store them in the database
    
    const mockTokens = {
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      expiresIn: 3600,
    };

    // Store tokens in database
    await this.apiConfigRepository.upsert({
      user_id: userId,
      service_name: 'YouTube',
      api_key: mockTokens.accessToken,
      additional_config: JSON.stringify({
        refreshToken: mockTokens.refreshToken,
        expiresIn: mockTokens.expiresIn,
        obtainedAt: new Date(),
      }),
    }, ['user_id', 'service_name']);

    return mockTokens;
  }
}

