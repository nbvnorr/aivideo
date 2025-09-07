import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiConfiguration } from '../users/api-configuration.entity';
import axios from 'axios';

export interface InstagramPostOptions {
  caption: string;
  hashtags: string[];
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  userTags?: string[];
  scheduledPublishTime?: Date;
}

export interface InstagramMediaInfo {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  mediaUrl: string;
  permalink: string;
  caption: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
  impressions?: number;
  reach?: number;
}

@Injectable()
export class InstagramService {
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(
    @InjectRepository(ApiConfiguration)
    private apiConfigRepository: Repository<ApiConfiguration>,
  ) {}

  private async getAccessToken(userId: number): Promise<string> {
    const config = await this.apiConfigRepository.findOne({
      where: { user_id: userId, service_name: 'Instagram' },
    });

    if (!config) {
      throw new Error('Instagram API credentials not configured');
    }

    return config.api_key;
  }

  private async getInstagramBusinessAccountId(userId: number): Promise<string> {
    const config = await this.apiConfigRepository.findOne({
      where: { user_id: userId, service_name: 'Instagram' },
    });

    if (!config || !config.additional_config) {
      throw new Error('Instagram Business Account ID not configured');
    }

    const additionalConfig = JSON.parse(config.additional_config);
    return additionalConfig.businessAccountId;
  }

  async publishPhoto(
    userId: number,
    imageUrl: string,
    options: InstagramPostOptions
  ): Promise<{ mediaId: string; permalink: string }> {
    const accessToken = await this.getAccessToken(userId);
    const accountId = await this.getInstagramBusinessAccountId(userId);

    try {
      // Step 1: Create media container
      const caption = this.formatCaption(options.caption, options.hashtags);
      
      const containerResponse = await axios.post(
        `${this.baseUrl}/${accountId}/media`,
        {
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken,
        }
      );

      const containerId = containerResponse.data.id;

      // Step 2: Publish the media
      const publishResponse = await axios.post(
        `${this.baseUrl}/${accountId}/media_publish`,
        {
          creation_id: containerId,
          access_token: accessToken,
        }
      );

      const mediaId = publishResponse.data.id;

      // Get permalink
      const mediaInfo = await this.getMediaInfo(userId, mediaId);

      return {
        mediaId,
        permalink: mediaInfo.permalink,
      };
    } catch (error) {
      console.error('Instagram photo upload failed:', error);
      throw new Error(`Instagram photo upload failed: ${error.message}`);
    }
  }

  async publishVideo(
    userId: number,
    videoUrl: string,
    thumbnailUrl: string,
    options: InstagramPostOptions
  ): Promise<{ mediaId: string; permalink: string }> {
    const accessToken = await this.getAccessToken(userId);
    const accountId = await this.getInstagramBusinessAccountId(userId);

    try {
      // Step 1: Create video container
      const caption = this.formatCaption(options.caption, options.hashtags);
      
      const containerResponse = await axios.post(
        `${this.baseUrl}/${accountId}/media`,
        {
          media_type: 'VIDEO',
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          caption: caption,
          access_token: accessToken,
        }
      );

      const containerId = containerResponse.data.id;

      // Step 2: Wait for video processing
      await this.waitForVideoProcessing(userId, containerId);

      // Step 3: Publish the media
      const publishResponse = await axios.post(
        `${this.baseUrl}/${accountId}/media_publish`,
        {
          creation_id: containerId,
          access_token: accessToken,
        }
      );

      const mediaId = publishResponse.data.id;

      // Get permalink
      const mediaInfo = await this.getMediaInfo(userId, mediaId);

      return {
        mediaId,
        permalink: mediaInfo.permalink,
      };
    } catch (error) {
      console.error('Instagram video upload failed:', error);
      throw new Error(`Instagram video upload failed: ${error.message}`);
    }
  }

  async publishReel(
    userId: number,
    videoUrl: string,
    options: InstagramPostOptions
  ): Promise<{ mediaId: string; permalink: string }> {
    const accessToken = await this.getAccessToken(userId);
    const accountId = await this.getInstagramBusinessAccountId(userId);

    try {
      const caption = this.formatCaption(options.caption, options.hashtags);
      
      const containerResponse = await axios.post(
        `${this.baseUrl}/${accountId}/media`,
        {
          media_type: 'REELS',
          video_url: videoUrl,
          caption: caption,
          access_token: accessToken,
        }
      );

      const containerId = containerResponse.data.id;

      // Wait for video processing
      await this.waitForVideoProcessing(userId, containerId);

      // Publish the reel
      const publishResponse = await axios.post(
        `${this.baseUrl}/${accountId}/media_publish`,
        {
          creation_id: containerId,
          access_token: accessToken,
        }
      );

      const mediaId = publishResponse.data.id;
      const mediaInfo = await this.getMediaInfo(userId, mediaId);

      return {
        mediaId,
        permalink: mediaInfo.permalink,
      };
    } catch (error) {
      console.error('Instagram Reel upload failed:', error);
      throw new Error(`Instagram Reel upload failed: ${error.message}`);
    }
  }

  async publishStory(
    userId: number,
    mediaUrl: string,
    mediaType: 'IMAGE' | 'VIDEO'
  ): Promise<{ mediaId: string }> {
    const accessToken = await this.getAccessToken(userId);
    const accountId = await this.getInstagramBusinessAccountId(userId);

    try {
      const mediaData = mediaType === 'IMAGE' 
        ? { image_url: mediaUrl }
        : { video_url: mediaUrl };

      const response = await axios.post(
        `${this.baseUrl}/${accountId}/media`,
        {
          ...mediaData,
          media_type: 'STORIES',
          access_token: accessToken,
        }
      );

      const containerId = response.data.id;

      if (mediaType === 'VIDEO') {
        await this.waitForVideoProcessing(userId, containerId);
      }

      const publishResponse = await axios.post(
        `${this.baseUrl}/${accountId}/media_publish`,
        {
          creation_id: containerId,
          access_token: accessToken,
        }
      );

      return {
        mediaId: publishResponse.data.id,
      };
    } catch (error) {
      console.error('Instagram Story upload failed:', error);
      throw new Error(`Instagram Story upload failed: ${error.message}`);
    }
  }

