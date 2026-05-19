import { Field, ObjectType } from '@nestjs/graphql';
import { BaseResponse } from '@/common/response';
import { AuthPayload } from './auth.input';

@ObjectType()
export class AuthResponse extends BaseResponse {
  @Field(() => AuthPayload, { nullable: true })
  data: AuthPayload | null;
}

@ObjectType()
export class AuthMessageResponse extends BaseResponse {
  @Field(() => String, { nullable: true })
  data: string | null;
}
