import { Injectable } from '@nestjs/common';

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: 'explainer' | 'social' | 'news' | 'educational' | 'promotional';
  aspectRatio: '16:9' | '9:16' | '1:1';
  resolution: string;
  fps: number;
  duration: number; // default duration in seconds
  backgroundColor: string;
  textStyle: {
    font: string;
    primarySize: number;
    secondarySize: number;
    primaryColor: string;
    secondaryColor: string;
    position: 'top' | 'center' | 'bottom';
    alignment: 'left' | 'center' | 'right';
  };
  transitions: {
    type: 'fade' | 'slide' | 'zoom' | 'wipe';
    duration: number;
  };
  animations: {
    imageEffect: 'ken_burns' | 'zoom_in' | 'zoom_out' | 'static';
    textEffect: 'fade_in' | 'slide_up' | 'typewriter' | 'none';
  };
  layout: {
    imageDisplayTime: number;
    textDisplayTime: number;
    overlayOpacity: number;
  };
  branding: {
    logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    logoSize: 'small' | 'medium' | 'large';
    watermarkOpacity: number;
  };
}

@Injectable()
export class VideoTemplateService {
  private templates: VideoTemplate[] = [
    {
      id: 'modern-explainer',
      name: 'Modern Explainer',
      description: 'Clean and professional template for educational content',
      category: 'explainer',
      aspectRatio: '16:9',
      resolution: '1920x1080',
      fps: 30,
      duration: 60,
      backgroundColor: '#1a1a1a',
      textStyle: {
        font: 'Inter',
        primarySize: 48,
        secondarySize: 24,
        primaryColor: '#ffffff',
        secondaryColor: '#cccccc',
        position: 'bottom',
        alignment: 'center',
      },
      transitions: {
        type: 'fade',
        duration: 0.5,
      },
      animations: {
        imageEffect: 'ken_burns',
        textEffect: 'fade_in',
      },
      layout: {
        imageDisplayTime: 3,
        textDisplayTime: 2,
        overlayOpacity: 0.7,
      },
      branding: {
        logoPosition: 'bottom-right',
        logoSize: 'small',
        watermarkOpacity: 0.8,
      },
    },
    {
      id: 'tiktok-viral',
      name: 'TikTok Viral',
      description: 'Vertical format optimized for TikTok and Instagram Reels',
      category: 'social',
      aspectRatio: '9:16',
      resolution: '1080x1920',
      fps: 30,
      duration: 30,
      backgroundColor: '#000000',
      textStyle: {
        font: 'Poppins',
        primarySize: 64,
        secondarySize: 32,
        primaryColor: '#ffffff',
        secondaryColor: '#ff6b6b',
        position: 'center',
        alignment: 'center',
      },
      transitions: {
        type: 'zoom',
        duration: 0.3,
      },
      animations: {
        imageEffect: 'zoom_in',
        textEffect: 'slide_up',
      },
      layout: {
        imageDisplayTime: 2,
        textDisplayTime: 1.5,
        overlayOpacity: 0.5,
      },
      branding: {
        logoPosition: 'top-right',
        logoSize: 'medium',
        watermarkOpacity: 0.9,
      },
    },
    {
      id: 'instagram-square',
      name: 'Instagram Square',
      description: 'Square format perfect for Instagram posts',
      category: 'social',
      aspectRatio: '1:1',
      resolution: '1080x1080',
      fps: 30,
      duration: 45,
      backgroundColor: '#f8f9fa',
      textStyle: {
        font: 'Montserrat',
        primarySize: 42,
        secondarySize: 24,
        primaryColor: '#2c3e50',
        secondaryColor: '#7f8c8d',
        position: 'bottom',
        alignment: 'center',
      },
      transitions: {
        type: 'slide',
        duration: 0.4,
      },
      animations: {
        imageEffect: 'zoom_out',
        textEffect: 'typewriter',
      },
      layout: {
        imageDisplayTime: 3.5,
        textDisplayTime: 2.5,
        overlayOpacity: 0.6,
      },
      branding: {
        logoPosition: 'bottom-left',
        logoSize: 'small',
        watermarkOpacity: 0.7,
      },
    },
    {
      id: 'news-broadcast',
      name: 'News Broadcast',
      description: 'Professional news-style template with lower thirds',
      category: 'news',
      aspectRatio: '16:9',
      resolution: '1920x1080',
      fps: 25,
      duration: 90,
      backgroundColor: '#0f1419',
      textStyle: {
        font: 'Roboto',
        primarySize: 36,
        secondarySize: 20,
        primaryColor: '#ffffff',
        secondaryColor: '#e74c3c',
        position: 'bottom',
        alignment: 'left',
      },
      transitions: {
        type: 'wipe',
        duration: 0.6,
      },
      animations: {
        imageEffect: 'static',
        textEffect: 'slide_up',
      },
      layout: {
        imageDisplayTime: 4,
        textDisplayTime: 3,
        overlayOpacity: 0.8,
      },
      branding: {
        logoPosition: 'top-left',
        logoSize: 'large',
        watermarkOpacity: 1.0,
      },
    },
    {
      id: 'educational-course',
      name: 'Educational Course',
      description: 'Clean template for online courses and tutorials',
      category: 'educational',
      aspectRatio: '16:9',
      resolution: '1920x1080',
      fps: 30,
      duration: 120,
      backgroundColor: '#ffffff',
      textStyle: {
        font: 'Source Sans Pro',
        primarySize: 44,
        secondarySize: 26,
        primaryColor: '#2c3e50',
        secondaryColor: '#3498db',
        position: 'center',
        alignment: 'center',
      },
      transitions: {
        type: 'fade',
        duration: 0.8,
      },
      animations: {
        imageEffect: 'ken_burns',
        textEffect: 'fade_in',
      },
      layout: {
        imageDisplayTime: 5,
        textDisplayTime: 4,
        overlayOpacity: 0.9,
      },
      branding: {
        logoPosition: 'center',
        logoSize: 'medium',
        watermarkOpacity: 0.6,
      },
    },
    {
      id: 'promotional-ad',
      name: 'Promotional Ad',
      description: 'Eye-catching template for product promotions and ads',
      category: 'promotional',
      aspectRatio: '16:9',
      resolution: '1920x1080',
      fps: 30,
      duration: 30,
      backgroundColor: '#e74c3c',
      textStyle: {
        font: 'Oswald',
        primarySize: 56,
        secondarySize: 28,
        primaryColor: '#ffffff',
        secondaryColor: '#f39c12',
        position: 'center',
        alignment: 'center',
      },
      transitions: {
        type: 'zoom',
        duration: 0.2,
      },
      animations: {
        imageEffect: 'zoom_in',
        textEffect: 'slide_up',
      },
      layout: {
        imageDisplayTime: 2,
        textDisplayTime: 1,
        overlayOpacity: 0.4,
      },
      branding: {
        logoPosition: 'bottom-center',
        logoSize: 'large',
        watermarkOpacity: 1.0,
      },
    },
  ];

