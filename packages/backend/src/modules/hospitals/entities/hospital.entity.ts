import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('hospitals')
export class Hospital {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  address: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;
}
