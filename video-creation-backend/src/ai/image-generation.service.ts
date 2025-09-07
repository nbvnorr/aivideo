import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiConfiguration } from '../users/api-configuration.entity';
import OpenAI from 'openai';
import axios from 'axios';

@Injectable()
export class ImageGenerationService {
  constructor(
    @InjectRepository(ApiConfiguration)
    private apiConfigRepository: Repository<ApiConfiguration>,
  ) {}

  private async getOpenAIClient(userId: number): Promise<OpenAI> {
    const config = await this.apiConfigRepository.findOne({
      where: { user_id: userId, service_name: 'OpenAI' },
    });

    if (!config) {
      throw new Error('OpenAI API key not configured');
    }

    return new OpenAI({
      apiKey: config.api_key,
    });
  }

  private async getStabilityAIKey(userId: number): Promise<string> {
    const config = await this.apiConfigRepository.findOne({
      where: { user_id: userId, service_name: 'StabilityAI' },
    });

    if (!config) {
      throw new Error('Stability AI API key not configured');
    }

    return config.api_key;
  }

  async generateImageWithDALLE(
    userId: number,
    prompt: string,
    size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024'
  ): Promise<string> {
    const openai = await this.getOpenAIClient(userId);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: size,
      quality: 'standard',
    });

    return response.data[0].url || '';
  }

  async generateImageWithStability(
    userId: number,
    prompt: string,
    aspectRatio: '16:9' | '1:1' | '9:16' = '16:9'
  ): Promise<string> {
    const apiKey = await this.getStabilityAIKey(userId);

    const response = await axios.post(
      'https://api.stability.ai/v2beta/stable-image/generate/ultra',
      {
        prompt: prompt,
        aspect_ratio: aspectRatio,
        output_format: 'png',
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'image/*',
        },
        responseType: 'arraybuffer',
      }
    );

    // In a real implementation, you would upload this to S3 and return the URL
    // For now, we'll return a placeholder
    return 'https://placeholder-image-url.com/generated-image.png';
  }

  async generateMultipleImages(
    userId: number,
    prompts: string[],
    service: 'dalle' | 'stability' = 'dalle'
  ): Promise<string[]> {
    const imageUrls: string[] = [];

    for (const prompt of prompts) {
      try {
        let imageUrl: string;
        
        if (service === 'dalle') {
          imageUrl = await this.generateImageWithDALLE(userId, prompt);
        } else {
          imageUrl = await this.generateImageWithStability(userId, prompt);
        }
        
        imageUrls.push(imageUrl);
      } catch (error) {
        console.error(`Failed to generate image for prompt: ${prompt}`, error);
        // Add a placeholder for failed generations
        imageUrls.push('https://placeholder.com/400x300?text=Image+Generation+Failed');
      }
    }

    return imageUrls;
  }

  async generateThumbnail(
    userId: number,
    title: string,
    style: 'youtube' | 'tiktok' | 'instagram' = 'youtube'
  ): Promise<string> {
    const stylePrompts = {
      youtube: 'YouTube thumbnail style, bold text overlay, high contrast, eye-catching design',
      tiktok: 'TikTok style thumbnail, vertical format, trendy and colorful',
      instagram: 'Instagram post style, square format, aesthetic and clean design',
    };

    const prompt = `Create a professional thumbnail for a video titled "${title}". ${stylePrompts[style]}. The image should be engaging, high-quality, and optimized for social media. Include relevant visual elements that represent the video content.`;

    return await this.generateImageWithDALLE(userId, prompt, '1792x1024');
  }

  async enhanceImagePrompt(userId: number, basicPrompt: string): Promise<string> {
    const openai = await this.getOpenAIClient(userId);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating detailed, high-quality prompts for AI image generation. Enhance prompts to be more specific, visually descriptive, and likely to produce professional results.',
        },
        {
          role: 'user',
          content: `Enhance this image generation prompt to be more detailed and specific: "${basicPrompt}"`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0].message.content || basicPrompt;
  }
}

