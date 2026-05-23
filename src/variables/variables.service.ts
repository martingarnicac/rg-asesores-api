import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsOrder, In, ILike, Between, MoreThan, LessThan } from 'typeorm';

import { Availability } from '@/common/availability/entities';
import { AvailabilityFlowService } from '@/common/availability/availability-flow.service';
import { PaginationService } from '@/common/pagination/pagination.service';
import { IdentifierService } from '@/common/identifier/identifier.service';

import { Variable, VariableDataType, VariableValueScope } from '@/variables/entities';
import { VariableIcon } from '@/variables/variable-icons/entities';
import { VariableColor } from '@/variables/variable-colors/entities';
import { CreateVariableInput, UpdateVariableInput } from '@/variables/dto';
import { VariableTypeValidator } from '@/variables/validators';

@Injectable()
export class VariablesService {
  constructor(
    @InjectRepository(Variable)
    private readonly variableRepo: Repository<Variable>,
    @InjectRepository(VariableIcon)
    private readonly iconRepo: Repository<VariableIcon>,
    @InjectRepository(VariableColor)
    private readonly colorRepo: Repository<VariableColor>,
    private readonly paginationService: PaginationService,
    private readonly availabilityFlowService: AvailabilityFlowService,
    private readonly identifierService: IdentifierService,
    private readonly variableTypeValidator: VariableTypeValidator,
  ) {}

