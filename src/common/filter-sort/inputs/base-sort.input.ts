import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { SortDirection } from '@/common/filter-sort/enums/sort-direction.enum';

@InputType({ isAbstract: true })
export abstract class BaseSortInput {
  @Field(() => SortDirection, { nullable: true })
  @IsOptional()
  createdAt?: SortDirection;

  @Field(() => SortDirection, { nullable: true })
  @IsOptional()
  availability?: SortDirection;
}
