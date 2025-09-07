import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Entities
import { User } from './users/user.entity';
import { UserSettings } from './users/user-settings.entity';
import { ApiConfiguration } from './users/api-configuration.entity';
import { Series } from './series/series.entity';

// Schemas
import { VideoMetadata, VideoMetadataSchema } from './videos/video-metadata.schema';

// Modules
import { AuthModule } from './auth/auth.module';
import { VideosModule } from './videos/videos.module';
import { SeriesModule } from './series/series.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT) || 5432,
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      database: process.env.POSTGRES_DB || 'video_creation_db',
      entities: [User, UserSettings, ApiConfiguration, Series],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/video_creation_db'
    ),
    MongooseModule.forFeature([
      { name: VideoMetadata.name, schema: VideoMetadataSchema }
    ]),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    BullModule.registerQueue(
      { name: 'video-processing' },
      { name: 'ai-processing' },
      { name: 'social-media-publishing' }
    ),
    AuthModule,
    VideosModule,
    SeriesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
