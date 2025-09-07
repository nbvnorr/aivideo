import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { SocialController } from './social.controller';
import { YouTubeService } from './youtube.service';
import { InstagramService } from './instagram.service';
import { SchedulingService } from './scheduling.service';
import { ApiConfiguration } from '../users/api-configuration.entity';
import { VideoMetadata, VideoMetadataSchema } from '../videos/video-metadata.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiConfiguration]),
    MongooseModule.forFeature([
      { name: VideoMetadata.name, schema: VideoMetadataSchema }
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [SocialController],
  providers: [YouTubeService, InstagramService, SchedulingService],
  exports: [YouTubeService, InstagramService, SchedulingService],
})
export class SocialModule {}

