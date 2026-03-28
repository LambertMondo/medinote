import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { SpecialtiesModule } from './modules/specialties/specialties.module';
import { SlotsModule } from './modules/slots/slots.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import smtpConfig from './config/smtp.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, smtpConfig],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('database.url'),
        autoLoadEntities: true,
        synchronize: config.get<string>('app.nodeEnv') === 'development',
        logging: config.get<string>('app.nodeEnv') === 'development',
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 30,
      },
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    DoctorsModule,
    HospitalsModule,
    SpecialtiesModule,
    SlotsModule,
    AppointmentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
