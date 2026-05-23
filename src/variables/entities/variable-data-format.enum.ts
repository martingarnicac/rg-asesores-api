import { registerEnumType } from '@nestjs/graphql';

export enum VariableDataFormat {
  TEXT = 'TEXT',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  BOOLEAN = 'BOOLEAN',
  NUMBER = 'NUMBER',
  CURRENCY = 'CURRENCY',
  PERCENT = 'PERCENT',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  SELECT = 'SELECT',
  CHIPS = 'CHIPS',
}

registerEnumType(VariableDataFormat, { name: 'VariableDataFormat' });
