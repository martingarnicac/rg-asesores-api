import { Module } from '@nestjs/common';

import { AvailabilityFlowService } from '@/common/availability/availability-flow.service';

@Module({
  providers: [AvailabilityFlowService],
  exports: [AvailabilityFlowService],
})
export class AvailabilityModule {}