  async getMediaInfo(userId: number, mediaId: string): Promise<InstagramMediaInfo> {
    const accessToken = await this.getAccessToken(userId);

    try {
      const response = await axios.get(`${this.baseUrl}/${mediaId}`, {
        params: {
          fields: 'id,media_type,media_url,permalink,caption,timestamp,like_count,comments_count,impressions,reach',
          access_token: accessToken,
        },
      });

      return {
        id: response.data.id,
        mediaType: response.data.media_type,
        mediaUrl: response.data.media_url,
        permalink: response.data.permalink,
        caption: response.data.caption || '',
        timestamp: response.data.timestamp,
        likeCount: response.data.like_count || 0,
        commentsCount: response.data.comments_count || 0,
        impressions: response.data.impressions,
        reach: response.data.reach,
      };
    } catch (error) {
      console.error('Failed to get Instagram media info:', error);
      throw new Error(`Failed to get Instagram media info: ${error.message}`);
    }
  }

  async deleteMedia(userId: number, mediaId: string): Promise<void> {
    const accessToken = await this.getAccessToken(userId);

    try {
      await axios.delete(`${this.baseUrl}/${mediaId}`, {
        params: {
          access_token: accessToken,
        },
      });
    } catch (error) {
      console.error('Instagram media deletion failed:', error);
      throw new Error(`Instagram media deletion failed: ${error.message}`);
    }
  }

  async getAccountInfo(userId: number): Promise<{
    id: string;
    username: string;
    name: string;
    biography: string;
    followersCount: number;
    followsCount: number;
    mediaCount: number;
    profilePictureUrl: string;
  }> {
    const accessToken = await this.getAccessToken(userId);
    const accountId = await this.getInstagramBusinessAccountId(userId);

    try {
      const response = await axios.get(`${this.baseUrl}/${accountId}`, {
        params: {
          fields: 'id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url',
          access_token: accessToken,
        },
      });

      return {
        id: response.data.id,
        username: response.data.username,
        name: response.data.name,
        biography: response.data.biography || '',
        followersCount: response.data.followers_count || 0,
        followsCount: response.data.follows_count || 0,
        mediaCount: response.data.media_count || 0,
        profilePictureUrl: response.data.profile_picture_url || '',
      };
    } catch (error) {
      console.error('Failed to get Instagram account info:', error);
      throw new Error(`Failed to get Instagram account info: ${error.message}`);
    }
  }

  async getMediaAnalytics(
    userId: number,
    mediaId: string
  ): Promise<{
    impressions: number;
    reach: number;
    engagement: number;
    saves: number;
    videoViews?: number;
  }> {
    const accessToken = await this.getAccessToken(userId);

    try {
      const response = await axios.get(`${this.baseUrl}/${mediaId}/insights`, {
        params: {
          metric: 'impressions,reach,engagement,saves,video_views',
          access_token: accessToken,
        },
      });

      const insights = response.data.data.reduce((acc, insight) => {
        acc[insight.name] = insight.values[0].value;
        return acc;
      }, {});

      return {
        impressions: insights.impressions || 0,
        reach: insights.reach || 0,
        engagement: insights.engagement || 0,
        saves: insights.saves || 0,
        videoViews: insights.video_views,
      };
    } catch (error) {
      console.error('Failed to get Instagram media analytics:', error);
      throw new Error(`Failed to get Instagram media analytics: ${error.message}`);
    }
  }

  private async waitForVideoProcessing(userId: number, containerId: string): Promise<void> {
    const accessToken = await this.getAccessToken(userId);
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`${this.baseUrl}/${containerId}`, {
          params: {
            fields: 'status_code',
            access_token: accessToken,
          },
        });

        const statusCode = response.data.status_code;

        if (statusCode === 'FINISHED') {
          return;
        } else if (statusCode === 'ERROR') {
          throw new Error('Video processing failed');
        }

        // Wait 2 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        if (attempts >= maxAttempts - 1) {
          throw new Error('Video processing timeout');
        }
        attempts++;
      }
    }

    throw new Error('Video processing timeout');
  }

  private formatCaption(caption: string, hashtags: string[]): string {
    const hashtagString = hashtags.map(tag => `#${tag.replace('#', '')}`).join(' ');
    return `${caption}\n\n${hashtagString}`;
  }

  async generateOAuthUrl(userId: number, redirectUri: string): Promise<string> {
    const clientId = 'your-instagram-app-id';
    const scope = 'instagram_basic,instagram_content_publish';
    
    return `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
  }

  async exchangeCodeForTokens(
    userId: number,
    code: string,
    redirectUri: string
  ): Promise<{
    accessToken: string;
    userId: string;
  }> {
    // Mock implementation
    const mockTokens = {
      accessToken: `mock_instagram_token_${Date.now()}`,
      userId: `mock_instagram_user_${Date.now()}`,
    };

    // Store tokens in database
    await this.apiConfigRepository.upsert({
      user_id: userId,
      service_name: 'Instagram',
      api_key: mockTokens.accessToken,
      additional_config: JSON.stringify({
        businessAccountId: mockTokens.userId,
        obtainedAt: new Date(),
      }),
    }, ['user_id', 'service_name']);

    return mockTokens;
  }
}

