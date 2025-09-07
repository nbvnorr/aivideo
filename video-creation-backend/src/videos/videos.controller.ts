import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('videos')
@UseGuards(JwtAuthGuard)
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  create(@Body() createVideoDto: CreateVideoDto, @Request() req) {
    return this.videosService.create(createVideoDto, req.user.id);
  }

  @Get()
  findAll(@Request() req, @Query() query: any) {
    return this.videosService.findAll(req.user.id, query);
  }

  @Get('dashboard-stats')
  getDashboardStats(@Request() req) {
    return this.videosService.getDashboardStats(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.videosService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVideoDto: UpdateVideoDto, @Request() req) {
    return this.videosService.update(id, updateVideoDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.videosService.remove(id, req.user.id);
  }

  @Post(':id/generate')
  generateVideo(@Param('id') id: string, @Request() req) {
    return this.videosService.generateVideo(id, req.user.id);
  }

  @Post(':id/schedule')
  scheduleVideo(@Param('id') id: string, @Body() scheduleData: any, @Request() req) {
    return this.videosService.scheduleVideo(id, scheduleData, req.user.id);
  }

  @Post(':id/publish')
  publishVideo(@Param('id') id: string, @Body() publishData: any, @Request() req) {
    return this.videosService.publishVideo(id, publishData, req.user.id);
  }
}

