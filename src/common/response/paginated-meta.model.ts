import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PaginatedMeta {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  itemsPerPage: number;

  @Field(() => Int)
  totalPages: number;
}
