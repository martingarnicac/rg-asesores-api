import { registerEnumType } from '@nestjs/graphql';

export enum Availability {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  DRAFT = 'DRAFT',
  DELETED = 'DELETED',
}

registerEnumType(Availability, { name: 'Availability' });