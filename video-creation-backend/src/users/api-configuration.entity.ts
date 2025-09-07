import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';

@Entity('api_configurations')
@Unique(['user_id', 'service_name'])
export class ApiConfiguration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  service_name: string;

  @Column()
  api_key: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, user => user.apiConfigurations)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

