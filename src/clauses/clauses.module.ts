import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@/common/common.module';
import { AuthModule } from '@/auth/auth.module';

import { ClausesService } from '@/clauses/clauses.service';
import { ClausesResolver } from '@/clauses/clauses.resolver';
import { Clause } from '@/clauses/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Clause]),
    CommonModule,
    AuthModule,
  ],
  providers: [ClausesService, ClausesResolver],
  exports: [ClausesService],
})
export class ClausesModule {}
