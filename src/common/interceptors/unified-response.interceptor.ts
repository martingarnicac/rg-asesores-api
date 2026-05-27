import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { QueryFailedError } from 'typeorm';

import { ResponseBuilder } from '@/common/response/response.builder';
import { ResponseCode } from '@/common/response/response-code.enum';

@Injectable()
export class UnifiedResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof QueryFailedError) {
          const driverCode = (error as QueryFailedError & { driverError?: { code?: string } })
            .driverError?.code;
          if (driverCode === '23503') {
            return of(
              ResponseBuilder.conflict(
                'Resource cannot be deleted because it is referenced by other records',
              ),
            );
          }
        }

        if (error instanceof HttpException) {
          const status = error.getStatus();
          const response = error.getResponse();
          let message = 'An error occurred';

          if (typeof response === 'string') {
            message = response;
          } else if (typeof response === 'object' && response !== null) {
            const msg = (response as any).message;
            if (Array.isArray(msg)) {
              message = msg.join(', ');
            } else if (typeof msg === 'string') {
              message = msg;
            }
          }

          const code = this.mapToResponseCode(status, message);
          return of(ResponseBuilder.custom(code, status, message, null));
        }
        return throwError(() => error);
      }),
    );
  }

  private mapToResponseCode(status: number, message: string): ResponseCode {
    const lower = message.toLowerCase();
    switch (status) {
      case 400:
        if (lower.includes('token')) return ResponseCode.TOKEN_INVALID;
        return ResponseCode.BAD_REQUEST;
      case 401:
        if (lower.includes('credentials') || lower.includes('credent')) return ResponseCode.INVALID_CREDENTIALS;
        if (lower.includes('verif') || lower.includes('not verified') || lower.includes('inactive') || lower.includes('verify')) return ResponseCode.ACCOUNT_INACTIVE;
        if (lower.includes('token')) return ResponseCode.TOKEN_INVALID;
        if (lower.includes('password')) return ResponseCode.PASSWORD_INCORRECT;
        return ResponseCode.UNAUTHORIZED;
      case 403:
        return ResponseCode.FORBIDDEN;
      case 404:
        return ResponseCode.NOT_FOUND;
      case 409:
        return ResponseCode.CONFLICT;
      case 422:
        return ResponseCode.UNPROCESSABLE_ENTITY;
      case 503:
        return ResponseCode.SERVICE_UNAVAILABLE;
      default:
        return ResponseCode.INTERNAL_SERVER_ERROR;
    }
  }
}
