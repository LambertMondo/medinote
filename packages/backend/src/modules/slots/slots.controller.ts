import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SlotsService } from './slots.service';

@Controller('slots')
export class SlotsController {
  constructor(private readonly service: SlotsService) {}

  // ── Public: get available slots ─────────────────────
  @Get('available/:doctorId')
  getAvailable(
    @Param('doctorId') doctorId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return this.service.getAvailableSlots(doctorId, fromDate, toDate);
  }

  // ── Doctor: manage templates ────────────────────────
  @Get('templates/:doctorId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  getTemplates(@Param('doctorId') doctorId: string) {
    return this.service.getTemplates(doctorId);
  }

  @Post('templates')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  createTemplate(@Body() body: any) {
    return this.service.createTemplate(body);
  }

  @Delete('templates/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  deleteTemplate(@Param('id') id: string) {
    return this.service.deleteTemplate(id);
  }

  // ── Doctor: generate slots from templates ───────────
  @Post('generate/:doctorId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  async generateSlots(
    @Param('doctorId') doctorId: string,
    @Query('days') days?: number,
  ) {
    const count = await this.service.generateSlots(doctorId, days || 30);
    return { generated: count };
  }

  // ── Doctor: block/unblock ───────────────────────────
  @Patch(':id/block')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  blockSlot(@Param('id') id: string) {
    return this.service.blockSlot(id);
  }

  @Patch(':id/unblock')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  unblockSlot(@Param('id') id: string) {
    return this.service.unblockSlot(id);
  }
}
