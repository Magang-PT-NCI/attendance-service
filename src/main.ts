import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PORT } from './config/app.config';
import { INestApplication } from '@nestjs/common';
import { logger } from './utils/logger.utils';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule);
  app.enableCors();

  logger.info(`Application started on port ${PORT}`);

  const config: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
    .setTitle('Attendance Service API')
    .setDescription('API documentation for Attendance Service')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'jwt',
    )
    .addTag('Attendance')
    .addTag('Logbook')
    .addTag('Monitoring')
    .addTag('Permit')

    .build();
  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(PORT);
}
bootstrap();
