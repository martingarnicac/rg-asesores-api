import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class HealthCheck {
  @Field()
  status: string;

  @Field()
  timestamp: string;

  @Field()
  uptime: number;
}
