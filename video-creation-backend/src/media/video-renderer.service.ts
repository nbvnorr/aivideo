import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface VideoSegment {
  type: 'image' | 'video' | 'text';
  content: string; // URL or text content
  duration: number; // in seconds
  startTime: number;
  endTime: number;
  effects?: {
    transition?: 'fade' | 'slide' | 'zoom';
    animation?: 'ken_burns' | 'zoom_in' | 'zoom_out';
  };
}

export interface VideoTemplate {
  name: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  resolution: string; // e.g., '1920x1080'
  fps: number;
  backgroundColor: string;
  textStyle: {
    font: string;
    size: number;
    color: string;
    position: 'top' | 'center' | 'bottom';
  };
}

@Injectable()
export class VideoRendererService {
  private readonly tempDir = '/tmp/video-processing';
  private readonly outputDir = '/tmp/video-output';

  constructor() {
    // Ensure directories exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async renderVideo(
    segments: VideoSegment[],
    audioUrl: string,
    template: VideoTemplate,
    outputFilename: string
  ): Promise<string> {
    const outputPath = path.join(this.outputDir, outputFilename);
    const tempVideoPath = path.join(this.tempDir, `temp_${Date.now()}.mp4`);

    try {
      // Step 1: Create video from segments
      await this.createVideoFromSegments(segments, template, tempVideoPath);

      // Step 2: Add audio
      await this.addAudioToVideo(tempVideoPath, audioUrl, outputPath);

      // Step 3: Clean up temporary files
      if (fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }

      return outputPath;
    } catch (error) {
      console.error('Video rendering failed:', error);
      throw new Error(`Video rendering failed: ${error.message}`);
    }
  }

  private async createVideoFromSegments(
    segments: VideoSegment[],
    template: VideoTemplate,
    outputPath: string
  ): Promise<void> {
    const filterComplex: string[] = [];
    const inputs: string[] = [];
    let inputIndex = 0;

    // Process each segment
    for (const segment of segments) {
      if (segment.type === 'image') {
        // Download image if it's a URL
        const imagePath = await this.downloadMedia(segment.content);
        inputs.push(`-loop 1 -t ${segment.duration} -i "${imagePath}"`);

        // Apply Ken Burns effect or zoom
        const effect = segment.effects?.animation || 'ken_burns';
        filterComplex.push(
          `[${inputIndex}:v]scale=${template.resolution},setsar=1,fps=${template.fps}${this.getImageEffect(effect)}[v${inputIndex}]`
        );
        inputIndex++;
      } else if (segment.type === 'video') {
        const videoPath = await this.downloadMedia(segment.content);
        inputs.push(`-i "${videoPath}"`);
        
        filterComplex.push(
          `[${inputIndex}:v]scale=${template.resolution},setsar=1,fps=${template.fps}[v${inputIndex}]`
        );
        inputIndex++;
      }
    }

    // Concatenate all video segments
    const concatFilter = segments.map((_, i) => `[v${i}]`).join('') + 
      `concat=n=${segments.length}:v=1:a=0[outv]`;
    filterComplex.push(concatFilter);

    // Build ffmpeg command
    const ffmpegCommand = [
      'ffmpeg',
      '-y', // Overwrite output file
      ...inputs.join(' ').split(' '),
      '-filter_complex',
      `"${filterComplex.join(';')}"`,
      '-map "[outv]"',
      '-c:v libx264',
      '-preset medium',
      '-crf 23',
      '-pix_fmt yuv420p',
      `"${outputPath}"`
    ].join(' ');

    await execAsync(ffmpegCommand);
  }

  private async addAudioToVideo(videoPath: string, audioUrl: string, outputPath: string): Promise<void> {
    const audioPath = await this.downloadMedia(audioUrl);

    const ffmpegCommand = [
      'ffmpeg',
      '-y',
      `-i "${videoPath}"`,
      `-i "${audioPath}"`,
      '-c:v copy',
      '-c:a aac',
      '-map 0:v:0',
      '-map 1:a:0',
      '-shortest', // End when shortest stream ends
      `"${outputPath}"`
    ].join(' ');

    await execAsync(ffmpegCommand);

    // Clean up temporary audio file
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
  }

  async addSubtitles(
    videoPath: string,
    subtitles: Array<{ text: string; startTime: number; endTime: number }>,
    outputPath: string,
    style?: {
      fontSize?: number;
      fontColor?: string;
      backgroundColor?: string;
      position?: 'top' | 'center' | 'bottom';
    }
  ): Promise<void> {
    // Create SRT subtitle file
    const srtPath = path.join(this.tempDir, `subtitles_${Date.now()}.srt`);
    const srtContent = this.generateSRTContent(subtitles);
    fs.writeFileSync(srtPath, srtContent);

    const fontSize = style?.fontSize || 24;
    const fontColor = style?.fontColor || 'white';
    const backgroundColor = style?.backgroundColor || 'black@0.5';
    const position = this.getSubtitlePosition(style?.position || 'bottom');

    const ffmpegCommand = [
      'ffmpeg',
      '-y',
      `-i "${videoPath}"`,
      `-vf "subtitles='${srtPath}':force_style='FontSize=${fontSize},PrimaryColour=${fontColor},BackColour=${backgroundColor},Alignment=${position}'"`,
      '-c:a copy',
      `"${outputPath}"`
    ].join(' ');

    await execAsync(ffmpegCommand);

    // Clean up subtitle file
    if (fs.existsSync(srtPath)) {
      fs.unlinkSync(srtPath);
    }
  }

