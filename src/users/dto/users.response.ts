import { Field, ObjectType } from '@nestjs/graphql';

import { BaseResponse } from '@/common/response';
import { PaginatedMeta } from '@/common/response/paginated-meta.model';
import { User } from '@/users/entities';

@ObjectType()
export class UserResponse extends BaseResponse {
  @Field(() => User, { nullable: true })
  data: User | null;
}

@ObjectType()
export class UsersPaginatedData {
  @Field(() => PaginatedMeta)
  meta: PaginatedMeta;

  @Field(() => [User])
  items: User[];
}

@ObjectType()
export class UsersPaginatedResponse extends BaseResponse {
  @Field(() => UsersPaginatedData)
  data: UsersPaginatedData;
}

@ObjectType()
export class DeleteResponse extends BaseResponse {
  @Field(() => String, { nullable: true })
  data: string | null;
}
