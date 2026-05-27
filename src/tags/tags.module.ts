import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@/common/common.module';
import { AuthModule } from '@/auth/auth.module';

import { Clause } from '@/clauses/entities';

import { TagsService } from '@/tags/tags.service';
import { TagsResolver } from '@/tags/tags.resolver';
import { Tag, ClauseTag } from '@/tags/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tag, ClauseTag, Clause]),
    CommonModule,
    AuthModule,
  ],
  providers: [TagsService, TagsResolver],
  exports: [TagsService],
})
export class TagsModule {}
