import { registerEnumType } from '@nestjs/graphql';

export enum AvailabilityAction {
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
  ARCHIVE = 'ARCHIVE',
  DELETE = 'DELETE',
}

registerEnumType(AvailabilityAction, { name: 'AvailabilityAction' });
