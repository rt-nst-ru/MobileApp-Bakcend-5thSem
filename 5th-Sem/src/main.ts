import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Allow large JSON payloads (Base64 images)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Global validation pipe — transforms payloads to DTO instances
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger / OpenAPI 3.0 configuration
  const config = new DocumentBuilder()
    .setTitle('Chat App API')
    .setDescription(
      'NestJS Chat Backend — Users, Conversations, and Messages with cursor-based pagination.\n\n' +
      '**Authentication**: All endpoints require an `Authorization` header in the format:\n\n' +
      '`Authorization: Basic <username>:<password>`\n\n' +
      'The `username` acts as the unique user identifier. ' +
      'The `password` is used for authentication. ' +
      'If no user exists with that username, one is created automatically.',
    )
    .setVersion('1.0')
    .addBasicAuth(
      {
        type: 'http',
        scheme: 'basic',
        description: 'Format: Basic <username>:<password>',
      },
      'basic-auth',
    )
    .addTag('users', 'User profile operations')
    .addTag('conversations', 'Conversation management')
    .addTag('messages', 'Message CRUD and pagination')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application running on http://localhost:${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/docs`);
}
bootstrap();
