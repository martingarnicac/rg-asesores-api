import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  FindOptionsOrder,
  In,
  ILike,
  Between,
  MoreThan,
  LessThan,
  EntityManager,
} from 'typeorm';

import { Availability } from '@/common/availability/entities';
import { AvailabilityFlowService } from '@/common/availability/availability-flow.service';
import { PaginationService } from '@/common/pagination/pagination.service';
import { IdentifierService } from '@/common/identifier/identifier.service';
import { DeletableEntityType } from '@/common/deletability/entities';
import { DeletabilityService } from '@/common/deletability/deletability.service';

import { Variable, VariableValueScope } from '@/variables/entities';

import { Clause, ClauseVariable, ClauseCategory } from '@/clauses/entities';
import { CreateClauseInput, UpdateClauseInput, ClauseVariableSyncInput } from '@/clauses/dto';

@Injectable()
export class ClausesService {
  constructor(
    @InjectRepository(Clause)
    private readonly clauseRepo: Repository<Clause>,
    private readonly paginationService: PaginationService,
    private readonly availabilityFlowService: AvailabilityFlowService,
    private readonly identifierService: IdentifierService,
    private readonly deletabilityService: DeletabilityService,
  ) {}

  private normalizeClauseKey(value: string): string {
    return value
      .normalize('NFKC')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();
  }

  private normalizeClauseBodyText(bodyText: string): string {
    return bodyText.replace(/\[\[\s*([^[\]]+?)\s*\]\]/g, (_match, rawKey: string) => {
      const key = this.normalizeClauseKey(rawKey);
      return key ? `{{${key}}}` : _match;
    });
  }

  private extractBodyKeysInOrder(bodyText: string): string[] {
    const normalizedBodyText = this.normalizeClauseBodyText(bodyText);
    const matches = normalizedBodyText.matchAll(/{{\s*([^{}]+?)\s*}}/g);
    const keys: string[] = [];
    const seen = new Set<string>();

    for (const match of matches) {
      const rawKey = match[1] ?? '';
      const key = this.normalizeClauseKey(rawKey);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
    }

    return keys;
  }

  private validateClauseVariableKeys(
    bodyText: string,
    variables: Variable[],
  ): Map<string, number> {
    const bodyKeys = this.extractBodyKeysInOrder(bodyText);
    const variableKeys = variables.map((variable) => this.normalizeClauseKey(variable.key));

    const bodyKeySet = new Set(bodyKeys);
    const variableKeySet = new Set(variableKeys);

    for (const key of variableKeys) {
      if (!bodyKeySet.has(key)) {
        throw new BadRequestException(
          `Key "${key}" is not present in the clause body text. Parsed body keys: [${bodyKeys.join(', ')}]`,
        );
      }
    }

    for (const key of bodyKeys) {
      if (!variableKeySet.has(key)) {
        throw new BadRequestException(
          `Key "${key}" is present in the clause body text but is missing from the clause variables input`,
        );
      }
    }

    return new Map(bodyKeys.map((key, index) => [key, index]));
  }

  private mapExistingClauseVariablesForSync(
    clauseVariables: ClauseVariable[],
  ): ClauseVariableSyncInput[] {
    return clauseVariables.map((clauseVariable) => ({
      id: clauseVariable.id,
      variableId: clauseVariable.variableId,
      valueScope: clauseVariable.valueScope,
      partyRole: clauseVariable.partyRole,
      keyRequired: clauseVariable.keyRequired,
      keyIfEmpty: clauseVariable.keyIfEmpty,
    }));
  }

  private async validateReplacedClause(
    manager: EntityManager,
    replacesClauseId?: string | null,
  ): Promise<void> {
    if (!replacesClauseId) return;

    const replaces = await manager.findOne(Clause, { where: { id: replacesClauseId } });
    if (!replaces) {
      throw new NotFoundException('Replaced clause not found');
    }
  }

