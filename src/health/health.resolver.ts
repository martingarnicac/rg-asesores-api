import { Field, ObjectType, Float } from '@nestjs/graphql';
import { Resolver, Query } from '@nestjs/graphql';

import { BaseResponse } from '@/common/response';
import { ResponseBuilder } from '@/common/response';

@ObjectType()
class HealthData {
  @Field()
  status: string;

  @Field()
  timestamp: string;

  @Field(() => Float)
  uptime: number;
}

@ObjectType()
class HealthResponse extends BaseResponse {
  @Field(() => HealthData, { nullable: true })
  data: HealthData | null;
}

@Resolver()
export class HealthResolver {
  @Query(() => HealthResponse)
  health(): HealthResponse {
    return {
      ...ResponseBuilder.success(
        {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        },
        'Service is healthy',
      ),
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    };
  }
}
