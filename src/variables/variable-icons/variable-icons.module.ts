import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@/common/common.module';
import { AuthModule } from '@/auth/auth.module';

import { VariableIcon } from '@/variables/variable-icons/entities';
import { Variable } from '@/variables/entities';
import { VariableIconsService } from '@/variables/variable-icons/variable-icons.service';
import { VariableIconsResolver } from '@/variables/variable-icons/variable-icons.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([VariableIcon, Variable]), CommonModule, AuthModule],
  providers: [VariableIconsService, VariableIconsResolver],
  exports: [VariableIconsService],
})
export class VariableIconsModule {}
