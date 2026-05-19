import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

import { BaseSortInput } from '@/common/filter-sort/inputs/base-sort.input';
import { SortDirection } from '@/common/filter-sort/enums/sort-direction.enum';

@InputType()
export class UserSortInput extends BaseSortInput {
  @Field(() => SortDirection, { nullable: true })
  @IsOptional()
  name?: SortDirection;

  @Field(() => SortDirection, { nullable: true })
  @IsOptional()
  email?: SortDirection;

  @Field(() => SortDirection, { nullable: true })
  @IsOptional()
  role?: SortDirection;
}
