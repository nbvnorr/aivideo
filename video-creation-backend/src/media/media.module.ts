import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediaController } from './media.controller';
import { VideoRendererService } from './video-renderer.service';
import { MediaStorageService } from './media-storage.service';
import { VideoTemplateService } from './video-template.service';

@Module({
  imports: [
    MulterModule.register({
      dest: '/tmp/uploads',
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
      },
    }),
  ],
  controllers: [MediaController],
  providers: [VideoRendererService, MediaStorageService, VideoTemplateService],
  exports: [VideoRendererService, MediaStorageService, VideoTemplateService],
})
export class MediaModule {}

