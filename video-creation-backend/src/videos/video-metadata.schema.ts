import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VideoMetadataDocument = VideoMetadata & Document;

@Schema({ collection: 'video_metadata' })
export class VideoMetadata {
  @Prop({ required: true })
  userId: string;

  @Prop()
  seriesId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  script: string;

  @Prop({ default: 'pending' })
  status: string; // pending, processing, completed, failed

  @Prop([{
    type: {
      type: String,
      enum: ['image', 'video', 'icon']
    },
    url: String,
    source: {
      type: String,
      enum: ['stock', 'generated', 'uploaded']
    }
  }])
  media: Array<{
    type: string;
    url: string;
    source: string;
  }>;

  @Prop({
    voice: String,
    text: String,
    audioUrl: String
  })
  narration: {
    voice: string;
    text: string;
    audioUrl: string;
  };

  @Prop([{
    text: String,
    startTime: Number,
    endTime: Number
  }])
  captions: Array<{
    text: string;
    startTime: number;
    endTime: number;
  }>;

  @Prop({
    style: String,
    url: String
  })
  backgroundMusic: {
    style: string;
    url: string;
  };

  @Prop([String])
  hashtags: string[];

  @Prop()
  videoUrl: string;

  @Prop()
  thumbnailUrl: string;

  @Prop()
  scheduledAt: Date;

  @Prop()
  publishedAt: Date;

  @Prop({
    youtube: String,
    tiktok: String,
    instagram: String,
    facebook: String,
    linkedin: String,
    twitter: String
  })
  socialMediaLinks: {
    youtube?: string;
    tiktok?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };

  @Prop({
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 }
  })
  analytics: {
    views: number;
    likes: number;
    shares: number;
    engagementRate: number;
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const VideoMetadataSchema = SchemaFactory.createForClass(VideoMetadata);

