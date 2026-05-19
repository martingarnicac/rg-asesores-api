import { Module } from '@nestjs/common';

import { IdentifierService } from '@/common/identifier/identifier.service';

@Module({
  providers: [IdentifierService],
  exports: [IdentifierService],
})
export class IdentifierModule {}