  private async syncClauseVariables(
    manager: EntityManager,
    clauseId: string,
    variables: ClauseVariableSyncInput[],
    bodyText: string,
  ): Promise<void> {
    // 1. Validar duplicados de variable dentro del input
    const variableIdSet = new Set<string>();
    for (const input of variables) {
      if (variableIdSet.has(input.variableId)) {
        throw new ConflictException(
          `Duplicate variableId "${input.variableId}" in clause variables input`,
        );
      }
      variableIdSet.add(input.variableId);
    }

    // 2. Validar que todas las variables referenciadas existan en el catálogo
    const variableIds = [...new Set(variables.map((v) => v.variableId))];
    const foundVariables = variableIds.length
      ? await manager.findBy(Variable, { id: In(variableIds) })
      : [];

    if (foundVariables.length !== variableIds.length) {
      throw new NotFoundException('One or more referenced variables do not exist');
    }
    const variableMap = new Map(foundVariables.map((v) => [v.id, v]));

    // 3. Validar que las keys del body coincidan exactamente con las variables recibidas
    const keyOrderMap = this.validateClauseVariableKeys(bodyText, foundVariables);

    // 4. Obtener variables actuales de la cláusula
    const existingVariables = await manager.find(ClauseVariable, {
      where: { clauseId },
    });
    const existingById = new Map(existingVariables.map((ev) => [ev.id, ev]));

    const idsToKeep = new Set<string>();
    const toCreate: ClauseVariable[] = [];
    const toUpdate: ClauseVariable[] = [];

    for (const input of variables) {
      const variable = variableMap.get(input.variableId)!;
      const effectiveValueScope = input.valueScope ?? variable.valueScope;
      const effectiveKeyRequired = input.keyRequired ?? false;
      const effectiveKeyIfEmpty = input.keyIfEmpty ?? null;
      const hasValidKeyIfEmpty =
        typeof effectiveKeyIfEmpty === 'string' && effectiveKeyIfEmpty.trim().length > 0;

      // Validar partyRole para PARTICIPANT
      if (effectiveValueScope === VariableValueScope.PARTICIPANT && !input.partyRole && !variable.defaultPartyRole) {
        throw new BadRequestException(
          `partyRole is required for key "${variable.key}" when valueScope is PARTICIPANT`,
        );
      }

      if (!effectiveKeyRequired && !hasValidKeyIfEmpty) {
        throw new BadRequestException(
          `keyIfEmpty is required for key "${variable.key}" when keyRequired is false`,
        );
      }

      if (input.id && existingById.has(input.id)) {
        // Actualizar existente
        const existing = existingById.get(input.id)!;
        existing.variableId = input.variableId;
        existing.valueScope = input.valueScope ?? null;
        existing.partyRole = input.partyRole ?? null;
        existing.keyRequired = effectiveKeyRequired;
        existing.keyIfEmpty = effectiveKeyIfEmpty;
        existing.sortOrder = keyOrderMap.get(variable.key) ?? 0;
        toUpdate.push(existing);
        idsToKeep.add(input.id);
      } else {
        // Crear nuevo
        toCreate.push(
          manager.create(ClauseVariable, {
            clauseId,
            variableId: input.variableId,
            valueScope: input.valueScope ?? null,
            partyRole: input.partyRole ?? null,
            keyRequired: effectiveKeyRequired,
            keyIfEmpty: effectiveKeyIfEmpty,
            sortOrder: keyOrderMap.get(variable.key) ?? 0,
          }),
        );
      }
    }

    // 5. Eliminar variables que no vinieron en el input
    const toDelete = existingVariables.filter((ev) => !idsToKeep.has(ev.id));
    if (toDelete.length) {
      await manager.remove(toDelete);
    }

    // 6. Guardar actualizaciones y creaciones
    if (toUpdate.length) {
      await manager.save(toUpdate);
    }
    if (toCreate.length) {
      await manager.save(toCreate);
    }
  }

  async findAll(
    pagination: { page: number; itemsPerPage: number },
    filter?: { availability?: Availability[]; category?: ClauseCategory[]; searchTerm?: string; createdAtFrom?: string; createdAtTo?: string },
    sort?: { createdAt?: 'ASC' | 'DESC'; title?: 'ASC' | 'DESC'; category?: 'ASC' | 'DESC' },
  ) {
    let where: FindOptionsWhere<Clause> | FindOptionsWhere<Clause>[] = {};

    if (filter?.availability?.length) {
      (where as any).availability = In(filter.availability);
    }
    if (filter?.category?.length) {
      (where as any).category = In(filter.category);
    }

    if (filter?.searchTerm) {
      const searchValue = `%${filter.searchTerm}%`;
      where = [
        { ...where, title: ILike(searchValue) },
        { ...where, code: ILike(searchValue) },
        { ...where, bodyText: ILike(searchValue) },
      ];
    }

    if (filter?.createdAtFrom || filter?.createdAtTo) {
      const dateCondition: any = {};
      if (filter.createdAtFrom && filter.createdAtTo) {
        dateCondition.createdAt = Between(
          new Date(filter.createdAtFrom),
          new Date(filter.createdAtTo),
        );
      } else if (filter.createdAtFrom) {
        dateCondition.createdAt = MoreThan(new Date(filter.createdAtFrom));
      } else if (filter.createdAtTo) {
        dateCondition.createdAt = LessThan(new Date(filter.createdAtTo));
      }
      if (Array.isArray(where)) {
        where = where.map((w) => ({ ...w, ...dateCondition }));
      } else {
        where = { ...where, ...dateCondition };
      }
    }

    const order: FindOptionsOrder<Clause> = {};
    if (sort?.createdAt) order.createdAt = sort.createdAt;
    if (sort?.title) order.title = sort.title;
    if (sort?.category) order.category = sort.category;
    if (!sort?.createdAt && !sort?.title && !sort?.category) order.createdAt = 'DESC';

    const result = await this.paginationService.paginateRepository(this.clauseRepo, pagination, {
      where,
      order,
      relations: ['creator', 'clauseVariables', 'clauseVariables.variable', 'clauseTags', 'clauseTags.tag'],
    });

    return {
      meta: { total: result.total, page: result.page, itemsPerPage: result.itemsPerPage, totalPages: result.totalPages },
      items: result.items,
    };
  }

