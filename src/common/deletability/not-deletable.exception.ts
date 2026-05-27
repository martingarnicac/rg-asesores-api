import { ConflictException } from '@nestjs/common';

export class NotDeletableException extends ConflictException {
  constructor(message: string) {
    super(message);
  }
}
