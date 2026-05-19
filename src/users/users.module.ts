import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/auth/auth.module';
import { CommonModule } from '@/common/common.module';

import { UsersService } from '@/users/users.service';
import { UsersResolver } from '@/users/users.resolver';
import { User } from '@/users/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule, CommonModule],
  providers: [UsersService, UsersResolver],
  exports: [UsersService],
})
export class UsersModule {}