  getAllTemplates(): VideoTemplate[] {
    return this.templates;
  }

  getTemplateById(id: string): VideoTemplate | null {
    return this.templates.find(template => template.id === id) || null;
  }

  getTemplatesByCategory(category: string): VideoTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  getTemplatesByAspectRatio(aspectRatio: '16:9' | '9:16' | '1:1'): VideoTemplate[] {
    return this.templates.filter(template => template.aspectRatio === aspectRatio);
  }

  createCustomTemplate(template: Omit<VideoTemplate, 'id'>): VideoTemplate {
    const newTemplate: VideoTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
    };
    
    this.templates.push(newTemplate);
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<VideoTemplate>): VideoTemplate | null {
    const templateIndex = this.templates.findIndex(template => template.id === id);
    
    if (templateIndex === -1) {
      return null;
    }

    this.templates[templateIndex] = {
      ...this.templates[templateIndex],
      ...updates,
    };

    return this.templates[templateIndex];
  }

  deleteTemplate(id: string): boolean {
    const templateIndex = this.templates.findIndex(template => template.id === id);
    
    if (templateIndex === -1) {
      return false;
    }

    this.templates.splice(templateIndex, 1);
    return true;
  }

  getRecommendedTemplate(
    category: string,
    aspectRatio: string,
    duration: number
  ): VideoTemplate | null {
    // Find templates that match the criteria
    let candidates = this.templates.filter(template => {
      const categoryMatch = !category || template.category === category;
      const aspectRatioMatch = !aspectRatio || template.aspectRatio === aspectRatio;
      const durationMatch = Math.abs(template.duration - duration) <= 30; // Within 30 seconds
      
      return categoryMatch && aspectRatioMatch && durationMatch;
    });

    // If no exact matches, relax the duration constraint
    if (candidates.length === 0) {
      candidates = this.templates.filter(template => {
        const categoryMatch = !category || template.category === category;
        const aspectRatioMatch = !aspectRatio || template.aspectRatio === aspectRatio;
        
        return categoryMatch && aspectRatioMatch;
      });
    }

    // Return the first match or null if no matches
    return candidates.length > 0 ? candidates[0] : null;
  }

  applyBrandingToTemplate(
    templateId: string,
    branding: {
      primaryColor?: string;
      secondaryColor?: string;
      backgroundColor?: string;
      font?: string;
      logoUrl?: string;
    }
  ): VideoTemplate | null {
    const template = this.getTemplateById(templateId);
    
    if (!template) {
      return null;
    }

    const brandedTemplate: VideoTemplate = {
      ...template,
      id: `branded-${template.id}-${Date.now()}`,
      name: `${template.name} (Branded)`,
      backgroundColor: branding.backgroundColor || template.backgroundColor,
      textStyle: {
        ...template.textStyle,
        font: branding.font || template.textStyle.font,
        primaryColor: branding.primaryColor || template.textStyle.primaryColor,
        secondaryColor: branding.secondaryColor || template.textStyle.secondaryColor,
      },
    };

    return brandedTemplate;
  }

  generateTemplatePreview(templateId: string): {
    previewUrl: string;
    thumbnailUrl: string;
  } {
    // In a real implementation, this would generate actual preview images/videos
    return {
      previewUrl: `https://placeholder.com/preview/${templateId}.mp4`,
      thumbnailUrl: `https://placeholder.com/thumbnail/${templateId}.jpg`,
    };
  }
}

