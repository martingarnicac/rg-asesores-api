import { Resolver, Query } from '@nestjs/graphql';

import { HealthCheck } from '@/health/models/health.model';

@Resolver(() => HealthCheck)
export class HealthResolver {
  @Query(() => HealthCheck)
  health(): HealthCheck {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
