import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@/common/common.module';
import { AuthModule } from '@/auth/auth.module';

import { VariableColor } from '@/variables/variable-colors/entities';
import { Variable } from '@/variables/entities';
import { VariableColorsService } from '@/variables/variable-colors/variable-colors.service';
import { VariableColorsResolver } from '@/variables/variable-colors/variable-colors.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([VariableColor, Variable]), CommonModule, AuthModule],
  providers: [VariableColorsService, VariableColorsResolver],
  exports: [VariableColorsService],
})
export class VariableColorsModule {}
