import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const useDocker = configService.get<string>('USE_DOCKER') === 'true';
        const dbHost = useDocker
          ? configService.get<string>('DB_HOST_DOCKER', 'postgres')
          : configService.get<string>('DB_HOST', 'localhost');

        return {
          type: 'postgres',
          host: dbHost,
          port: Number(configService.get<string>('DB_PORT', '5432')),
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: configService.get<string>('PRODUCTION') !== 'true',
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
