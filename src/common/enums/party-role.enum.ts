import { registerEnumType } from '@nestjs/graphql';

export enum PartyRole {
  LESSOR = 'LESSOR',
  LESSEE = 'LESSEE',
  GUARANTOR = 'GUARANTOR',
  JOINT_GUARANTOR = 'JOINT_GUARANTOR',
  LEGAL_REPRESENTATIVE = 'LEGAL_REPRESENTATIVE',
  WITNESS = 'WITNESS',
  OTHER = 'OTHER',
}

registerEnumType(PartyRole, { name: 'PartyRole' });
