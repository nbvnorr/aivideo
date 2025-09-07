import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query,
  UseGuards, 
  Request,
  Delete,
  Put
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { YouTubeService, YouTubeUploadOptions } from './youtube.service';
import { InstagramService, InstagramPostOptions } from './instagram.service';
import { SchedulingService, PublishingCalendar } from './scheduling.service';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(
    private readonly youtubeService: YouTubeService,
    private readonly instagramService: InstagramService,
    private readonly schedulingService: SchedulingService,
  ) {}

  // YouTube endpoints
  @Post('youtube/upload')
  async uploadToYouTube(
    @Request() req,
    @Body() body: {
      videoPath: string;
      options: YouTubeUploadOptions;
    }
  ) {
    const result = await this.youtubeService.uploadVideo(
      req.user.id,
      body.videoPath,
      body.options
    );
    return result;
  }

  @Get('youtube/video/:videoId')
  async getYouTubeVideo(@Request() req, @Param('videoId') videoId: string) {
    const videoInfo = await this.youtubeService.getVideoInfo(req.user.id, videoId);
    return { video: videoInfo };
  }

  @Put('youtube/video/:videoId')
  async updateYouTubeVideo(
    @Request() req,
    @Param('videoId') videoId: string,
    @Body() updates: Partial<YouTubeUploadOptions>
  ) {
    await this.youtubeService.updateVideo(req.user.id, videoId, updates);
    return { success: true };
  }

  @Delete('youtube/video/:videoId')
  async deleteYouTubeVideo(@Request() req, @Param('videoId') videoId: string) {
    await this.youtubeService.deleteVideo(req.user.id, videoId);
    return { success: true };
  }

  @Get('youtube/channel')
  async getYouTubeChannel(@Request() req) {
    const channelInfo = await this.youtubeService.getChannelInfo(req.user.id);
    return { channel: channelInfo };
  }

  @Get('youtube/analytics/:videoId')
  async getYouTubeAnalytics(
    @Request() req,
    @Param('videoId') videoId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const analytics = await this.youtubeService.getVideoAnalytics(
      req.user.id,
      videoId,
      new Date(startDate),
      new Date(endDate)
    );
    return { analytics };
  }

  @Post('youtube/schedule')
  async scheduleYouTubeVideo(
    @Request() req,
    @Body() body: {
      videoId: string;
      publishTime: string;
    }
  ) {
    await this.youtubeService.scheduleVideo(
      req.user.id,
      body.videoId,
      new Date(body.publishTime)
    );
    return { success: true };
  }

  // Instagram endpoints
  @Post('instagram/photo')
  async publishInstagramPhoto(
    @Request() req,
    @Body() body: {
      imageUrl: string;
      options: InstagramPostOptions;
    }
  ) {
    const result = await this.instagramService.publishPhoto(
      req.user.id,
      body.imageUrl,
      body.options
    );
    return result;
  }

  @Post('instagram/video')
  async publishInstagramVideo(
    @Request() req,
    @Body() body: {
      videoUrl: string;
      thumbnailUrl: string;
      options: InstagramPostOptions;
    }
  ) {
    const result = await this.instagramService.publishVideo(
      req.user.id,
      body.videoUrl,
      body.thumbnailUrl,
      body.options
    );
    return result;
  }

  @Post('instagram/reel')
  async publishInstagramReel(
    @Request() req,
    @Body() body: {
      videoUrl: string;
      options: InstagramPostOptions;
    }
  ) {
    const result = await this.instagramService.publishReel(
      req.user.id,
      body.videoUrl,
      body.options
    );
    return result;
  }

  @Post('instagram/story')
  async publishInstagramStory(
    @Request() req,
    @Body() body: {
      mediaUrl: string;
      mediaType: 'IMAGE' | 'VIDEO';
    }
  ) {
    const result = await this.instagramService.publishStory(
      req.user.id,
      body.mediaUrl,
      body.mediaType
    );
    return result;
  }

  @Get('instagram/media/:mediaId')
  async getInstagramMedia(@Request() req, @Param('mediaId') mediaId: string) {
    const mediaInfo = await this.instagramService.getMediaInfo(req.user.id, mediaId);
    return { media: mediaInfo };
  }

  @Delete('instagram/media/:mediaId')
  async deleteInstagramMedia(@Request() req, @Param('mediaId') mediaId: string) {
    await this.instagramService.deleteMedia(req.user.id, mediaId);
    return { success: true };
  }

  @Get('instagram/account')
  async getInstagramAccount(@Request() req) {
    const accountInfo = await this.instagramService.getAccountInfo(req.user.id);
    return { account: accountInfo };
  }

  @Get('instagram/analytics/:mediaId')
  async getInstagramAnalytics(@Request() req, @Param('mediaId') mediaId: string) {
    const analytics = await this.instagramService.getMediaAnalytics(req.user.id, mediaId);
    return { analytics };
  }

  // Scheduling endpoints
  @Post('schedule')
  async schedulePost(
    @Request() req,
    @Body() body: {
      videoId: string;
      platforms: string[];
      scheduledAt: string;
    }
  ) {
    const scheduledPost = await this.schedulingService.schedulePost(
      req.user.id,
      body.videoId,
      body.platforms,
      new Date(body.scheduledAt)
    );
    return { scheduledPost };
  }

  @Get('schedule')
  async getScheduledPosts(@Request() req) {
    const scheduledPosts = await this.schedulingService.getScheduledPosts(req.user.id);
    return { scheduledPosts };
  }

  @Put('schedule/:postId')
  async updateScheduledPost(
    @Request() req,
    @Param('postId') postId: string,
    @Body() updates: {
      scheduledAt?: string;
      platforms?: string[];
    }
  ) {
    const updatedPost = await this.schedulingService.updateScheduledPost(postId, {
      scheduledAt: updates.scheduledAt ? new Date(updates.scheduledAt) : undefined,
      platforms: updates.platforms,
    });
    
    if (!updatedPost) {
      throw new Error('Scheduled post not found or cannot be updated');
    }

    return { scheduledPost: updatedPost };
  }

  @Delete('schedule/:postId')
  async cancelScheduledPost(@Request() req, @Param('postId') postId: string) {
    const success = await this.schedulingService.cancelScheduledPost(postId);
    
    if (!success) {
      throw new Error('Scheduled post not found or cannot be cancelled');
    }

    return { success: true };
  }

  @Post('schedule/bulk')
  async scheduleBulkPosts(
    @Request() req,
    @Body() body: {
      videoIds: string[];
      platforms: string[];
      startDate: string;
      frequency: 'daily' | 'weekly' | 'monthly';
    }
  ) {
    const schedules = await this.schedulingService.getBulkSchedulingOptions(
      req.user.id,
      body.videoIds,
      body.platforms,
      new Date(body.startDate),
      body.frequency
    );

    const scheduledPosts = await this.schedulingService.scheduleBulkPosts(
      req.user.id,
      schedules
    );

    return { scheduledPosts, schedules };
  }

  @Get('schedule/analytics')
  async getSchedulingAnalytics(@Request() req) {
    const analytics = await this.schedulingService.getSchedulingAnalytics(req.user.id);
    return { analytics };
  }

  // Publishing Calendar endpoints
  @Post('calendar')
  async createPublishingCalendar(
    @Request() req,
    @Body() calendar: Omit<PublishingCalendar, 'userId'>
  ) {
    const calendarId = await this.schedulingService.createPublishingCalendar({
      ...calendar,
      userId: req.user.id,
    });
    return { calendarId };
  }

  @Get('calendar')
  async getPublishingCalendars(@Request() req) {
    const calendars = await this.schedulingService.getPublishingCalendars(req.user.id);
    return { calendars };
  }

  @Put('calendar/:calendarId')
  async updatePublishingCalendar(
    @Request() req,
    @Param('calendarId') calendarId: string,
    @Body() updates: Partial<PublishingCalendar>
  ) {
    const updatedCalendar = await this.schedulingService.updatePublishingCalendar(
      calendarId,
      updates
    );
    
    if (!updatedCalendar) {
      throw new Error('Publishing calendar not found');
    }

    return { calendar: updatedCalendar };
  }

  @Delete('calendar/:calendarId')
  async deletePublishingCalendar(@Request() req, @Param('calendarId') calendarId: string) {
    const success = await this.schedulingService.deletePublishingCalendar(calendarId);
    
    if (!success) {
      throw new Error('Publishing calendar not found');
    }

    return { success: true };
  }

  // OAuth endpoints
  @Get('youtube/auth-url')
  async getYouTubeAuthUrl(@Request() req, @Query('redirectUri') redirectUri: string) {
    const authUrl = await this.youtubeService.generateOAuthUrl(req.user.id, redirectUri);
    return { authUrl };
  }

  @Post('youtube/exchange-code')
  async exchangeYouTubeCode(
    @Request() req,
    @Body() body: {
      code: string;
      redirectUri: string;
    }
  ) {
    const tokens = await this.youtubeService.exchangeCodeForTokens(
      req.user.id,
      body.code,
      body.redirectUri
    );
    return { tokens };
  }

  @Get('instagram/auth-url')
  async getInstagramAuthUrl(@Request() req, @Query('redirectUri') redirectUri: string) {
    const authUrl = await this.instagramService.generateOAuthUrl(req.user.id, redirectUri);
    return { authUrl };
  }

  @Post('instagram/exchange-code')
  async exchangeInstagramCode(
    @Request() req,
    @Body() body: {
      code: string;
      redirectUri: string;
    }
  ) {
    const tokens = await this.instagramService.exchangeCodeForTokens(
      req.user.id,
      body.code,
      body.redirectUri
    );
    return { tokens };
  }

  // Cross-platform publishing
  @Post('publish-everywhere')
  async publishToAllPlatforms(
    @Request() req,
    @Body() body: {
      videoId: string;
      platforms: string[];
      customizations?: {
        [platform: string]: {
          title?: string;
          description?: string;
          hashtags?: string[];
        };
      };
    }
  ) {
    const results = {};

    // This would be implemented to publish to all specified platforms
    // with platform-specific optimizations
    
    for (const platform of body.platforms) {
      try {
        // Mock implementation
        results[platform] = {
          success: true,
          url: `https://${platform}.com/video/${Date.now()}`,
        };
      } catch (error) {
        results[platform] = {
          success: false,
          error: error.message,
        };
      }
    }

    return { results };
  }

  @Get('platforms/status')
  async getPlatformStatus(@Request() req) {
    // Check which platforms are connected and their status
    const status = {
      youtube: { connected: false, error: null },
      instagram: { connected: false, error: null },
      tiktok: { connected: false, error: null },
      facebook: { connected: false, error: null },
    };

    // In a real implementation, you would check the API configurations
    // and test the connections

    return { status };
  }
}