  async findOne(id: string): Promise<Clause> {
    const clause = await this.clauseRepo.findOne({
      where: { id },
      relations: ['creator', 'replacesClause', 'clauseVariables', 'clauseVariables.variable', 'clauseTags', 'clauseTags.tag'],
    });
    if (!clause) throw new NotFoundException('Clause not found');
    return clause;
  }

  async create(
    input: CreateClauseInput,
    createdBy: string,
    replacesClauseId?: string | null,
  ): Promise<Clause> {
    return this.clauseRepo.manager.transaction(async (manager) => {
      await this.validateReplacedClause(manager, replacesClauseId);

      const normalizedBodyText = this.normalizeClauseBodyText(input.bodyText);

      const identifier = await this.identifierService.generateNextIdentifier<Clause>(this.clauseRepo, 'CLS');

      const clause = manager.create(Clause, {
        identifier,
        code: input.code ?? null,
        title: input.title,
        bodyText: normalizedBodyText,
        category: input.category ?? ClauseCategory.OTHER,
        replacesClauseId: replacesClauseId ?? null,
        createdBy,
        availability: Availability.ACTIVE,
      });

      const saved = await manager.save(clause);

      // Validar y sincronizar variables siempre para mantener consistencia con el body
      await this.syncClauseVariables(manager, saved.id, input.variables ?? [], saved.bodyText);

      // Devolver la cláusula completa con relaciones
      return manager.findOne(Clause, {
        where: { id: saved.id },
        relations: ['creator', 'replacesClause', 'clauseVariables', 'clauseVariables.variable', 'clauseTags', 'clauseTags.tag'],
      }) as Promise<Clause>;
    });
  }

  async update(id: string, input: UpdateClauseInput): Promise<Clause> {
    return this.clauseRepo.manager.transaction(async (manager) => {
      const clause = await manager.findOne(Clause, {
        where: { id },
        relations: ['clauseVariables'],
      });
      if (!clause) throw new NotFoundException('Clause not found');

      if (input.code !== undefined) clause.code = input.code ?? null;
      if (input.title !== undefined) clause.title = input.title;
      if (input.bodyText !== undefined) clause.bodyText = this.normalizeClauseBodyText(input.bodyText);
      if (input.category !== undefined) clause.category = input.category;

      await manager.save(clause);

      // Revalidar variables cuando cambie el body o el arreglo de variables
      if (input.variables !== undefined || input.bodyText !== undefined) {
        const variablesToSync =
          input.variables ?? this.mapExistingClauseVariablesForSync(clause.clauseVariables ?? []);
        await this.syncClauseVariables(manager, id, variablesToSync, clause.bodyText);
      }

      return manager.findOne(Clause, {
        where: { id },
        relations: ['creator', 'replacesClause', 'clauseVariables', 'clauseVariables.variable', 'clauseTags', 'clauseTags.tag'],
      }) as Promise<Clause>;
    });
  }

  async changeAvailability(id: string, availability: Availability): Promise<Clause> {
    const clause = await this.findOne(id);
    if (!this.availabilityFlowService.isValidDirectTransition(clause.availability, availability)) {
      throw new BadRequestException('Invalid availability transition');
    }
    clause.availability = availability;
    return this.clauseRepo.save(clause);
  }

  async delete(id: string): Promise<{ message: string }> {
    const clause = await this.findOne(id);
    if (clause.availability !== Availability.DELETED) {
      throw new BadRequestException('Clause must be in DELETED availability state');
    }

    await this.deletabilityService.assertDeletable(DeletableEntityType.CLAUSE, id);

    await this.clauseRepo.remove(clause);
    return { message: 'Clause permanently deleted' };
  }
}
