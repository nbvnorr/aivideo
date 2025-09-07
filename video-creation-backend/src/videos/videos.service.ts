import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VideoMetadata, VideoMetadataDocument } from './video-metadata.schema';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class VideosService {
  constructor(
    @InjectModel(VideoMetadata.name)
    private videoMetadataModel: Model<VideoMetadataDocument>,
    @InjectQueue('video-processing')
    private videoProcessingQueue: Queue,
  ) {}

  async create(createVideoDto: CreateVideoDto, userId: string): Promise<VideoMetadata> {
    const videoMetadata = new this.videoMetadataModel({
      ...createVideoDto,
      userId,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return videoMetadata.save();
  }

  async findAll(userId: string, query: any): Promise<VideoMetadata[]> {
    const filter: any = { userId };
    
    if (query.status) {
      filter.status = query.status;
    }
    
    if (query.seriesId) {
      filter.seriesId = query.seriesId;
    }

    return this.videoMetadataModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit || 50)
      .skip(query.offset || 0)
      .exec();
  }

  async getDashboardStats(userId: string) {
    const totalVideos = await this.videoMetadataModel.countDocuments({ userId });
    
    const analytics = await this.videoMetadataModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$analytics.views' },
          totalLikes: { $sum: '$analytics.likes' },
          totalShares: { $sum: '$analytics.shares' },
          avgEngagement: { $avg: '$analytics.engagementRate' }
        }
      }
    ]);

    const recentVideos = await this.videoMetadataModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('title status thumbnailUrl createdAt')
      .exec();

    const scheduledVideos = await this.videoMetadataModel
      .find({ 
        userId, 
        scheduledAt: { $gte: new Date() },
        status: 'scheduled'
      })
      .sort({ scheduledAt: 1 })
      .limit(5)
      .select('title scheduledAt')
      .exec();

    return {
      totalVideos,
      totalViews: analytics[0]?.totalViews || 0,
      totalLikes: analytics[0]?.totalLikes || 0,
      avgEngagement: analytics[0]?.avgEngagement || 0,
      recentVideos,
      scheduledVideos,
    };
  }

  async findOne(id: string, userId: string): Promise<VideoMetadata> {
    const video = await this.videoMetadataModel.findById(id).exec();
    
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    
    if (video.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    
    return video;
  }

  async update(id: string, updateVideoDto: UpdateVideoDto, userId: string): Promise<VideoMetadata> {
    const video = await this.findOne(id, userId);
    
    Object.assign(video, updateVideoDto);
    video.updatedAt = new Date();
    
    return video.save();
  }

  async remove(id: string, userId: string): Promise<void> {
    const video = await this.findOne(id, userId);
    await this.videoMetadataModel.findByIdAndDelete(id).exec();
  }

  async generateVideo(id: string, userId: string): Promise<VideoMetadata> {
    const video = await this.findOne(id, userId);
    
    // Add video generation job to queue
    await this.videoProcessingQueue.add('generate-video', {
      videoId: id,
      userId,
    });
    
    video.status = 'processing';
    video.updatedAt = new Date();
    
    return video.save();
  }

  async scheduleVideo(id: string, scheduleData: any, userId: string): Promise<VideoMetadata> {
    const video = await this.findOne(id, userId);
    
    video.scheduledAt = new Date(scheduleData.scheduledAt);
    video.status = 'scheduled';
    video.updatedAt = new Date();
    
    // Add scheduling job to queue
    await this.videoProcessingQueue.add('schedule-video', {
      videoId: id,
      userId,
      scheduledAt: scheduleData.scheduledAt,
    }, {
      delay: new Date(scheduleData.scheduledAt).getTime() - Date.now(),
    });
    
    return video.save();
  }

  async publishVideo(id: string, publishData: any, userId: string): Promise<VideoMetadata> {
    const video = await this.findOne(id, userId);
    
    // Add publishing job to queue
    await this.videoProcessingQueue.add('publish-video', {
      videoId: id,
      userId,
      platforms: publishData.platforms,
    });
    
    video.status = 'publishing';
    video.updatedAt = new Date();
    
    return video.save();
  }
}

