import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { Series } from './series.entity';
import { VideoMetadata, VideoMetadataDocument } from '../videos/video-metadata.schema';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Series)
    private seriesRepository: Repository<Series>,
    @InjectModel(VideoMetadata.name)
    private videoMetadataModel: Model<VideoMetadataDocument>,
    @InjectQueue('ai-processing')
    private aiProcessingQueue: Queue,
  ) {}

  async create(createSeriesDto: CreateSeriesDto, userId: number): Promise<Series> {
    const series = this.seriesRepository.create({
      ...createSeriesDto,
      user_id: userId,
    });

    const savedSeries = await this.seriesRepository.save(series);

    // Schedule AI content generation for this series
    await this.aiProcessingQueue.add('schedule-series-content', {
      seriesId: savedSeries.id,
      userId,
      frequency: createSeriesDto.frequency,
    });

    return savedSeries;
  }

  async findAll(userId: number): Promise<Series[]> {
    return this.seriesRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Series> {
    const series = await this.seriesRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!series) {
      throw new NotFoundException('Series not found');
    }

    return series;
  }

  async update(id: number, updateSeriesDto: UpdateSeriesDto, userId: number): Promise<Series> {
    const series = await this.findOne(id, userId);
    
    Object.assign(series, updateSeriesDto);
    series.updated_at = new Date();
    
    return this.seriesRepository.save(series);
  }

  async remove(id: number, userId: number): Promise<void> {
    const series = await this.findOne(id, userId);
    
    // Also remove all videos in this series
    await this.videoMetadataModel.deleteMany({ seriesId: id.toString() });
    
    await this.seriesRepository.remove(series);
  }

  async generateNextVideo(id: number, userId: number): Promise<any> {
    const series = await this.findOne(id, userId);
    
    // Add AI content generation job to queue
    await this.aiProcessingQueue.add('generate-series-video', {
      seriesId: id,
      userId,
      seriesTitle: series.title,
      seriesDescription: series.description,
    });
    
    return { message: 'Video generation started', seriesId: id };
  }

  async getSeriesVideos(id: number, userId: number): Promise<VideoMetadata[]> {
    await this.findOne(id, userId); // Verify access
    
    return this.videoMetadataModel
      .find({ seriesId: id.toString() })
      .sort({ createdAt: -1 })
      .exec();
  }
}

