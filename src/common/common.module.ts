import { Module } from '@nestjs/common';

import { AvailabilityModule } from '@/common/availability/availability.module';
import { CryptoModule } from '@/common/crypto/crypto.module';
import { MailModule } from '@/common/mail/mail.module';
import { PaginationModule } from '@/common/pagination/pagination.module';
import { FilterSortModule } from '@/common/filter-sort/filter-sort.module';
import { IdentifierModule } from '@/common/identifier/identifier.module';
import { DeletabilityModule } from '@/common/deletability/deletability.module';

@Module({
  imports: [
    AvailabilityModule,
    CryptoModule,
    MailModule,
    PaginationModule,
    FilterSortModule,
    IdentifierModule,
    DeletabilityModule,
  ],
  exports: [
    AvailabilityModule,
    CryptoModule,
    MailModule,
    PaginationModule,
    FilterSortModule,
    IdentifierModule,
    DeletabilityModule,
  ],
})
export class CommonModule { }
