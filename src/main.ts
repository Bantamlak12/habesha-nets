import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set a global validation pipeline
  // Set Global validation pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Habesha Nets Backend')
    .setDescription('The habesha nets APIs description.')
    .setVersion('1.0')
    .addTag('Habesha Nets Backend APIs')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
