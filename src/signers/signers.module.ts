import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@/common/common.module';
import { AuthModule } from '@/auth/auth.module';

import { SignersService } from '@/signers/signers.service';
import { SignersResolver } from '@/signers/signers.resolver';
import { Signer } from '@/signers/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Signer]),
    CommonModule,
    AuthModule,
  ],
  providers: [SignersService, SignersResolver],
  exports: [SignersService],
})
export class SignersModule {}