  private generateKeyFromLabel(label: string): string {
    return label
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  async findAll(
    pagination: { page: number; itemsPerPage: number },
    filter?: { availability?: Availability[]; dataType?: VariableDataType[]; searchTerm?: string; createdAtFrom?: string; createdAtTo?: string },
    sort?: { createdAt?: 'ASC' | 'DESC'; name?: 'ASC' | 'DESC'; dataType?: 'ASC' | 'DESC' },
  ) {
    let where: FindOptionsWhere<Variable> | FindOptionsWhere<Variable>[] = {};

    if (filter?.availability?.length) {
      (where as any).availability = In(filter.availability);
    }
    if (filter?.dataType?.length) {
      (where as any).dataType = In(filter.dataType);
    }

    if (filter?.searchTerm) {
      const searchValue = `%${filter.searchTerm}%`;
      where = [
        { ...where, key: ILike(searchValue) },
        { ...where, label: ILike(searchValue) },
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

    const order: FindOptionsOrder<Variable> = {};
    if (sort?.createdAt) order.createdAt = sort.createdAt;
    if (sort?.dataType) order.dataType = sort.dataType;
    if (!sort?.createdAt && !sort?.dataType) order.createdAt = 'DESC';

    const result = await this.paginationService.paginateRepository(this.variableRepo, pagination, {
      where,
      order,
      relations: ['icon', 'color'],
    });

    return {
      meta: { total: result.total, page: result.page, itemsPerPage: result.itemsPerPage, totalPages: result.totalPages },
      items: result.items,
    };
  }

  async findOne(id: string): Promise<Variable> {
    const variable = await this.variableRepo.findOne({ where: { id }, relations: ['icon', 'color'] });
    if (!variable) throw new NotFoundException('Variable not found');
    return variable;
  }

  async findByKey(key: string): Promise<Variable | null> {
    return this.variableRepo.findOne({ where: { key }, relations: ['icon', 'color'] });
  }

  async create(input: CreateVariableInput): Promise<Variable> {
    const key = this.generateKeyFromLabel(input.label);

    const existingKey = await this.variableRepo.findOne({ where: { key } });
    if (existingKey) {
      throw new ConflictException('Variable key already exists');
    }

    const icon = await this.iconRepo.findOne({ where: { id: input.iconId } });
    if (!icon) throw new NotFoundException('Icon not found');

    const color = await this.colorRepo.findOne({ where: { id: input.colorId } });
    if (!color) throw new NotFoundException('Color not found');

    const isArray = input.isArray ?? false;
    const dataFormat = input.dataFormat ?? null;

    this.variableTypeValidator.validateTypeAndFormat(input.dataType, dataFormat, isArray);

    if (input.typeOptions) {
      this.variableTypeValidator.validateTypeOptions(input.dataType, dataFormat, isArray, input.typeOptions);
    }

    if (input.defaultValue !== undefined && input.defaultValue !== null) {
      this.variableTypeValidator.validateDefaultValue(input.dataType, isArray, input.defaultValue, input.typeOptions);
    }

    if (input.valueScope === VariableValueScope.PARTICIPANT && !input.defaultPartyRole) {
      throw new BadRequestException('defaultPartyRole is required when valueScope is PARTICIPANT');
    }

    const identifier = await this.identifierService.generateNextIdentifier<Variable>(this.variableRepo, 'VAR');

    const createInput: any = {
      identifier,
      key,
      label: input.label,
      description: input.description ?? null,
      dataType: input.dataType,
      dataFormat: dataFormat,
      isArray,
      typeOptions: input.typeOptions ?? {},
      defaultValue: input.defaultValue ?? null,
      valueScope: input.valueScope ?? VariableValueScope.CONTRACT,
      defaultPartyRole: input.defaultPartyRole ?? null,
      placeholder: input.placeholder ?? null,
      iconId: input.iconId,
      colorId: input.colorId,
      availability: Availability.DRAFT,
    };
    const variable = this.variableRepo.create(createInput) as unknown as Variable;
    const saved = await this.variableRepo.save(variable);
    return this.findOne(saved.id);
  }

  async update(id: string, input: UpdateVariableInput): Promise<Variable> {
    const variable = await this.findOne(id);

    if (input.label !== undefined && input.label !== variable.label) {
      const newKey = this.generateKeyFromLabel(input.label);
      const existing = await this.variableRepo.findOne({ where: { key: newKey } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Variable key already exists');
      }
      variable.key = newKey;
    }

    if (input.iconId !== undefined) {
      const icon = await this.iconRepo.findOne({ where: { id: input.iconId } });
      if (!icon) throw new NotFoundException('Icon not found');
    }

    if (input.colorId !== undefined) {
      const color = await this.colorRepo.findOne({ where: { id: input.colorId } });
      if (!color) throw new NotFoundException('Color not found');
    }

    const effectiveDataType = input.dataType ?? variable.dataType;
    const effectiveDataFormat = input.dataFormat !== undefined ? input.dataFormat : variable.dataFormat;
    const effectiveIsArray = input.isArray !== undefined ? input.isArray : variable.isArray;
    const effectiveTypeOptions = input.typeOptions !== undefined ? input.typeOptions : variable.typeOptions;
    const effectiveDefaultValue = input.defaultValue !== undefined ? input.defaultValue : variable.defaultValue;

    this.variableTypeValidator.validateTypeAndFormat(effectiveDataType, effectiveDataFormat, effectiveIsArray);

    if (input.typeOptions !== undefined) {
      this.variableTypeValidator.validateTypeOptions(effectiveDataType, effectiveDataFormat, effectiveIsArray, effectiveTypeOptions);
    }

    if (input.defaultValue !== undefined) {
      this.variableTypeValidator.validateDefaultValue(effectiveDataType, effectiveIsArray, effectiveDefaultValue, effectiveTypeOptions);
    }

    const effectiveValueScope = input.valueScope ?? variable.valueScope;
    const effectivePartyRole = input.defaultPartyRole !== undefined ? input.defaultPartyRole : variable.defaultPartyRole;
    if (effectiveValueScope === VariableValueScope.PARTICIPANT && !effectivePartyRole) {
      throw new BadRequestException('defaultPartyRole is required when valueScope is PARTICIPANT');
    }

    if (input.label !== undefined) variable.label = input.label;
    if (input.description !== undefined) variable.description = input.description ?? null;
    if (input.dataType !== undefined) variable.dataType = input.dataType;
    if (input.dataFormat !== undefined) variable.dataFormat = input.dataFormat;
    if (input.isArray !== undefined) variable.isArray = input.isArray;
    if (input.typeOptions !== undefined) variable.typeOptions = input.typeOptions;
    if (input.defaultValue !== undefined) variable.defaultValue = input.defaultValue ?? null;
    if (input.valueScope !== undefined) variable.valueScope = input.valueScope;
    if (input.defaultPartyRole !== undefined) variable.defaultPartyRole = input.defaultPartyRole ?? null;
    if (input.placeholder !== undefined) variable.placeholder = input.placeholder ?? null;
    if (input.iconId !== undefined) {
      variable.iconId = input.iconId;
      variable.icon = { id: input.iconId } as any;
    }
    if (input.colorId !== undefined) {
      variable.colorId = input.colorId;
      variable.color = { id: input.colorId } as any;
    }

    const saved = await this.variableRepo.save(variable);
    return this.findOne(saved.id);
  }

  async changeAvailability(id: string, availability: Availability): Promise<Variable> {
    const variable = await this.findOne(id);
    if (!this.availabilityFlowService.isValidDirectTransition(variable.availability, availability)) {
      throw new BadRequestException('Invalid availability transition');
    }

    if (availability === Availability.ACTIVE) {
      if (variable.dataType === VariableDataType.ENUM) {
        const enumValues = variable.typeOptions?.items?.enum_values;
        if (!Array.isArray(enumValues) || enumValues.length === 0) {
          throw new BadRequestException('ENUM variable must have at least one enum value to be activated');
        }
      }
    }

    variable.availability = availability;
    return this.variableRepo.save(variable);
  }

  async delete(id: string): Promise<{ message: string }> {
    const variable = await this.findOne(id);
    if (variable.availability !== Availability.DELETED) {
      throw new BadRequestException('Variable must be in DELETED availability state');
    }

    await this.variableRepo.remove(variable);
    return { message: 'Variable permanently deleted' };
  }
}
