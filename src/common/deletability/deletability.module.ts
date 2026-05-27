import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Clause, ClauseVariable } from '@/clauses/entities';
import { ClauseTag } from '@/tags/entities';
import { Variable } from '@/variables/entities';

import { DeletabilityService } from '@/common/deletability/deletability.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClauseTag, Clause, ClauseVariable, Variable])],
  providers: [DeletabilityService],
  exports: [DeletabilityService],
})
export class DeletabilityModule { }
