import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ nullable: true })
  brand_color: string;

  @Column({ nullable: true })
  font: string;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ nullable: true })
  intro_clip_url: string;

  @Column({ nullable: true })
  outro_clip_url: string;

  @Column({ nullable: true })
  default_voice_style: string;

  @Column({ nullable: true })
  default_music_style: string;

  @Column({ nullable: true })
  default_template: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => User, user => user.settings)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

