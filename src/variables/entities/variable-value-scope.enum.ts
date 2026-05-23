import { registerEnumType } from '@nestjs/graphql';

export enum VariableValueScope {
  CONTRACT = 'CONTRACT',
  PARTICIPANT = 'PARTICIPANT',
}

registerEnumType(VariableValueScope, { name: 'VariableValueScope' });
