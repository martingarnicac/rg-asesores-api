import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@/common/common.module';
import { AuthModule } from '@/auth/auth.module';

import { VariableIconsModule } from '@/variables/variable-icons/variable-icons.module';
import { VariableColorsModule } from '@/variables/variable-colors/variable-colors.module';
import { VariablesService } from '@/variables/variables.service';
import { VariablesResolver } from '@/variables/variables.resolver';
import { VariableTypeValidator } from '@/variables/validators';
import { Variable } from '@/variables/entities';
import { VariableIcon } from '@/variables/variable-icons/entities';
import { VariableColor } from '@/variables/variable-colors/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Variable, VariableIcon, VariableColor]),
    CommonModule,
    AuthModule,
    VariableIconsModule,
    VariableColorsModule,
  ],
  providers: [VariablesService, VariablesResolver, VariableTypeValidator],
  exports: [VariablesService],
})
export class VariablesModule {}
