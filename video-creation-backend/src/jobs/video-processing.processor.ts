import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VideoMetadata, VideoMetadataDocument } from '../videos/video-metadata.schema';
import { AiService } from '../ai/ai.service';
import { ImageGenerationService } from '../ai/image-generation.service';
import { VoiceGenerationService } from '../ai/voice-generation.service';

@Processor('video-processing')
@Injectable()
export class VideoProcessingProcessor {
  constructor(
    @InjectModel(VideoMetadata.name)
    private videoMetadataModel: Model<VideoMetadataDocument>,
    private aiService: AiService,
    private imageGenerationService: ImageGenerationService,
    private voiceGenerationService: VoiceGenerationService,
  ) {}

  @Process('generate-video')
  async handleVideoGeneration(job: Job<{ videoId: string; userId: string }>) {
    const { videoId, userId } = job.data;
    
    try {
      // Update status to processing
      await this.videoMetadataModel.findByIdAndUpdate(videoId, {
        status: 'processing',
        updatedAt: new Date(),
      });

      // Get video metadata
      const video = await this.videoMetadataModel.findById(videoId);
      if (!video) {
        throw new Error('Video not found');
      }

      // Generate script if not provided
      let script = video.script;
      if (!script && video.title) {
        script = await this.aiService.generateScript(parseInt(userId), video.title);
        video.script = script;
      }

      // Generate images if not provided
      if (!video.media || video.media.length === 0) {
        const imagePrompts = await this.aiService.generateImagePrompts(parseInt(userId), script);
        const imageUrls = await this.imageGenerationService.generateMultipleImages(
          parseInt(userId),
          imagePrompts.slice(0, 5)
        );

        video.media = imageUrls.map(url => ({
          type: 'image',
          url,
          source: 'generated',
        }));
      }

      // Generate voice narration if not provided
      if (!video.narration?.audioUrl) {
        const voiceResult = await this.voiceGenerationService.generateNarrationWithTimestamps(
          parseInt(userId),
          script
        );

        video.narration = {
          voice: 'default',
          text: script,
          audioUrl: 'https://placeholder-audio-url.com/narration.mp3',
        };

        video.captions = voiceResult.timestamps;
      }

      // Generate hashtags if not provided
      if (!video.hashtags || video.hashtags.length === 0) {
        video.hashtags = await this.aiService.generateHashtags(parseInt(userId), video.title);
      }

      // Generate thumbnail
      if (!video.thumbnailUrl) {
        video.thumbnailUrl = await this.imageGenerationService.generateThumbnail(
          parseInt(userId),
          video.title
        );
      }

      // Simulate video rendering process
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay

      // Update video with generated content and mark as completed
      video.status = 'completed';
      video.videoUrl = 'https://placeholder-video-url.com/generated-video.mp4';
      video.updatedAt = new Date();

      await video.save();

      console.log(`Video generation completed for video ${videoId}`);
    } catch (error) {
      console.error(`Video generation failed for video ${videoId}:`, error);
      
      await this.videoMetadataModel.findByIdAndUpdate(videoId, {
        status: 'failed',
        updatedAt: new Date(),
      });
    }
  }

  @Process('schedule-video')
  async handleVideoScheduling(job: Job<{ videoId: string; userId: string; scheduledAt: string }>) {
    const { videoId, scheduledAt } = job.data;
    
    try {
      console.log(`Scheduling video ${videoId} for ${scheduledAt}`);
      
      // Update video status to scheduled
      await this.videoMetadataModel.findByIdAndUpdate(videoId, {
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt),
        updatedAt: new Date(),
      });

      console.log(`Video ${videoId} scheduled successfully`);
    } catch (error) {
      console.error(`Video scheduling failed for video ${videoId}:`, error);
    }
  }

  @Process('publish-video')
  async handleVideoPublishing(job: Job<{ videoId: string; userId: string; platforms: string[] }>) {
    const { videoId, platforms } = job.data;
    
    try {
      console.log(`Publishing video ${videoId} to platforms:`, platforms);
      
      // Simulate publishing to social media platforms
      const socialMediaLinks = {};
      
      for (const platform of platforms) {
        // Simulate API calls to social media platforms
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay per platform
        
        socialMediaLinks[platform] = `https://${platform}.com/video/${videoId}`;
      }

      // Update video with social media links and mark as published
      await this.videoMetadataModel.findByIdAndUpdate(videoId, {
        status: 'published',
        publishedAt: new Date(),
        socialMediaLinks,
        updatedAt: new Date(),
      });

      console.log(`Video ${videoId} published successfully to:`, platforms);
    } catch (error) {
      console.error(`Video publishing failed for video ${videoId}:`, error);
      
      await this.videoMetadataModel.findByIdAndUpdate(videoId, {
        status: 'failed',
        updatedAt: new Date(),
      });
    }
  }
}

