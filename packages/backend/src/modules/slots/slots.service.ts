import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ScheduleTemplate } from './entities/schedule-template.entity';
import { Slot, SlotStatus } from './entities/slot.entity';

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(ScheduleTemplate)
    private readonly templateRepo: Repository<ScheduleTemplate>,
    @InjectRepository(Slot)
    private readonly slotRepo: Repository<Slot>,
  ) {}

  // ── Schedule Templates ──────────────────────────────

  async createTemplate(data: Partial<ScheduleTemplate>): Promise<ScheduleTemplate> {
    const entity = this.templateRepo.create(data);
    return this.templateRepo.save(entity);
  }

  async getTemplates(doctorId: string): Promise<ScheduleTemplate[]> {
    return this.templateRepo.find({
      where: { doctorId, isActive: true },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.templateRepo.update(id, { isActive: false });
  }

  // ── Slot Generation ─────────────────────────────────

  async generateSlots(doctorId: string, daysAhead: number = 30): Promise<number> {
    const templates = await this.getTemplates(doctorId);
    if (!templates.length) return 0;

    const now = new Date();
    let count = 0;

    for (let d = 0; d < daysAhead; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      const dayOfWeek = date.getDay();

      const matchingTemplates = templates.filter((t) => t.dayOfWeek === dayOfWeek);

      for (const template of matchingTemplates) {
        const [startH, startM] = template.startTime.split(':').map(Number);
        const [endH, endM] = template.endTime.split(':').map(Number);

        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        for (let m = startMinutes; m < endMinutes; m += template.slotDurationMinutes) {
          const slotStart = new Date(date);
          slotStart.setHours(Math.floor(m / 60), m % 60, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + template.slotDurationMinutes);

          // Skip past slots
          if (slotStart < now) continue;

          // Check if slot already exists
          const existing = await this.slotRepo.findOne({
            where: { doctorId, startAt: slotStart },
          });

          if (!existing) {
            await this.slotRepo.save(
              this.slotRepo.create({
                doctorId,
                startAt: slotStart,
                endAt: slotEnd,
                status: SlotStatus.AVAILABLE,
              }),
            );
            count++;
          }
        }
      }
    }

    return count;
  }

  // ── Available Slots (Patient view) ──────────────────

  async getAvailableSlots(doctorId: string, from: Date, to: Date): Promise<Slot[]> {
    return this.slotRepo.find({
      where: {
        doctorId,
        status: SlotStatus.AVAILABLE,
        startAt: Between(from, to),
      },
      order: { startAt: 'ASC' },
    });
  }

  async findSlotById(id: string): Promise<Slot> {
    const slot = await this.slotRepo.findOne({ where: { id } });
    if (!slot) throw new NotFoundException('Slot not found');
    return slot;
  }

  // ── Block/Unblock (Doctor) ──────────────────────────

  async blockSlot(id: string): Promise<Slot> {
    const slot = await this.findSlotById(id);
    slot.status = SlotStatus.BLOCKED;
    return this.slotRepo.save(slot);
  }

  async unblockSlot(id: string): Promise<Slot> {
    const slot = await this.findSlotById(id);
    slot.status = SlotStatus.AVAILABLE;
    return this.slotRepo.save(slot);
  }
}
