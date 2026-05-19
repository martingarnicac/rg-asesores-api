import { Module } from '@nestjs/common';
import { FilterSortService } from './filter-sort.service';

@Module({
  providers: [FilterSortService],
  exports: [FilterSortService],
})
export class FilterSortModule {}
