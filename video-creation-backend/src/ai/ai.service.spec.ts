import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiService } from './ai.service';
import { ApiConfiguration } from '../users/api-configuration.entity';

describe('AiService', () => {
  let service: AiService;
  let apiConfigRepository: Repository<ApiConfiguration>;

  const mockApiConfigRepository = {
    findOne: jest.fn(),
  };

  const mockApiConfiguration = {
    id: 1,
    user_id: 1,
    service_name: 'OpenAI',
    api_key: 'test-api-key',
    additional_config: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: getRepositoryToken(ApiConfiguration),
          useValue: mockApiConfigRepository,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    apiConfigRepository = module.get<Repository<ApiConfiguration>>(
      getRepositoryToken(ApiConfiguration),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('discoverTrendingTopics', () => {
    it('should return trending topics', async () => {
      mockApiConfigRepository.findOne.mockResolvedValue(mockApiConfiguration);

      // Mock OpenAI response
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: '1. AI in Healthcare\n2. Climate Change Solutions\n3. Remote Work Trends',
                  },
                },
              ],
            }),
          },
        },
      };

      // Mock the OpenAI constructor
      jest.doMock('openai', () => {
        return jest.fn().mockImplementation(() => mockOpenAI);
      });

      const topics = await service.discoverTrendingTopics(1);

      expect(topics).toEqual([
        'AI in Healthcare',
        'Climate Change Solutions',
        'Remote Work Trends',
      ]);
      expect(mockApiConfigRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: 1, service_name: 'OpenAI' },
      });
    });

    it('should throw error when API key not configured', async () => {
      mockApiConfigRepository.findOne.mockResolvedValue(null);

      await expect(service.discoverTrendingTopics(1)).rejects.toThrow(
        'OpenAI API key not configured',
      );
    });
  });

  describe('generateScript', () => {
    it('should generate a script for given topic', async () => {
      mockApiConfigRepository.findOne.mockResolvedValue(mockApiConfiguration);

      const mockScript = 'This is a test script about AI in healthcare...';
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: mockScript,
                  },
                },
              ],
            }),
          },
        },
      };

      jest.doMock('openai', () => {
        return jest.fn().mockImplementation(() => mockOpenAI);
      });

      const script = await service.generateScript(1, 'AI in Healthcare', 60);

      expect(script).toBe(mockScript);
      expect(mockApiConfigRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: 1, service_name: 'OpenAI' },
      });
    });
  });

  describe('generateHashtags', () => {
    it('should generate hashtags for given topic', async () => {
      mockApiConfigRepository.findOne.mockResolvedValue(mockApiConfiguration);

      const mockHashtags = 'AI\nhealthcare\ntechnology\ninnovation\nmedical';
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: mockHashtags,
                  },
                },
              ],
            }),
          },
        },
      };

      jest.doMock('openai', () => {
        return jest.fn().mockImplementation(() => mockOpenAI);
      });

      const hashtags = await service.generateHashtags(1, 'AI in Healthcare');

      expect(hashtags).toEqual(['AI', 'healthcare', 'technology', 'innovation', 'medical']);
    });
  });

  describe('generateImagePrompts', () => {
    it('should generate image prompts from script', async () => {
      mockApiConfigRepository.findOne.mockResolvedValue(mockApiConfiguration);

      const mockPrompts = 'Doctor using AI technology\nHospital with modern equipment\nPatient receiving care';
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: mockPrompts,
                  },
                },
              ],
            }),
          },
        },
      };

      jest.doMock('openai', () => {
        return jest.fn().mockImplementation(() => mockOpenAI);
      });

      const script = 'This is a script about AI in healthcare...';
      const prompts = await service.generateImagePrompts(1, script);

      expect(prompts).toEqual([
        'Doctor using AI technology',
        'Hospital with modern equipment',
        'Patient receiving care',
      ]);
    });
  });

  describe('optimizeContentForPlatform', () => {
    it('should optimize content for specific platform', async () => {
      mockApiConfigRepository.findOne.mockResolvedValue(mockApiConfiguration);

      const mockResponse = JSON.stringify({
        title: 'AI Healthcare Revolution',
        description: 'Discover how AI is transforming healthcare...',
        hashtags: ['AI', 'healthcare', 'technology'],
      });

      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: mockResponse,
                  },
                },
              ],
            }),
          },
        },
      };

      jest.doMock('openai', () => {
        return jest.fn().mockImplementation(() => mockOpenAI);
      });

      const content = 'AI in healthcare content...';
      const optimized = await service.optimizeContentForPlatform(1, content, 'youtube');

      expect(optimized).toEqual({
        title: 'AI Healthcare Revolution',
        description: 'Discover how AI is transforming healthcare...',
        hashtags: ['AI', 'healthcare', 'technology'],
      });
    });

    it('should throw error for invalid JSON response', async () => {
      mockApiConfigRepository.findOne.mockResolvedValue(mockApiConfiguration);

      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'Invalid JSON response',
                  },
                },
              ],
            }),
          },
        },
      };

      jest.doMock('openai', () => {
        return jest.fn().mockImplementation(() => mockOpenAI);
      });

      const content = 'Test content';
      
      await expect(
        service.optimizeContentForPlatform(1, content, 'youtube'),
      ).rejects.toThrow('Failed to parse AI response');
    });
  });
});

