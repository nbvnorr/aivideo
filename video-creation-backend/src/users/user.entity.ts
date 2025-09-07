import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { UserSettings } from './user-settings.entity';
import { Series } from '../series/series.entity';
import { ApiConfiguration } from './api-configuration.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => UserSettings, userSettings => userSettings.user)
  settings: UserSettings;

  @OneToMany(() => Series, series => series.user)
  series: Series[];

  @OneToMany(() => ApiConfiguration, apiConfig => apiConfig.user)
  apiConfigurations: ApiConfiguration[];
}