  async addBackgroundMusic(
    videoPath: string,
    musicUrl: string,
    outputPath: string,
    volume: number = 0.3
  ): Promise<void> {
    const musicPath = await this.downloadMedia(musicUrl);

    const ffmpegCommand = [
      'ffmpeg',
      '-y',
      `-i "${videoPath}"`,
      `-i "${musicPath}"`,
      '-filter_complex',
      `"[1:a]volume=${volume}[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2"`,
      '-c:v copy',
      '-c:a aac',
      `"${outputPath}"`
    ].join(' ');

    await execAsync(ffmpegCommand);

    // Clean up temporary music file
    if (fs.existsSync(musicPath)) {
      fs.unlinkSync(musicPath);
    }
  }

  async createThumbnail(videoPath: string, timeOffset: number = 1): Promise<string> {
    const thumbnailPath = path.join(this.outputDir, `thumbnail_${Date.now()}.jpg`);

    const ffmpegCommand = [
      'ffmpeg',
      '-y',
      `-i "${videoPath}"`,
      `-ss ${timeOffset}`,
      '-vframes 1',
      '-q:v 2',
      `"${thumbnailPath}"`
    ].join(' ');

    await execAsync(ffmpegCommand);
    return thumbnailPath;
  }

  async optimizeForPlatform(
    inputPath: string,
    platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook',
    outputPath: string
  ): Promise<void> {
    const platformSpecs = {
      youtube: {
        resolution: '1920x1080',
        bitrate: '8000k',
        fps: 30,
        format: 'mp4'
      },
      tiktok: {
        resolution: '1080x1920',
        bitrate: '6000k',
        fps: 30,
        format: 'mp4'
      },
      instagram: {
        resolution: '1080x1080',
        bitrate: '5000k',
        fps: 30,
        format: 'mp4'
      },
      facebook: {
        resolution: '1920x1080',
        bitrate: '6000k',
        fps: 30,
        format: 'mp4'
      }
    };

    const spec = platformSpecs[platform];

    const ffmpegCommand = [
      'ffmpeg',
      '-y',
      `-i "${inputPath}"`,
      `-vf "scale=${spec.resolution}:force_original_aspect_ratio=decrease,pad=${spec.resolution}:(ow-iw)/2:(oh-ih)/2"`,
      `-b:v ${spec.bitrate}`,
      `-r ${spec.fps}`,
      '-c:v libx264',
      '-preset medium',
      '-c:a aac',
      '-b:a 128k',
      `"${outputPath}"`
    ].join(' ');

    await execAsync(ffmpegCommand);
  }

  private async downloadMedia(url: string): Promise<string> {
    // If it's already a local file path, return it
    if (!url.startsWith('http')) {
      return url;
    }

    // For demo purposes, we'll create placeholder files
    // In a real implementation, you would download the actual media
    const extension = url.includes('.mp3') ? '.mp3' : 
                     url.includes('.wav') ? '.wav' : 
                     url.includes('.mp4') ? '.mp4' : '.jpg';
    
    const filename = `media_${Date.now()}${extension}`;
    const filepath = path.join(this.tempDir, filename);

    // Create a placeholder file
    if (extension === '.jpg') {
      // Create a solid color image using ffmpeg
      await execAsync(`ffmpeg -y -f lavfi -i color=c=blue:size=1920x1080:d=1 -frames:v 1 "${filepath}"`);
    } else if (extension === '.mp3' || extension === '.wav') {
      // Create a silent audio file
      await execAsync(`ffmpeg -y -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -t 1 "${filepath}"`);
    } else if (extension === '.mp4') {
      // Create a test video
      await execAsync(`ffmpeg -y -f lavfi -i testsrc=duration=1:size=1920x1080:rate=30 "${filepath}"`);
    }

    return filepath;
  }

  private getImageEffect(effect: string): string {
    switch (effect) {
      case 'zoom_in':
        return ',zoompan=z=\'min(zoom+0.0015,1.5)\':d=125';
      case 'zoom_out':
        return ',zoompan=z=\'max(zoom-0.0015,1)\':d=125';
      case 'ken_burns':
        return ',zoompan=z=\'min(max(zoom,pzoom)+0.0015,1.5)\':d=125:x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\'';
      default:
        return '';
    }
  }

  private generateSRTContent(subtitles: Array<{ text: string; startTime: number; endTime: number }>): string {
    return subtitles.map((subtitle, index) => {
      const startTime = this.formatSRTTime(subtitle.startTime);
      const endTime = this.formatSRTTime(subtitle.endTime);
      
      return `${index + 1}\n${startTime} --> ${endTime}\n${subtitle.text}\n`;
    }).join('\n');
  }

  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }

  private getSubtitlePosition(position: string): number {
    switch (position) {
      case 'top': return 6;
      case 'center': return 5;
      case 'bottom': return 2;
      default: return 2;
    }
  }
}

