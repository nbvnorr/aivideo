import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { ImageGenerationService } from './image-generation.service';
import { VoiceGenerationService } from './voice-generation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly imageGenerationService: ImageGenerationService,
    private readonly voiceGenerationService: VoiceGenerationService,
  ) {}

  @Get('topics/trending')
  async getTrendingTopics(@Request() req, @Query('category') category?: string) {
    return this.aiService.discoverTrendingTopics(req.user.id, category);
  }

  @Post('script/generate')
  async generateScript(
    @Request() req,
    @Body() body: { topic: string; duration?: number }
  ) {
    const script = await this.aiService.generateScript(
      req.user.id,
      body.topic,
      body.duration
    );
    return { script };
  }

  @Post('hashtags/generate')
  async generateHashtags(
    @Request() req,
    @Body() body: { topic: string; platform?: string }
  ) {
    const hashtags = await this.aiService.generateHashtags(
      req.user.id,
      body.topic,
      body.platform
    );
    return { hashtags };
  }

  @Post('images/prompts')
  async generateImagePrompts(
    @Request() req,
    @Body() body: { script: string }
  ) {
    const prompts = await this.aiService.generateImagePrompts(req.user.id, body.script);
    return { prompts };
  }

  @Post('images/generate')
  async generateImages(
    @Request() req,
    @Body() body: { prompts: string[]; service?: 'dalle' | 'stability' }
  ) {
    const imageUrls = await this.imageGenerationService.generateMultipleImages(
      req.user.id,
      body.prompts,
      body.service
    );
    return { imageUrls };
  }

  @Post('images/thumbnail')
  async generateThumbnail(
    @Request() req,
    @Body() body: { title: string; style?: 'youtube' | 'tiktok' | 'instagram' }
  ) {
    const thumbnailUrl = await this.imageGenerationService.generateThumbnail(
      req.user.id,
      body.title,
      body.style
    );
    return { thumbnailUrl };
  }

  @Get('voices/available')
  async getAvailableVoices(
    @Request() req,
    @Query('service') service?: 'elevenlabs' | 'polly'
  ) {
    const voices = await this.voiceGenerationService.getAvailableVoices(
      req.user.id,
      service
    );
    return { voices };
  }

  @Post('voice/generate')
  async generateVoice(
    @Request() req,
    @Body() body: { 
      text: string; 
      voiceId?: string; 
      withTimestamps?: boolean;
    }
  ) {
    if (body.withTimestamps) {
      const result = await this.voiceGenerationService.generateNarrationWithTimestamps(
        req.user.id,
        body.text,
        body.voiceId
      );
      
      // In a real implementation, you'd upload the audio to S3 and return the URL
      return {
        audioUrl: 'https://placeholder-audio-url.com/narration.mp3',
        timestamps: result.timestamps,
      };
    } else {
      const audioBuffer = await this.voiceGenerationService.generateVoiceWithElevenLabs(
        req.user.id,
        body.text,
        body.voiceId
      );
      
      // In a real implementation, you'd upload the audio to S3 and return the URL
      return {
        audioUrl: 'https://placeholder-audio-url.com/narration.mp3',
      };
    }
  }

  @Post('content/optimize')
  async optimizeContent(
    @Request() req,
    @Body() body: {
      content: string;
      platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook';
    }
  ) {
    const optimizedContent = await this.aiService.optimizeContentForPlatform(
      req.user.id,
      body.content,
      body.platform
    );
    return optimizedContent;
  }

  @Post('workflow/complete')
  async completeAIWorkflow(
    @Request() req,
    @Body() body: {
      topic: string;
      duration?: number;
      platforms?: string[];
      voiceId?: string;
      imageService?: 'dalle' | 'stability';
    }
  ) {
    // Complete AI workflow: topic -> script -> images -> voice -> optimization
    const script = await this.aiService.generateScript(
      req.user.id,
      body.topic,
      body.duration || 60
    );

    const imagePrompts = await this.aiService.generateImagePrompts(req.user.id, script);
    const imageUrls = await this.imageGenerationService.generateMultipleImages(
      req.user.id,
      imagePrompts.slice(0, 5), // Limit to 5 images
      body.imageService || 'dalle'
    );

    const voiceResult = await this.voiceGenerationService.generateNarrationWithTimestamps(
      req.user.id,
      script,
      body.voiceId
    );

    const hashtags = await this.aiService.generateHashtags(req.user.id, body.topic);

    // Optimize for each platform
    const platformOptimizations = {};
    const platforms = body.platforms || ['youtube', 'tiktok', 'instagram'];
    
    for (const platform of platforms) {
      platformOptimizations[platform] = await this.aiService.optimizeContentForPlatform(
        req.user.id,
        script,
        platform as any
      );
    }

    return {
      topic: body.topic,
      script,
      imageUrls,
      audioUrl: 'https://placeholder-audio-url.com/narration.mp3',
      timestamps: voiceResult.timestamps,
      hashtags,
      platformOptimizations,
    };
  }
}

