import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorPayload {
  errorCode: string;
  message: string;
  details?: Record<string, string> | string[] | null;
  requestId?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.requestId;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse();
      const payload = this.buildPayload(responseBody, status, requestId);
      response.status(status).json(payload);
      return;
    }

    const payload: ErrorPayload = {
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error.',
      details: null,
      requestId,
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(payload);
  }

  private buildPayload(
    responseBody: string | object,
    status: number,
    requestId?: string,
  ): ErrorPayload {
    let message = 'Request failed.';
    let details: Record<string, string> | string[] | undefined;
    let errorCode = this.mapErrorCode(status as HttpStatus);

    if (typeof responseBody === 'string') {
      message = responseBody;
    } else if (responseBody && typeof responseBody === 'object') {
      const body = responseBody as {
        message?: string | string[];
        details?: Record<string, string> | string[];
        errorCode?: string;
      };
      if (body.message) {
        message = Array.isArray(body.message) ? 'Validation failed.' : body.message;
      }
      if (body.details) {
        details = body.details;
      } else if (Array.isArray(body.message)) {
        details = body.message;
      }
      if (body.errorCode) {
        errorCode = body.errorCode;
      }
    }

    return {
      errorCode,
      message,
      details: details ?? null,
      requestId,
    };
  }

  private mapErrorCode(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
