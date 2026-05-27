import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Clause, ClauseVariable } from '@/clauses/entities';
import { ClauseTag } from '@/tags/entities';
import { Variable } from '@/variables/entities';

import { DeletableEntityType } from './entities';
import { NotDeletableException } from './not-deletable.exception';

const NOT_DELETABLE_MESSAGES: Record<DeletableEntityType, string> = {
  [DeletableEntityType.TAG]:
    'Tag cannot be deleted because it is assigned to one or more clauses',
  [DeletableEntityType.CLAUSE]:
    'Clause cannot be deleted because it is referenced by other clauses',
  [DeletableEntityType.VARIABLE]:
    'Variable cannot be deleted because it is used in one or more clauses',
  [DeletableEntityType.VARIABLE_ICON]:
    'Icon cannot be deleted because it is used by one or more variables',
  [DeletableEntityType.VARIABLE_COLOR]:
    'Color cannot be deleted because it is used by one or more variables',
  [DeletableEntityType.USER]:
    'User cannot be deleted because it is referenced by other records',
  [DeletableEntityType.SIGNER]:
    'Signer cannot be deleted because it is referenced by other records',
};

@Injectable()
export class DeletabilityService {
  constructor(
    @InjectRepository(ClauseTag)
    private readonly clauseTagRepo: Repository<ClauseTag>,
    @InjectRepository(Clause)
    private readonly clauseRepo: Repository<Clause>,
    @InjectRepository(ClauseVariable)
    private readonly clauseVariableRepo: Repository<ClauseVariable>,
    @InjectRepository(Variable)
    private readonly variableRepo: Repository<Variable>,
  ) {}

  async isDeletable(entityType: DeletableEntityType, id: string): Promise<boolean> {
    const count = await this.countBlockingReferences(entityType, id);
    return count === 0;
  }

  async assertDeletable(entityType: DeletableEntityType, id: string): Promise<void> {
    const count = await this.countBlockingReferences(entityType, id);
    if (count > 0) {
      throw new NotDeletableException(NOT_DELETABLE_MESSAGES[entityType]);
    }
  }

  private async countBlockingReferences(
    entityType: DeletableEntityType,
    id: string,
  ): Promise<number> {
    switch (entityType) {
      case DeletableEntityType.TAG:
        return this.clauseTagRepo.count({ where: { tagId: id } });

      case DeletableEntityType.CLAUSE:
        return this.clauseRepo.count({ where: { replacesClauseId: id } });

      case DeletableEntityType.VARIABLE:
        return this.clauseVariableRepo.count({ where: { variableId: id } });

      case DeletableEntityType.VARIABLE_ICON:
        return this.variableRepo.count({ where: { iconId: id } });

      case DeletableEntityType.VARIABLE_COLOR:
        return this.variableRepo.count({ where: { colorId: id } });

      case DeletableEntityType.USER:
        return this.clauseRepo.count({ where: { createdBy: id } });

      case DeletableEntityType.SIGNER:
        return 0;

      default:
        return 0;
    }
  }
}
