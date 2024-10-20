import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use('/subscription/webhook', bodyParser.raw({ type: 'application/json' }));

  app.enableCors({
    origin: ['https://tzvsnwkl-3000.uks1.devtunnels.ms/', 'http://localhost:3001'],
    credentials: true,
  });

  app.use(cookieParser());

  // Set a global validation pipeline
  // Set Global validation pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  // Configure Swagger
  // const config = new DocumentBuilder()
  //   .setTitle('Habesha Nets Backend')
  //   .setDescription('The habesha nets APIs description.')
  //   .setVersion('1.0')
  //   .addBearerAuth(
  //     {
  //       type: 'http',
  //       scheme: 'bearer',
  //       bearerFormat: 'JWT',
  //     },
  //     'Authorization',
  //   )
  //   .addTag('Habesha Nets Backend APIs')
  //   .build();
  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
