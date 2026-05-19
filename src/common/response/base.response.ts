import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ResponseCode } from './response-code.enum';

registerEnumType(ResponseCode, { name: 'ResponseCode' });

@ObjectType({ isAbstract: true })
export abstract class BaseResponse {
  @Field(() => ResponseCode)
  code: ResponseCode;

  @Field(() => Number)
  status: number;

  @Field(() => String)
  message: string;
}
