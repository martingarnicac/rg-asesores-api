import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsOrder, In, ILike, Between, MoreThan, LessThan } from 'typeorm';

import { Availability } from '@/common/availability/entities';
import { AvailabilityFlowService } from '@/common/availability/availability-flow.service';
import { PaginationService } from '@/common/pagination/pagination.service';
import { IdentifierService } from '@/common/identifier/identifier.service';
import { DeletableEntityType } from '@/common/deletability/entities';
import { DeletabilityService } from '@/common/deletability/deletability.service';

import { VariableIcon } from '@/variables/variable-icons/entities';
import { Variable } from '@/variables/entities';
import { CreateVariableIconInput, UpdateVariableIconInput } from '@/variables/variable-icons/dto';

@Injectable()
export class VariableIconsService {
  constructor(
    @InjectRepository(VariableIcon)
    private readonly iconRepo: Repository<VariableIcon>,
    @InjectRepository(Variable)
    private readonly variableRepo: Repository<Variable>,
    private readonly paginationService: PaginationService,
    private readonly availabilityFlowService: AvailabilityFlowService,
    private readonly identifierService: IdentifierService,
    private readonly deletabilityService: DeletabilityService,
  ) {}

  async findAll(
    pagination: { page: number; itemsPerPage: number },
    filter?: { availability?: Availability[]; searchTerm?: string; createdAtFrom?: string; createdAtTo?: string },
    sort?: { createdAt?: 'ASC' | 'DESC'; name?: 'ASC' | 'DESC' },
  ) {
    const where: FindOptionsWhere<VariableIcon> = {};
    if (filter?.availability?.length) {
      where.availability = In(filter.availability);
    }
    if (filter?.searchTerm) {
      (where as any).name = ILike(`%${filter.searchTerm}%`);
    }
    if (filter?.createdAtFrom || filter?.createdAtTo) {
      if (filter.createdAtFrom && filter.createdAtTo) {
        (where as any).createdAt = Between(
          new Date(filter.createdAtFrom),
          new Date(filter.createdAtTo),
        );
      } else if (filter.createdAtFrom) {
        (where as any).createdAt = MoreThan(new Date(filter.createdAtFrom));
      } else if (filter.createdAtTo) {
        (where as any).createdAt = LessThan(new Date(filter.createdAtTo));
      }
    }

    const order: FindOptionsOrder<VariableIcon> = {};
    if (sort?.name) order.name = sort.name;
    if (sort?.createdAt) order.createdAt = sort.createdAt;
    if (!sort?.createdAt && !sort?.name) order.createdAt = 'DESC';

    const result = await this.paginationService.paginateRepository(this.iconRepo, pagination, {
      where,
      order,
    });

    return {
      meta: { total: result.total, page: result.page, itemsPerPage: result.itemsPerPage, totalPages: result.totalPages },
      items: result.items,
    };
  }

  async findOne(id: string): Promise<VariableIcon> {
    const icon = await this.iconRepo.findOne({ where: { id } });
    if (!icon) throw new NotFoundException('Icon not found');
    return icon;
  }

  async create(input: CreateVariableIconInput): Promise<VariableIcon> {
    const existing = await this.iconRepo.findOne({ where: { library: input.library, iconKey: input.iconKey } });
    if (existing) {
      throw new ConflictException('Icon with this library and key already exists');
    }

    const identifier = await this.identifierService.generateNextIdentifier<VariableIcon>(this.iconRepo, 'ICON');
    const icon = this.iconRepo.create({
      identifier,
      name: input.name,
      library: input.library,
      iconKey: input.iconKey,
      availability: Availability.ACTIVE,
    });
    return this.iconRepo.save(icon);
  }

  async update(id: string, input: UpdateVariableIconInput): Promise<VariableIcon> {
    const icon = await this.findOne(id);

    if (input.library !== undefined || input.iconKey !== undefined) {
      const lib = input.library ?? icon.library;
      const key = input.iconKey ?? icon.iconKey;
      const existing = await this.iconRepo.findOne({ where: { library: lib, iconKey: key } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Icon with this library and key already exists');
      }
    }

    if (input.name !== undefined) icon.name = input.name;
    if (input.library !== undefined) icon.library = input.library;
    if (input.iconKey !== undefined) icon.iconKey = input.iconKey;

    return this.iconRepo.save(icon);
  }

  async changeAvailability(id: string, availability: Availability): Promise<VariableIcon> {
    const icon = await this.findOne(id);
    if (!this.availabilityFlowService.isValidDirectTransition(icon.availability, availability)) {
      throw new BadRequestException('Invalid availability transition');
    }
    icon.availability = availability;
    return this.iconRepo.save(icon);
  }

  async delete(id: string): Promise<{ message: string }> {
    const icon = await this.findOne(id);
    if (icon.availability !== Availability.DELETED) {
      throw new BadRequestException('Icon must be in DELETED availability state');
    }

    await this.deletabilityService.assertDeletable(DeletableEntityType.VARIABLE_ICON, id);

    await this.iconRepo.remove(icon);
    return { message: 'Icon permanently deleted' };
  }
}
