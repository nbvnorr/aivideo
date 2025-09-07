import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SeriesService } from './series.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('series')
@UseGuards(JwtAuthGuard)
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Post()
  create(@Body() createSeriesDto: CreateSeriesDto, @Request() req) {
    return this.seriesService.create(createSeriesDto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.seriesService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.seriesService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSeriesDto: UpdateSeriesDto, @Request() req) {
    return this.seriesService.update(+id, updateSeriesDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.seriesService.remove(+id, req.user.id);
  }

  @Post(':id/generate-next')
  generateNext(@Param('id') id: string, @Request() req) {
    return this.seriesService.generateNextVideo(+id, req.user.id);
  }

  @Get(':id/videos')
  getSeriesVideos(@Param('id') id: string, @Request() req) {
    return this.seriesService.getSeriesVideos(+id, req.user.id);
  }
}

