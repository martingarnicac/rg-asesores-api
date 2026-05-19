import { ResponseCode } from '@/common/response';

interface PlainResponse {
  code: ResponseCode;
  status: number;
  message: string;
  data: any;
}

export class ResponseBuilder {
  static success(data?: any, message = 'Operation completed successfully'): PlainResponse {
    return {
      code: ResponseCode.SUCCESS,
      status: 200,
      message,
      data: data ?? null,
    };
  }

  static created(data?: any, message = 'Resource created successfully'): PlainResponse {
    return {
      code: ResponseCode.CREATED,
      status: 201,
      message,
      data: data ?? null,
    };
  }

  static accepted(data?: any, message = 'Request accepted'): PlainResponse {
    return {
      code: ResponseCode.ACCEPTED,
      status: 202,
      message,
      data: data ?? null,
    };
  }

  static noContent(message = 'No content'): PlainResponse {
    return {
      code: ResponseCode.NO_CONTENT,
      status: 204,
      message,
      data: null,
    };
  }

  static badRequest(message = 'Bad request', data?: any): PlainResponse {
    return {
      code: ResponseCode.BAD_REQUEST,
      status: 400,
      message,
      data: data ?? null,
    };
  }

  static unauthorized(message = 'Unauthorized'): PlainResponse {
    return {
      code: ResponseCode.UNAUTHORIZED,
      status: 401,
      message,
      data: null,
    };
  }

  static forbidden(message = 'Forbidden'): PlainResponse {
    return {
      code: ResponseCode.FORBIDDEN,
      status: 403,
      message,
      data: null,
    };
  }

  static notFound(message = 'Resource not found'): PlainResponse {
    return {
      code: ResponseCode.NOT_FOUND,
      status: 404,
      message,
      data: null,
    };
  }

  static conflict(message = 'Resource conflict', data?: any): PlainResponse {
    return {
      code: ResponseCode.CONFLICT,
      status: 409,
      message,
      data: data ?? null,
    };
  }

  static unprocessableEntity(message = 'Validation failed', data?: any): PlainResponse {
    return {
      code: ResponseCode.UNPROCESSABLE_ENTITY,
      status: 422,
      message,
      data: data ?? null,
    };
  }

  static internalError(message = 'Internal server error'): PlainResponse {
    return {
      code: ResponseCode.INTERNAL_SERVER_ERROR,
      status: 500,
      message,
      data: null,
    };
  }

  static serviceUnavailable(message = 'Service unavailable'): PlainResponse {
    return {
      code: ResponseCode.SERVICE_UNAVAILABLE,
      status: 503,
      message,
      data: null,
    };
  }

  static invalidCredentials(message = 'Invalid credentials'): PlainResponse {
    return {
      code: ResponseCode.INVALID_CREDENTIALS,
      status: 401,
      message,
      data: null,
    };
  }

  static tokenExpired(message = 'Token has expired'): PlainResponse {
    return {
      code: ResponseCode.TOKEN_EXPIRED,
      status: 401,
      message,
      data: null,
    };
  }

  static tokenInvalid(message = 'Token is invalid'): PlainResponse {
    return {
      code: ResponseCode.TOKEN_INVALID,
      status: 401,
      message,
      data: null,
    };
  }

  static accountInactive(message = 'Account is inactive'): PlainResponse {
    return {
      code: ResponseCode.ACCOUNT_INACTIVE,
      status: 403,
      message,
      data: null,
    };
  }

  static emailAlreadyExists(message = 'Email already exists'): PlainResponse {
    return {
      code: ResponseCode.EMAIL_ALREADY_EXISTS,
      status: 409,
      message,
      data: null,
    };
  }

  static passwordTooWeak(message = 'Password does not meet requirements'): PlainResponse {
    return {
      code: ResponseCode.PASSWORD_TOO_WEAK,
      status: 422,
      message,
      data: null,
    };
  }

  static passwordIncorrect(message = 'Current password is incorrect'): PlainResponse {
    return {
      code: ResponseCode.PASSWORD_INCORRECT,
      status: 401,
      message,
      data: null,
    };
  }

  static operationCompleted(data?: any, message = 'Operation completed'): PlainResponse {
    return {
      code: ResponseCode.OPERATION_COMPLETED,
      status: 200,
      message,
      data: data ?? null,
    };
  }

  static emailSent(message = 'Email sent successfully'): PlainResponse {
    return {
      code: ResponseCode.EMAIL_SENT,
      status: 200,
      message,
      data: null,
    };
  }

  static passwordReset(data?: any, message = 'Password reset successfully'): PlainResponse {
    return {
      code: ResponseCode.PASSWORD_RESET,
      status: 200,
      message,
      data: data ?? null,
    };
  }

  static emailChanged(data?: any, message = 'Email changed successfully'): PlainResponse {
    return {
      code: ResponseCode.EMAIL_CHANGED,
      status: 200,
      message,
      data: data ?? null,
    };
  }

  static passwordChanged(data?: any, message = 'Password changed successfully'): PlainResponse {
    return {
      code: ResponseCode.PASSWORD_CHANGED,
      status: 200,
      message,
      data: data ?? null,
    };
  }

  static custom(
    code: ResponseCode,
    status: number,
    message: string,
    data?: any,
  ): PlainResponse {
    return {
      code,
      status,
      message,
      data: data ?? null,
    };
  }
}
