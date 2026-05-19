import { Module } from '@nestjs/common';

import { PaginationService } from '@/common/pagination/pagination.service';

@Module({
  providers: [PaginationService],
  exports: [PaginationService],
})
export class PaginationModule {}
