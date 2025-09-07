import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiConfiguration } from '../users/api-configuration.entity';
import axios from 'axios';

@Injectable()
export class VoiceGenerationService {
  constructor(
    @InjectRepository(ApiConfiguration)
    private apiConfigRepository: Repository<ApiConfiguration>,
  ) {}

  private async getElevenLabsKey(userId: number): Promise<string> {
    const config = await this.apiConfigRepository.findOne({
      where: { user_id: userId, service_name: 'ElevenLabs' },
    });

    if (!config) {
      throw new Error('ElevenLabs API key not configured');
    }

    return config.api_key;
  }

  private async getAWSPollyConfig(userId: number): Promise<{
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  }> {
    const config = await this.apiConfigRepository.findOne({
      where: { user_id: userId, service_name: 'AWS_Polly' },
    });

    if (!config) {
      throw new Error('AWS Polly configuration not found');
    }

    // In a real implementation, you'd store these separately
    const awsConfig = JSON.parse(config.api_key);
    return awsConfig;
  }

  async generateVoiceWithElevenLabs(
    userId: number,
    text: string,
    voiceId: string = 'pNInz6obpgDQGcFmaJgB', // Default voice
    stability: number = 0.5,
    similarityBoost: number = 0.5
  ): Promise<Buffer> {
    const apiKey = await this.getElevenLabsKey(userId);

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: stability,
          similarity_boost: similarityBoost,
        },
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        responseType: 'arraybuffer',
      }
    );

    return Buffer.from(response.data);
  }

  async generateVoiceWithPolly(
    userId: number,
    text: string,
    voiceId: string = 'Joanna',
    outputFormat: 'mp3' | 'wav' = 'mp3'
  ): Promise<Buffer> {
    // This would require AWS SDK integration
    // For now, we'll return a placeholder
    throw new Error('AWS Polly integration not implemented in this demo');
  }

  async getAvailableVoices(userId: number, service: 'elevenlabs' | 'polly' = 'elevenlabs'): Promise<any[]> {
    if (service === 'elevenlabs') {
      const apiKey = await this.getElevenLabsKey(userId);

      const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      return response.data.voices || [];
    } else {
      // Return common Polly voices
      return [
        { voice_id: 'Joanna', name: 'Joanna', gender: 'Female', language: 'en-US' },
        { voice_id: 'Matthew', name: 'Matthew', gender: 'Male', language: 'en-US' },
        { voice_id: 'Amy', name: 'Amy', gender: 'Female', language: 'en-GB' },
        { voice_id: 'Brian', name: 'Brian', gender: 'Male', language: 'en-GB' },
      ];
    }
  }

  async generateNarrationWithTimestamps(
    userId: number,
    script: string,
    voiceId?: string
  ): Promise<{
    audioBuffer: Buffer;
    timestamps: Array<{ text: string; startTime: number; endTime: number }>;
  }> {
    // Split script into sentences for better timing
    const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const timestamps: Array<{ text: string; startTime: number; endTime: number }> = [];
    
    // Generate audio for the full script
    const audioBuffer = await this.generateVoiceWithElevenLabs(userId, script, voiceId);
    
    // Estimate timestamps based on text length and average speaking rate
    // In a real implementation, you'd use speech recognition or TTS APIs that provide timing
    let currentTime = 0;
    const averageWordsPerSecond = 2.5; // Approximate speaking rate
    
    sentences.forEach((sentence) => {
      const wordCount = sentence.trim().split(/\s+/).length;
      const duration = wordCount / averageWordsPerSecond;
      
      timestamps.push({
        text: sentence.trim(),
        startTime: currentTime,
        endTime: currentTime + duration,
      });
      
      currentTime += duration + 0.5; // Add small pause between sentences
    });

    return {
      audioBuffer,
      timestamps,
    };
  }

  async cloneVoice(userId: number, audioSamples: Buffer[], voiceName: string): Promise<string> {
    const apiKey = await this.getElevenLabsKey(userId);

    // This would implement voice cloning with ElevenLabs
    // For now, we'll return a placeholder voice ID
    return 'cloned-voice-id-placeholder';
  }

  async adjustVoiceSettings(
    userId: number,
    text: string,
    voiceId: string,
    settings: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      speakerBoost?: boolean;
    }
  ): Promise<Buffer> {
    return await this.generateVoiceWithElevenLabs(
      userId,
      text,
      voiceId,
      settings.stability,
      settings.similarityBoost
    );
  }
}

