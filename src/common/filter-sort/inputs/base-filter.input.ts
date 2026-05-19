import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

import { Availability } from '@/common/availability/entities';

@InputType({ isAbstract: true })
export abstract class BaseFilterInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @Field(() => [Availability], { nullable: true })
  @IsOptional()
  @IsEnum(Availability, { each: true })
  availability?: Availability[];

  @Field(() => String, {
    nullable: true,
    description: 'Filter by createdAt from date, example: YYYY-MM-DD',
  })
  @IsOptional()
  @IsDateString()
  createdAtFrom?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Filter by createdAt to date, example: YYYY-MM-DD',
  })
  @IsOptional()
  @IsDateString()
  createdAtTo?: string;
}
