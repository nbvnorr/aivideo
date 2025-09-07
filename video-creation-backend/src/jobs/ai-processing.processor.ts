import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VideoMetadata, VideoMetadataDocument } from '../videos/video-metadata.schema';
import { AiService } from '../ai/ai.service';
import { ImageGenerationService } from '../ai/image-generation.service';
import { VoiceGenerationService } from '../ai/voice-generation.service';

@Processor('ai-processing')
@Injectable()
export class AiProcessingProcessor {
  constructor(
    @InjectModel(VideoMetadata.name)
    private videoMetadataModel: Model<VideoMetadataDocument>,
    private aiService: AiService,
    private imageGenerationService: ImageGenerationService,
    private voiceGenerationService: VoiceGenerationService,
  ) {}

  @Process('generate-series-video')
  async handleSeriesVideoGeneration(job: Job<{
    seriesId: number;
    userId: string;
    seriesTitle: string;
    seriesDescription: string;
  }>) {
    const { seriesId, userId, seriesTitle, seriesDescription } = job.data;
    
    try {
      console.log(`Generating new video for series ${seriesId}`);

      // Generate a new topic based on the series theme
      const topics = await this.aiService.discoverTrendingTopics(parseInt(userId));
      const selectedTopic = topics[0]; // Select the first trending topic

      // Generate script
      const script = await this.aiService.generateScript(parseInt(userId), selectedTopic);

      // Generate images
      const imagePrompts = await this.aiService.generateImagePrompts(parseInt(userId), script);
      const imageUrls = await this.imageGenerationService.generateMultipleImages(
        parseInt(userId),
        imagePrompts.slice(0, 5)
      );

      // Generate voice narration
      const voiceResult = await this.voiceGenerationService.generateNarrationWithTimestamps(
        parseInt(userId),
        script
      );

      // Generate hashtags
      const hashtags = await this.aiService.generateHashtags(parseInt(userId), selectedTopic);

      // Generate thumbnail
      const thumbnailUrl = await this.imageGenerationService.generateThumbnail(
        parseInt(userId),
        selectedTopic
      );

      // Create new video metadata
      const newVideo = new this.videoMetadataModel({
        userId,
        seriesId: seriesId.toString(),
        title: selectedTopic,
        script,
        status: 'completed',
        media: imageUrls.map(url => ({
          type: 'image',
          url,
          source: 'generated',
        })),
        narration: {
          voice: 'default',
          text: script,
          audioUrl: 'https://placeholder-audio-url.com/narration.mp3',
        },
        captions: voiceResult.timestamps,
        hashtags,
        thumbnailUrl,
        videoUrl: 'https://placeholder-video-url.com/generated-video.mp4',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await newVideo.save();

      console.log(`Series video generated successfully for series ${seriesId}`);
    } catch (error) {
      console.error(`Series video generation failed for series ${seriesId}:`, error);
    }
  }

  @Process('schedule-series-content')
  async handleSeriesContentScheduling(job: Job<{
    seriesId: number;
    userId: string;
    frequency: string;
  }>) {
    const { seriesId, userId, frequency } = job.data;
    
    try {
      console.log(`Setting up content scheduling for series ${seriesId} with frequency ${frequency}`);

      // Calculate next generation time based on frequency
      const now = new Date();
      let nextGenerationTime: Date;

      switch (frequency) {
        case 'daily':
          nextGenerationTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
          break;
        case 'weekly':
          nextGenerationTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
          break;
        case 'monthly':
          nextGenerationTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
          break;
        default:
          nextGenerationTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to daily
      }

      // Schedule the next video generation
      // In a real implementation, you would use a job scheduler like Bull or Agenda
      console.log(`Next video for series ${seriesId} scheduled for ${nextGenerationTime}`);

    } catch (error) {
      console.error(`Series content scheduling failed for series ${seriesId}:`, error);
    }
  }

  @Process('optimize-content')
  async handleContentOptimization(job: Job<{
    videoId: string;
    userId: string;
    platforms: string[];
  }>) {
    const { videoId, userId, platforms } = job.data;
    
    try {
      console.log(`Optimizing content for video ${videoId} for platforms:`, platforms);

      const video = await this.videoMetadataModel.findById(videoId);
      if (!video) {
        throw new Error('Video not found');
      }

      const optimizations = {};

      for (const platform of platforms) {
        const optimizedContent = await this.aiService.optimizeContentForPlatform(
          parseInt(userId),
          video.script,
          platform as any
        );
        
        optimizations[platform] = optimizedContent;
      }

      // Store optimizations in video metadata
      await this.videoMetadataModel.findByIdAndUpdate(videoId, {
        platformOptimizations: optimizations,
        updatedAt: new Date(),
      });

      console.log(`Content optimization completed for video ${videoId}`);
    } catch (error) {
      console.error(`Content optimization failed for video ${videoId}:`, error);
    }
  }

  @Process('batch-generate-content')
  async handleBatchContentGeneration(job: Job<{
    userId: string;
    topics: string[];
    settings: any;
  }>) {
    const { userId, topics, settings } = job.data;
    
    try {
      console.log(`Batch generating content for ${topics.length} topics`);

      for (const topic of topics) {
        // Generate content for each topic
        const script = await this.aiService.generateScript(parseInt(userId), topic);
        const imagePrompts = await this.aiService.generateImagePrompts(parseInt(userId), script);
        const imageUrls = await this.imageGenerationService.generateMultipleImages(
          parseInt(userId),
          imagePrompts.slice(0, 3) // Limit to 3 images for batch processing
        );

        const hashtags = await this.aiService.generateHashtags(parseInt(userId), topic);

        // Create video metadata
        const newVideo = new this.videoMetadataModel({
          userId,
          title: topic,
          script,
          status: 'draft',
          media: imageUrls.map(url => ({
            type: 'image',
            url,
            source: 'generated',
          })),
          hashtags,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await newVideo.save();

        // Add small delay between generations to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log(`Batch content generation completed for ${topics.length} topics`);
    } catch (error) {
      console.error(`Batch content generation failed:`, error);
    }
  }
}

