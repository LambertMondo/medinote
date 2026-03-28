import {
  Controller, Post, Patch, Get,
  Param, Body, Query, Request,
  UseGuards, HttpCode, HttpStatus, Ip,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'))
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Post()
  async book(
    @Request() req: any,
    @Body('slotId') slotId: string,
    @Body('reason') reason: string,
    @Ip() ip: string,
  ) {
    return this.service.book(req.user.sub, slotId, reason, ip);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    return this.service.cancel(id, req.user.sub, ip);
  }

  @Get('me')
  getMyAppointments(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getPatientAppointments(req.user.sub, page, limit);
  }

  @Get('doctor/:doctorId')
  @UseGuards(RolesGuard)
  @Roles('doctor', 'admin')
  getDoctorAppointments(
    @Param('doctorId') doctorId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getDoctorAppointments(doctorId, page, limit);
  }
}
