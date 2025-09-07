import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ImageGenerationService } from './image-generation.service';
import { VoiceGenerationService } from './voice-generation.service';
import { ApiConfiguration } from '../users/api-configuration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiConfiguration])],
  controllers: [AiController],
  providers: [AiService, ImageGenerationService, VoiceGenerationService],
  exports: [AiService, ImageGenerationService, VoiceGenerationService],
})
export class AiModule {}

