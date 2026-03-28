import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DoctorsService, DoctorFilters } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly service: DoctorsService) {}

  @Get()
  findAll(
    @Query('specialtyId') specialtyId?: string,
    @Query('hospitalId') hospitalId?: string,
    @Query('city') city?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters: DoctorFilters = { specialtyId, hospitalId, city, search, page, limit };
    return this.service.findAll(filters);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }
}
