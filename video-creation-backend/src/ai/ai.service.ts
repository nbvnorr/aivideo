import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiConfiguration } from '../users/api-configuration.entity';
import OpenAI from 'openai';

@Injectable()
export class AiService {
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

  async discoverTrendingTopics(userId: number, category?: string): Promise<string[]> {
    const openai = await this.getOpenAIClient(userId);

    const prompt = `Generate 10 trending and engaging video topics ${
      category ? `in the ${category} category` : 'across various categories'
    }. Focus on topics that would perform well on social media platforms like YouTube, TikTok, and Instagram. Return only the topic titles, one per line.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a social media content strategist who identifies viral and trending topics.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.8,
    });

    const topics = response.choices[0].message.content
      ?.split('\n')
      .filter(topic => topic.trim().length > 0)
      .map(topic => topic.replace(/^\d+\.\s*/, '').trim()) || [];

    return topics;
  }

  async generateScript(userId: number, topic: string, duration: number = 60): Promise<string> {
    const openai = await this.getOpenAIClient(userId);

    const prompt = `Create an engaging ${duration}-second video script about "${topic}". 
    The script should be:
    - Attention-grabbing from the first second
    - Informative and valuable
    - Optimized for social media engagement
    - Include natural pauses for visuals
    - End with a strong call-to-action
    
    Format the script with clear narration text and [VISUAL CUE] markers for where images or graphics should appear.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional video script writer specializing in social media content.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0].message.content || '';
  }

  async generateHashtags(userId: number, topic: string, platform: string = 'general'): Promise<string[]> {
    const openai = await this.getOpenAIClient(userId);

    const prompt = `Generate 15-20 relevant hashtags for a video about "${topic}" ${
      platform !== 'general' ? `optimized for ${platform}` : 'for general social media use'
    }. 
    Include a mix of:
    - Popular trending hashtags
    - Niche-specific hashtags
    - Branded hashtags
    - Long-tail hashtags
    
    Return only the hashtags without the # symbol, one per line.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a social media hashtag expert who understands platform algorithms and trending topics.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.6,
    });

    const hashtags = response.choices[0].message.content
      ?.split('\n')
      .filter(tag => tag.trim().length > 0)
      .map(tag => tag.trim().replace(/^#/, '')) || [];

    return hashtags;
  }

  async generateImagePrompts(userId: number, script: string): Promise<string[]> {
    const openai = await this.getOpenAIClient(userId);

    const prompt = `Analyze this video script and generate 5-8 detailed image generation prompts for the visual elements:

    Script: "${script}"

    For each visual cue or concept in the script, create a detailed prompt that would generate an appropriate image. Each prompt should be:
    - Descriptive and specific
    - Suitable for AI image generation
    - Visually engaging
    - Relevant to the script content

    Return only the image prompts, one per line.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating detailed prompts for AI image generation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const prompts = response.choices[0].message.content
      ?.split('\n')
      .filter(prompt => prompt.trim().length > 0)
      .map(prompt => prompt.trim()) || [];

    return prompts;
  }

  async optimizeContentForPlatform(
    userId: number,
    content: string,
    platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook'
  ): Promise<{
    title: string;
    description: string;
    hashtags: string[];
  }> {
    const openai = await this.getOpenAIClient(userId);

    const platformSpecs = {
      youtube: 'YouTube (longer descriptions, SEO-focused titles, educational tone)',
      tiktok: 'TikTok (short, catchy titles, trending hashtags, casual tone)',
      instagram: 'Instagram (visual-focused descriptions, lifestyle hashtags, engaging tone)',
      facebook: 'Facebook (community-focused, longer descriptions, discussion-encouraging)',
    };

    const prompt = `Optimize this video content for ${platformSpecs[platform]}:

    Content: "${content}"

    Generate:
    1. An optimized title (${platform === 'youtube' ? '60 characters max' : '30 characters max'})
    2. A platform-appropriate description (${platform === 'tiktok' ? '150 characters max' : '500 characters max'})
    3. 10-15 relevant hashtags for this platform

    Format as JSON:
    {
      "title": "...",
      "description": "...",
      "hashtags": ["tag1", "tag2", ...]
    }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a social media optimization expert specializing in ${platform} content.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 600,
      temperature: 0.6,
    });

    try {
      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        title: result.title || '',
        description: result.description || '',
        hashtags: result.hashtags || [],
      };
    } catch (error) {
      throw new Error('Failed to parse AI response');
    }
  }
}

