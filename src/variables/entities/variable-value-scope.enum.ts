import { registerEnumType } from '@nestjs/graphql';

export enum VariableValueScope {
  DOCUMENT = 'DOCUMENT',
  PARTICIPANT = 'PARTICIPANT',
}

registerEnumType(VariableValueScope, { name: 'VariableValueScope' });
