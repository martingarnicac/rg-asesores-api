import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsOrder, In, ILike, Between, MoreThan, LessThan } from 'typeorm';

import { Availability } from '@/common/availability/entities';
import { AvailabilityFlowService } from '@/common/availability/availability-flow.service';
import { PaginationService } from '@/common/pagination/pagination.service';
import { IdentifierService } from '@/common/identifier/identifier.service';
import { DeletableEntityType } from '@/common/deletability/entities';
import { DeletabilityService } from '@/common/deletability/deletability.service';

import { VariableColor } from '@/variables/variable-colors/entities';
import { Variable } from '@/variables/entities';
import { CreateVariableColorInput, UpdateVariableColorInput } from '@/variables/variable-colors/dto';

@Injectable()
export class VariableColorsService {
  constructor(
    @InjectRepository(VariableColor)
    private readonly colorRepo: Repository<VariableColor>,
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
    const where: FindOptionsWhere<VariableColor> = {};
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

    const order: FindOptionsOrder<VariableColor> = {};
    if (sort?.name) order.name = sort.name;
    if (sort?.createdAt) order.createdAt = sort.createdAt;
    if (!sort?.createdAt && !sort?.name) order.createdAt = 'DESC';

    const result = await this.paginationService.paginateRepository(this.colorRepo, pagination, {
      where,
      order,
    });

    return {
      meta: { total: result.total, page: result.page, itemsPerPage: result.itemsPerPage, totalPages: result.totalPages },
      items: result.items,
    };
  }

  async findOne(id: string): Promise<VariableColor> {
    const color = await this.colorRepo.findOne({ where: { id } });
    if (!color) throw new NotFoundException('Color not found');
    return color;
  }

  async create(input: CreateVariableColorInput): Promise<VariableColor> {
    const existing = await this.colorRepo.findOne({ where: { hex: input.hex } });
    if (existing) {
      throw new ConflictException('Color with this HEX code already exists');
    }

    const identifier = await this.identifierService.generateNextIdentifier<VariableColor>(this.colorRepo, 'CLR');
    const color = this.colorRepo.create({
      identifier,
      name: input.name,
      hex: input.hex,
      availability: Availability.ACTIVE,
    });
    return this.colorRepo.save(color);
  }

  async update(id: string, input: UpdateVariableColorInput): Promise<VariableColor> {
    const color = await this.findOne(id);

    if (input.hex !== undefined) {
      const existing = await this.colorRepo.findOne({ where: { hex: input.hex } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Color with this HEX code already exists');
      }
    }

    if (input.name !== undefined) color.name = input.name;
    if (input.hex !== undefined) color.hex = input.hex;

    return this.colorRepo.save(color);
  }

  async changeAvailability(id: string, availability: Availability): Promise<VariableColor> {
    const color = await this.findOne(id);
    if (!this.availabilityFlowService.isValidDirectTransition(color.availability, availability)) {
      throw new BadRequestException('Invalid availability transition');
    }
    color.availability = availability;
    return this.colorRepo.save(color);
  }

  async delete(id: string): Promise<{ message: string }> {
    const color = await this.findOne(id);
    if (color.availability !== Availability.DELETED) {
      throw new BadRequestException('Color must be in DELETED availability state');
    }

    await this.deletabilityService.assertDeletable(DeletableEntityType.VARIABLE_COLOR, id);

    await this.colorRepo.remove(color);
    return { message: 'Color permanently deleted' };
  }
}
