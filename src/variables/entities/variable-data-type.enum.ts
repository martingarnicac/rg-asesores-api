import { registerEnumType } from '@nestjs/graphql';

export enum VariableDataType {
  TEXT = 'TEXT',
  BOOLEAN = 'BOOLEAN',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  ENUM = 'ENUM',
}

registerEnumType(VariableDataType, { name: 'VariableDataType' });
