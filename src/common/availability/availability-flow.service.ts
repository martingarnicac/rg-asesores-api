import { BadRequestException, Injectable } from '@nestjs/common';

import { Availability, AvailabilityAction } from '@/common/availability/entities';

const TRANSITION_MAP: Record<AvailabilityAction, Partial<Record<Availability, Availability>>> = {
  [AvailabilityAction.ACTIVATE]: {
    [Availability.DRAFT]: Availability.ACTIVE,
    [Availability.INACTIVE]: Availability.ACTIVE,
    [Availability.ARCHIVED]: Availability.ACTIVE,
  },
  [AvailabilityAction.DEACTIVATE]: {
    [Availability.ACTIVE]: Availability.INACTIVE,
  },
  [AvailabilityAction.ARCHIVE]: {
    [Availability.INACTIVE]: Availability.ARCHIVED,
  },
  [AvailabilityAction.DELETE]: {
    [Availability.ARCHIVED]: Availability.DELETED,
  },
};

@Injectable()
export class AvailabilityFlowService {
  transition(current: Availability, action: AvailabilityAction): Availability {
    const next = TRANSITION_MAP[action]?.[current];
    if (!next) {
      throw new BadRequestException(
        `Transición no permitida: no se puede ${action} desde ${current}`,
      );
    }
    return next;
  }

  canTransition(current: Availability, action: AvailabilityAction): boolean {
    return TRANSITION_MAP[action]?.[current] !== undefined;
  }

  getAvailableActions(current: Availability): AvailabilityAction[] {
    return (Object.values(AvailabilityAction) as AvailabilityAction[]).filter((action) =>
      this.canTransition(current, action),
    );
  }

  isActiveAvailability(availability: Availability): boolean {
    return availability === Availability.ACTIVE;
  }

  isValidDirectTransition(current: Availability, next: Availability): boolean {
    for (const action of Object.values(AvailabilityAction) as AvailabilityAction[]) {
      if (TRANSITION_MAP[action]?.[current] === next) {
        return true;
      }
    }
    return false;
  }
}
