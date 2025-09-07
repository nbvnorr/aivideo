import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VideoMetadata, VideoMetadataDocument } from '../videos/video-metadata.schema';
import { YouTubeService } from './youtube.service';
import { InstagramService } from './instagram.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface ScheduledPost {
  id: string;
  userId: number;
  videoId: string;
  platforms: string[];
  scheduledAt: Date;
  status: 'pending' | 'processing' | 'published' | 'failed';
  publishedUrls?: { [platform: string]: string };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublishingCalendar {
  userId: number;
  seriesId?: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  timeSlots: Array<{
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    hour: number; // 0-23
    minute: number; // 0-59
  }>;
  platforms: string[];
  isActive: boolean;
  nextScheduledAt?: Date;
}

@Injectable()
export class SchedulingService {
  private scheduledPosts: Map<string, ScheduledPost> = new Map();
  private publishingCalendars: Map<string, PublishingCalendar> = new Map();

  constructor(
    @InjectModel(VideoMetadata.name)
    private videoMetadataModel: Model<VideoMetadataDocument>,
    private youtubeService: YouTubeService,
    private instagramService: InstagramService,
  ) {}

  async schedulePost(
    userId: number,
    videoId: string,
    platforms: string[],
    scheduledAt: Date
  ): Promise<ScheduledPost> {
    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const scheduledPost: ScheduledPost = {
      id: postId,
      userId,
      videoId,
      platforms,
      scheduledAt,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scheduledPosts.set(postId, scheduledPost);

    // In a real implementation, you would store this in a database
    console.log(`Scheduled post ${postId} for ${scheduledAt}`);

    return scheduledPost;
  }

  async cancelScheduledPost(postId: string): Promise<boolean> {
    const post = this.scheduledPosts.get(postId);
    
    if (!post || post.status !== 'pending') {
      return false;
    }

    this.scheduledPosts.delete(postId);
    return true;
  }

  async updateScheduledPost(
    postId: string,
    updates: Partial<Pick<ScheduledPost, 'scheduledAt' | 'platforms'>>
  ): Promise<ScheduledPost | null> {
    const post = this.scheduledPosts.get(postId);
    
    if (!post || post.status !== 'pending') {
      return null;
    }

    const updatedPost = {
      ...post,
      ...updates,
      updatedAt: new Date(),
    };

    this.scheduledPosts.set(postId, updatedPost);
    return updatedPost;
  }

  async getScheduledPosts(userId: number): Promise<ScheduledPost[]> {
    return Array.from(this.scheduledPosts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  async createPublishingCalendar(calendar: PublishingCalendar): Promise<string> {
    const calendarId = `calendar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const calendarWithId = {
      ...calendar,
      nextScheduledAt: this.calculateNextScheduledTime(calendar),
    };

    this.publishingCalendars.set(calendarId, calendarWithId);

    console.log(`Created publishing calendar ${calendarId}`);
    return calendarId;
  }

  async updatePublishingCalendar(
    calendarId: string,
    updates: Partial<PublishingCalendar>
  ): Promise<PublishingCalendar | null> {
    const calendar = this.publishingCalendars.get(calendarId);
    
    if (!calendar) {
      return null;
    }

    const updatedCalendar = {
      ...calendar,
      ...updates,
      nextScheduledAt: this.calculateNextScheduledTime({ ...calendar, ...updates }),
    };

    this.publishingCalendars.set(calendarId, updatedCalendar);
    return updatedCalendar;
  }

  async deletePublishingCalendar(calendarId: string): Promise<boolean> {
    return this.publishingCalendars.delete(calendarId);
  }

  async getPublishingCalendars(userId: number): Promise<PublishingCalendar[]> {
    return Array.from(this.publishingCalendars.values())
      .filter(calendar => calendar.userId === userId);
  }

  // Cron job to process scheduled posts every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledPosts(): Promise<void> {
    const now = new Date();
    const postsToProcess = Array.from(this.scheduledPosts.values())
      .filter(post => 
        post.status === 'pending' && 
        post.scheduledAt <= now
      );

    for (const post of postsToProcess) {
      await this.publishPost(post);
    }
  }

  // Cron job to generate content from publishing calendars
  @Cron(CronExpression.EVERY_HOUR)
  async processPublishingCalendars(): Promise<void> {
    const now = new Date();
    const calendarsToProcess = Array.from(this.publishingCalendars.values())
      .filter(calendar => 
        calendar.isActive && 
        calendar.nextScheduledAt && 
        calendar.nextScheduledAt <= now
      );

    for (const calendar of calendarsToProcess) {
      await this.generateAndScheduleFromCalendar(calendar);
    }
  }

  private async publishPost(post: ScheduledPost): Promise<void> {
    try {
      // Update status to processing
      post.status = 'processing';
      post.updatedAt = new Date();
      this.scheduledPosts.set(post.id, post);

      // Get video metadata
      const video = await this.videoMetadataModel.findById(post.videoId);
      if (!video) {
        throw new Error('Video not found');
      }

      const publishedUrls: { [platform: string]: string } = {};

      // Publish to each platform
      for (const platform of post.platforms) {
        try {
          let url: string;

          switch (platform.toLowerCase()) {
            case 'youtube':
              const youtubeResult = await this.youtubeService.uploadVideo(
                post.userId,
                video.videoUrl,
                {
                  title: video.title,
                  description: video.script,
                  tags: video.hashtags,
                  privacy: 'public',
                  thumbnailPath: video.thumbnailUrl,
                }
              );
              url = youtubeResult.url;
              break;

            case 'instagram':
              const instagramResult = await this.instagramService.publishVideo(
                post.userId,
                video.videoUrl,
                video.thumbnailUrl,
                {
                  caption: video.title,
                  hashtags: video.hashtags,
                }
              );
              url = instagramResult.permalink;
              break;

            case 'tiktok':
              // Mock TikTok publishing
              url = `https://tiktok.com/@user/video/${Date.now()}`;
              break;

            case 'facebook':
              // Mock Facebook publishing
              url = `https://facebook.com/video/${Date.now()}`;
              break;

            default:
              throw new Error(`Unsupported platform: ${platform}`);
          }

          publishedUrls[platform] = url;
        } catch (platformError) {
          console.error(`Failed to publish to ${platform}:`, platformError);
          // Continue with other platforms
        }
      }

      // Update post status
      post.status = 'published';
      post.publishedUrls = publishedUrls;
      post.updatedAt = new Date();
      this.scheduledPosts.set(post.id, post);

      // Update video metadata with social media links
      await this.videoMetadataModel.findByIdAndUpdate(post.videoId, {
        socialMediaLinks: publishedUrls,
        publishedAt: new Date(),
        status: 'published',
      });

      console.log(`Successfully published post ${post.id} to platforms:`, Object.keys(publishedUrls));
    } catch (error) {
      console.error(`Failed to publish post ${post.id}:`, error);
      
      post.status = 'failed';
      post.error = error.message;
      post.updatedAt = new Date();
      this.scheduledPosts.set(post.id, post);
    }
  }

  private async generateAndScheduleFromCalendar(calendar: PublishingCalendar): Promise<void> {
    try {
      console.log(`Processing publishing calendar for user ${calendar.userId}`);

      // In a real implementation, this would trigger AI content generation
      // For now, we'll just schedule the next post time
      
      // Update next scheduled time
      calendar.nextScheduledAt = this.calculateNextScheduledTime(calendar);
      this.publishingCalendars.set(
        Array.from(this.publishingCalendars.entries())
          .find(([_, cal]) => cal === calendar)?.[0] || '',
        calendar
      );

      console.log(`Next scheduled time for calendar: ${calendar.nextScheduledAt}`);
    } catch (error) {
      console.error('Failed to process publishing calendar:', error);
    }
  }

  private calculateNextScheduledTime(calendar: PublishingCalendar): Date {
    const now = new Date();
    const nextTimes: Date[] = [];

    for (const timeSlot of calendar.timeSlots) {
      const nextTime = new Date(now);
      
      // Set to the specified time
      nextTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);

      // Calculate based on frequency
      switch (calendar.frequency) {
        case 'daily':
          // If the time has passed today, schedule for tomorrow
          if (nextTime <= now) {
            nextTime.setDate(nextTime.getDate() + 1);
          }
          break;

        case 'weekly':
          // Find the next occurrence of the specified day of week
          const daysUntilTarget = (timeSlot.dayOfWeek - nextTime.getDay() + 7) % 7;
          if (daysUntilTarget === 0 && nextTime <= now) {
            nextTime.setDate(nextTime.getDate() + 7);
          } else {
            nextTime.setDate(nextTime.getDate() + daysUntilTarget);
          }
          break;

        case 'monthly':
          // Schedule for the same day next month
          if (nextTime <= now) {
            nextTime.setMonth(nextTime.getMonth() + 1);
          }
          break;
      }

      nextTimes.push(nextTime);
    }

    // Return the earliest next time
    return nextTimes.reduce((earliest, current) => 
      current < earliest ? current : earliest
    );
  }

  async getBulkSchedulingOptions(
    userId: number,
    videoIds: string[],
    platforms: string[],
    startDate: Date,
    frequency: 'daily' | 'weekly' | 'monthly'
  ): Promise<Array<{ videoId: string; scheduledAt: Date; platforms: string[] }>> {
    const schedules: Array<{ videoId: string; scheduledAt: Date; platforms: string[] }> = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < videoIds.length; i++) {
      schedules.push({
        videoId: videoIds[i],
        scheduledAt: new Date(currentDate),
        platforms: [...platforms],
      });

      // Calculate next date based on frequency
      switch (frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }

    return schedules;
  }

  async scheduleBulkPosts(
    userId: number,
    schedules: Array<{ videoId: string; scheduledAt: Date; platforms: string[] }>
  ): Promise<ScheduledPost[]> {
    const scheduledPosts: ScheduledPost[] = [];

    for (const schedule of schedules) {
      const post = await this.schedulePost(
        userId,
        schedule.videoId,
        schedule.platforms,
        schedule.scheduledAt
      );
      scheduledPosts.push(post);
    }

    return scheduledPosts;
  }

  async getSchedulingAnalytics(userId: number): Promise<{
    totalScheduled: number;
    totalPublished: number;
    totalFailed: number;
    platformBreakdown: { [platform: string]: number };
    upcomingPosts: number;
  }> {
    const userPosts = Array.from(this.scheduledPosts.values())
      .filter(post => post.userId === userId);

    const platformBreakdown: { [platform: string]: number } = {};
    
    userPosts.forEach(post => {
      post.platforms.forEach(platform => {
        platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
      });
    });

    const now = new Date();
    const upcomingPosts = userPosts.filter(post => 
      post.status === 'pending' && post.scheduledAt > now
    ).length;

    return {
      totalScheduled: userPosts.length,
      totalPublished: userPosts.filter(post => post.status === 'published').length,
      totalFailed: userPosts.filter(post => post.status === 'failed').length,
      platformBreakdown,
      upcomingPosts,
    };
  }
}

