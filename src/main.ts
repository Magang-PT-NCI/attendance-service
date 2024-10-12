import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CERTIFICATE_FILE, KEY_FILE, PORT, SECURED } from './config/app.config';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { LoggerUtil } from './utils/logger.utils';
import { readFileSync } from 'fs';

async function bootstrap() {
  const logger = new LoggerUtil('Main');

  let httpsOptions = null;
  if (SECURED) {
    httpsOptions = {
      key: readFileSync(KEY_FILE),
      cert: readFileSync(CERTIFICATE_FILE),
    };
    logger.info('Server is running in secured mode (HTTPS)');
  } else {
    logger.info('Server is running in unsecured mode (HTTP)');
  }

  const app: INestApplication = await NestFactory.create(AppModule, {
    httpsOptions,
  });
  app.enableCors();
  logger.info('Loaded app modules');

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
    .addTag('Notification')
    .addTag('File')
    .build();
  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  logger.info('Generated Swagger API Documentation');
  logger.info('Access /api to see the API documentation');
  logger.info('Access /api-json to see the Open API json file');
  logger.info('Access /api-yaml to see the Open API yaml file');

  await app.listen(PORT);
  logger.info(`Application started on port ${PORT}`);
}

bootstrap();
