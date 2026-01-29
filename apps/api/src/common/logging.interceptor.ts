import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const start = Date.now();
    const method = request.method;
    const url = request.originalUrl || request.url;
    const requestId = request.requestId;
    const userId = request.user?.id;

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - start;
        const statusCode = response.statusCode;
        this.logger.log(
          JSON.stringify({
            method,
            url,
            statusCode,
            durationMs,
            requestId,
            userId,
          }),
        );
      }),
      catchError((error: Error & { status?: number }) => {
        const durationMs = Date.now() - start;
        const statusCode = error.status ?? response.statusCode ?? 500;
        this.logger.error(
          JSON.stringify({
            method,
            url,
            statusCode,
            durationMs,
            requestId,
            userId,
            stack: error.stack,
          }),
        );
        return throwError(() => error);
      }),
    );
  }
}
