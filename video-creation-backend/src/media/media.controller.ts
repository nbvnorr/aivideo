import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  Request, 
  UploadedFile, 
  UseInterceptors,
  Res,
  Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VideoRendererService, VideoSegment, VideoTemplate } from './video-renderer.service';
import { MediaStorageService } from './media-storage.service';
import { VideoTemplateService } from './video-template.service';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(
    private readonly videoRendererService: VideoRendererService,
    private readonly mediaStorageService: MediaStorageService,
    private readonly videoTemplateService: VideoTemplateService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    const mediaFile = await this.mediaStorageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    return { mediaFile };
  }

  @Post('render')
  async renderVideo(
    @Request() req,
    @Body() body: {
      segments: VideoSegment[];
      audioUrl: string;
      templateId: string;
      outputFilename?: string;
    }
  ) {
    const template = this.videoTemplateService.getTemplateById(body.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const outputFilename = body.outputFilename || `video_${Date.now()}.mp4`;
    
    const videoPath = await this.videoRendererService.renderVideo(
      body.segments,
      body.audioUrl,
      template,
      outputFilename
    );

    // Upload the rendered video to storage
    const videoBuffer = await this.mediaStorageService.getFileBuffer(videoPath);
    const mediaFile = await this.mediaStorageService.uploadFile(
      videoBuffer,
      outputFilename,
      'video/mp4'
    );

    return { videoUrl: mediaFile.url, mediaFile };
  }

  @Post('add-subtitles')
  async addSubtitles(
    @Request() req,
    @Body() body: {
      videoPath: string;
      subtitles: Array<{ text: string; startTime: number; endTime: number }>;
      style?: {
        fontSize?: number;
        fontColor?: string;
        backgroundColor?: string;
        position?: 'top' | 'center' | 'bottom';
      };
    }
  ) {
    const outputFilename = `subtitled_${Date.now()}.mp4`;
    const outputPath = `/tmp/video-output/${outputFilename}`;

    await this.videoRendererService.addSubtitles(
      body.videoPath,
      body.subtitles,
      outputPath,
      body.style
    );

    const videoBuffer = await this.mediaStorageService.getFileBuffer(outputPath);
    const mediaFile = await this.mediaStorageService.uploadFile(
      videoBuffer,
      outputFilename,
      'video/mp4'
    );

    return { videoUrl: mediaFile.url, mediaFile };
  }

  @Post('add-background-music')
  async addBackgroundMusic(
    @Request() req,
    @Body() body: {
      videoPath: string;
      musicUrl: string;
      volume?: number;
    }
  ) {
    const outputFilename = `music_${Date.now()}.mp4`;
    const outputPath = `/tmp/video-output/${outputFilename}`;

    await this.videoRendererService.addBackgroundMusic(
      body.videoPath,
      body.musicUrl,
      outputPath,
      body.volume
    );

    const videoBuffer = await this.mediaStorageService.getFileBuffer(outputPath);
    const mediaFile = await this.mediaStorageService.uploadFile(
      videoBuffer,
      outputFilename,
      'video/mp4'
    );

    return { videoUrl: mediaFile.url, mediaFile };
  }

  @Post('optimize-platform')
  async optimizeForPlatform(
    @Request() req,
    @Body() body: {
      videoPath: string;
      platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook';
    }
  ) {
    const outputFilename = `${body.platform}_${Date.now()}.mp4`;
    const outputPath = `/tmp/video-output/${outputFilename}`;

    await this.videoRendererService.optimizeForPlatform(
      body.videoPath,
      body.platform,
      outputPath
    );

    const videoBuffer = await this.mediaStorageService.getFileBuffer(outputPath);
    const mediaFile = await this.mediaStorageService.uploadFile(
      videoBuffer,
      outputFilename,
      'video/mp4'
    );

    return { videoUrl: mediaFile.url, mediaFile };
  }

  @Post('generate-thumbnail')
  async generateThumbnail(
    @Request() req,
    @Body() body: {
      videoPath: string;
      timeOffset?: number;
    }
  ) {
    const thumbnailPath = await this.videoRendererService.createThumbnail(
      body.videoPath,
      body.timeOffset
    );

    const thumbnailBuffer = await this.mediaStorageService.getFileBuffer(thumbnailPath);
    const mediaFile = await this.mediaStorageService.uploadFile(
      thumbnailBuffer,
      `thumbnail_${Date.now()}.jpg`,
      'image/jpeg'
    );

    return { thumbnailUrl: mediaFile.url, mediaFile };
  }

  @Get('templates')
  async getTemplates(
    @Query('category') category?: string,
    @Query('aspectRatio') aspectRatio?: '16:9' | '9:16' | '1:1'
  ) {
    let templates = this.videoTemplateService.getAllTemplates();

    if (category) {
      templates = this.videoTemplateService.getTemplatesByCategory(category);
    }

    if (aspectRatio) {
      templates = this.videoTemplateService.getTemplatesByAspectRatio(aspectRatio);
    }

    return { templates };
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    const template = this.videoTemplateService.getTemplateById(id);
    
    if (!template) {
      throw new Error('Template not found');
    }

    const preview = this.videoTemplateService.generateTemplatePreview(id);

    return { template, preview };
  }

  @Post('templates')
  async createTemplate(
    @Request() req,
    @Body() templateData: any
  ) {
    const template = this.videoTemplateService.createCustomTemplate(templateData);
    return { template };
  }

  @Post('templates/:id/apply-branding')
  async applyBranding(
    @Param('id') id: string,
    @Request() req,
    @Body() branding: {
      primaryColor?: string;
      secondaryColor?: string;
      backgroundColor?: string;
      font?: string;
      logoUrl?: string;
    }
  ) {
    const brandedTemplate = this.videoTemplateService.applyBrandingToTemplate(id, branding);
    
    if (!brandedTemplate) {
      throw new Error('Template not found');
    }

    return { template: brandedTemplate };
  }

  @Get('templates/recommend')
  async getRecommendedTemplate(
    @Query('category') category?: string,
    @Query('aspectRatio') aspectRatio?: string,
    @Query('duration') duration?: string
  ) {
    const durationNum = duration ? parseInt(duration) : 60;
    
    const template = this.videoTemplateService.getRecommendedTemplate(
      category,
      aspectRatio,
      durationNum
    );

    return { template };
  }

  @Get('files/:id')
  async getFile(@Param('id') id: string, @Res() res: Response) {
    const fileStream = await this.mediaStorageService.getFileStream(id);
    
    if (!fileStream) {
      return res.status(404).json({ error: 'File not found' });
    }

    fileStream.pipe(res);
  }

  @Post('optimize-image')
  async optimizeImage(
    @Request() req,
    @Body() body: {
      imagePath: string;
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpg' | 'png' | 'webp';
    }
  ) {
    const optimizedImage = await this.mediaStorageService.optimizeImage(
      body.imagePath,
      {
        width: body.width,
        height: body.height,
        quality: body.quality,
        format: body.format,
      }
    );

    return { imageUrl: optimizedImage.url, mediaFile: optimizedImage };
  }

  @Post('compress-video')
  async compressVideo(
    @Request() req,
    @Body() body: {
      videoPath: string;
      bitrate?: string;
      resolution?: string;
      fps?: number;
    }
  ) {
    const compressedVideo = await this.mediaStorageService.compressVideo(
      body.videoPath,
      {
        bitrate: body.bitrate,
        resolution: body.resolution,
        fps: body.fps,
      }
    );

    return { videoUrl: compressedVideo.url, mediaFile: compressedVideo };
  }

  @Post('batch-process')
  async batchProcessMedia(
    @Request() req,
    @Body() body: {
      operations: Array<{
        type: 'optimize' | 'compress' | 'thumbnail';
        filePath: string;
        options?: any;
      }>;
    }
  ) {
    const results = [];

    for (const operation of body.operations) {
      try {
        let result;

        switch (operation.type) {
          case 'optimize':
            result = await this.mediaStorageService.optimizeImage(
              operation.filePath,
              operation.options
            );
            break;
          case 'compress':
            result = await this.mediaStorageService.compressVideo(
              operation.filePath,
              operation.options
            );
            break;
          case 'thumbnail':
            result = await this.videoRendererService.createThumbnail(
              operation.filePath,
              operation.options?.timeOffset
            );
            break;
          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }

        results.push({
          success: true,
          filePath: operation.filePath,
          result,
        });
      } catch (error) {
        results.push({
          success: false,
          filePath: operation.filePath,
          error: error.message,
        });
      }
    }

    return { results };
  }
}

