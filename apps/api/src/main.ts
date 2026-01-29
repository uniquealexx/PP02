import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { HttpLoggingInterceptor } from './common/logging.interceptor';
import { requestIdMiddleware } from './common/request-id.middleware';

interface ValidationErrorShape {
  property: string;
  constraints?: Record<string, string>;
  children?: ValidationErrorShape[];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({
    origin: webOrigin,
    credentials: true,
  });
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.useGlobalInterceptors(new HttpLoggingInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationErrorShape[]) => {
        const details: Record<string, string> = {};

        const collect = (errorList: ValidationErrorShape[], prefix = ''): void => {
          for (const error of errorList) {
            const key = prefix ? `${prefix}.${error.property}` : error.property;
            if (error.constraints && Object.keys(error.constraints).length > 0) {
              details[key] = Object.values(error.constraints)[0];
            }
            if (error.children && error.children.length > 0) {
              collect(error.children, key);
            }
          }
        };

        collect(errors);

        return new BadRequestException({
          errorCode: 'VALIDATION_ERROR',
          message: 'Validation failed.',
          details,
        });
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('ServiceDesk API')
    .setDescription('ServiceDesk API documentation')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3002);
}
void bootstrap();
