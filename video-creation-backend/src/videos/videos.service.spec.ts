import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VideosService } from './videos.service';
import { VideoMetadata, VideoMetadataDocument } from './video-metadata.schema';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';

describe('VideosService', () => {
  let service: VideosService;
  let model: Model<VideoMetadataDocument>;

  const mockVideoMetadata = {
    _id: 'mock-video-id',
    userId: '1',
    title: 'Test Video',
    script: 'This is a test script',
    status: 'draft',
    media: [],
    hashtags: ['test', 'video'],
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  const mockVideoModel = {
    new: jest.fn().mockResolvedValue(mockVideoMetadata),
    constructor: jest.fn().mockResolvedValue(mockVideoMetadata),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
    countDocuments: jest.fn(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          provide: getModelToken(VideoMetadata.name),
          useValue: mockVideoModel,
        },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
    model = module.get<Model<VideoMetadataDocument>>(getModelToken(VideoMetadata.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new video', async () => {
      const createVideoDto: CreateVideoDto = {
        title: 'Test Video',
        script: 'This is a test script',
        hashtags: ['test', 'video'],
      };

      mockVideoModel.create.mockResolvedValue(mockVideoMetadata);

      const result = await service.create('1', createVideoDto);

      expect(result).toEqual(mockVideoMetadata);
      expect(mockVideoModel.create).toHaveBeenCalledWith({
        userId: '1',
        ...createVideoDto,
        status: 'draft',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated videos for user', async () => {
      const mockVideos = [mockVideoMetadata];
      const mockCount = 1;

      mockVideoModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockVideos),
      });

      mockVideoModel.countDocuments.mockResolvedValue(mockCount);

      const result = await service.findAll('1', 1, 10);

      expect(result).toEqual({
        videos: mockVideos,
        total: mockCount,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(mockVideoModel.find).toHaveBeenCalledWith({ userId: '1' });
      expect(mockVideoModel.countDocuments).toHaveBeenCalledWith({ userId: '1' });
    });

    it('should filter videos by status', async () => {
      const mockVideos = [mockVideoMetadata];
      const mockCount = 1;

      mockVideoModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockVideos),
      });

      mockVideoModel.countDocuments.mockResolvedValue(mockCount);

      await service.findAll('1', 1, 10, 'published');

      expect(mockVideoModel.find).toHaveBeenCalledWith({ 
        userId: '1', 
        status: 'published' 
      });
    });
  });

  describe('findOne', () => {
    it('should return a video by id', async () => {
      mockVideoModel.findById.mockResolvedValue(mockVideoMetadata);

      const result = await service.findOne('mock-video-id');

      expect(result).toEqual(mockVideoMetadata);
      expect(mockVideoModel.findById).toHaveBeenCalledWith('mock-video-id');
    });

    it('should return null if video not found', async () => {
      mockVideoModel.findById.mockResolvedValue(null);

      const result = await service.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a video', async () => {
      const updateVideoDto: UpdateVideoDto = {
        title: 'Updated Video Title',
        status: 'published',
      };

      const updatedVideo = {
        ...mockVideoMetadata,
        ...updateVideoDto,
        updatedAt: new Date(),
      };

      mockVideoModel.findByIdAndUpdate.mockResolvedValue(updatedVideo);

      const result = await service.update('mock-video-id', updateVideoDto);

      expect(result).toEqual(updatedVideo);
      expect(mockVideoModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'mock-video-id',
        {
          ...updateVideoDto,
          updatedAt: expect.any(Date),
        },
        { new: true }
      );
    });
  });

  describe('remove', () => {
    it('should delete a video', async () => {
      mockVideoModel.findByIdAndDelete.mockResolvedValue(mockVideoMetadata);

      const result = await service.remove('mock-video-id');

      expect(result).toEqual(mockVideoMetadata);
      expect(mockVideoModel.findByIdAndDelete).toHaveBeenCalledWith('mock-video-id');
    });
  });

  describe('findBySeriesId', () => {
    it('should return videos by series id', async () => {
      const mockVideos = [mockVideoMetadata];

      mockVideoModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockVideos),
      });

      const result = await service.findBySeriesId('series-id');

      expect(result).toEqual(mockVideos);
      expect(mockVideoModel.find).toHaveBeenCalledWith({ seriesId: 'series-id' });
    });
  });

  describe('updateStatus', () => {
    it('should update video status', async () => {
      const updatedVideo = {
        ...mockVideoMetadata,
        status: 'published',
        updatedAt: new Date(),
      };

      mockVideoModel.findByIdAndUpdate.mockResolvedValue(updatedVideo);

      const result = await service.updateStatus('mock-video-id', 'published');

      expect(result).toEqual(updatedVideo);
      expect(mockVideoModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'mock-video-id',
        {
          status: 'published',
          updatedAt: expect.any(Date),
        },
        { new: true }
      );
    });
  });

  describe('getVideoAnalytics', () => {
    it('should return video analytics', async () => {
      const videoWithAnalytics = {
        ...mockVideoMetadata,
        analytics: {
          views: 1000,
          likes: 50,
          comments: 10,
          shares: 5,
        },
      };

      mockVideoModel.findById.mockResolvedValue(videoWithAnalytics);

      const result = await service.getVideoAnalytics('mock-video-id');

      expect(result).toEqual(videoWithAnalytics.analytics);
    });

    it('should return default analytics if none exist', async () => {
      mockVideoModel.findById.mockResolvedValue(mockVideoMetadata);

      const result = await service.getVideoAnalytics('mock-video-id');

      expect(result).toEqual({
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        watchTime: 0,
        engagement: 0,
      });
    });
  });

  describe('searchVideos', () => {
    it('should search videos by query', async () => {
      const mockVideos = [mockVideoMetadata];

      mockVideoModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockVideos),
      });

      const result = await service.searchVideos('1', 'test');

      expect(result).toEqual(mockVideos);
      expect(mockVideoModel.find).toHaveBeenCalledWith({
        userId: '1',
        $or: [
          { title: { $regex: 'test', $options: 'i' } },
          { script: { $regex: 'test', $options: 'i' } },
          { hashtags: { $in: [/test/i] } },
        ],
      });
    });
  });
});

