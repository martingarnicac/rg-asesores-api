import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsOrder, In, ILike, Between, MoreThan, LessThan } from 'typeorm';

import { Availability } from '@/common/availability/entities';
import { AvailabilityFlowService } from '@/common/availability/availability-flow.service';
import { PaginationService } from '@/common/pagination/pagination.service';
import { IdentifierService } from '@/common/identifier/identifier.service';
import { DeletableEntityType } from '@/common/deletability/entities';
import { DeletabilityService } from '@/common/deletability/deletability.service';

import { Tag, ClauseTag } from '@/tags/entities';
import { Clause } from '@/clauses/entities';
import { CreateTagInput, UpdateTagInput } from '@/tags/dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
    @InjectRepository(ClauseTag)
    private readonly clauseTagRepo: Repository<ClauseTag>,
    @InjectRepository(Clause)
    private readonly clauseRepo: Repository<Clause>,
    private readonly paginationService: PaginationService,
    private readonly availabilityFlowService: AvailabilityFlowService,
    private readonly identifierService: IdentifierService,
    private readonly deletabilityService: DeletabilityService,
  ) {}

  private generateSlug(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
  }

  async findAll(
    pagination: { page: number; itemsPerPage: number },
    filter?: { availability?: Availability[]; searchTerm?: string; createdAtFrom?: string; createdAtTo?: string },
    sort?: { createdAt?: 'ASC' | 'DESC'; name?: 'ASC' | 'DESC' },
  ) {
    let where: FindOptionsWhere<Tag> | FindOptionsWhere<Tag>[] = {};

    if (filter?.availability?.length) {
      (where as any).availability = In(filter.availability);
    }

    if (filter?.searchTerm) {
      const searchValue = `%${filter.searchTerm}%`;
      where = [
        { ...where, name: ILike(searchValue) },
        { ...where, slug: ILike(searchValue) },
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

    const order: FindOptionsOrder<Tag> = {};
    if (sort?.createdAt) order.createdAt = sort.createdAt;
    if (sort?.name) order.name = sort.name;
    if (!sort?.createdAt && !sort?.name) order.createdAt = 'DESC';

    const result = await this.paginationService.paginateRepository(this.tagRepo, pagination, {
      where,
      order,
    });

    return {
      meta: { total: result.total, page: result.page, itemsPerPage: result.itemsPerPage, totalPages: result.totalPages },
      items: result.items,
    };
  }

  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagRepo.findOne({ where: { id } });
    if (!tag) throw new NotFoundException('Tag not found');
    return tag;
  }

  async findByClause(clauseId: string): Promise<Tag[]> {
    const clause = await this.clauseRepo.findOne({ where: { id: clauseId } });
    if (!clause) throw new NotFoundException('Clause not found');

    const clauseTags = await this.clauseTagRepo.find({
      where: { clauseId },
      relations: ['tag'],
    });
    return clauseTags.map((ct) => ct.tag);
  }

  async create(input: CreateTagInput): Promise<Tag> {
    const slug = this.generateSlug(input.name);
    const existingSlug = await this.tagRepo.findOne({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException('Tag with this name/slug already exists');
    }

    const identifier = await this.identifierService.generateNextIdentifier<Tag>(this.tagRepo, 'TAG');

    const tag = this.tagRepo.create({
      identifier,
      name: input.name,
      slug,
      availability: Availability.ACTIVE,
    });

    return this.tagRepo.save(tag);
  }

  async update(id: string, input: UpdateTagInput): Promise<Tag> {
    const tag = await this.findOne(id);

    if (input.name !== undefined) {
      const slug = this.generateSlug(input.name);
      const existing = await this.tagRepo.findOne({ where: { slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Tag with this name/slug already exists');
      }
      tag.name = input.name;
      tag.slug = slug;
    }

    return this.tagRepo.save(tag);
  }

  async changeAvailability(id: string, availability: Availability): Promise<Tag> {
    const tag = await this.findOne(id);
    if (!this.availabilityFlowService.isValidDirectTransition(tag.availability, availability)) {
      throw new BadRequestException('Invalid availability transition');
    }
    tag.availability = availability;
    return this.tagRepo.save(tag);
  }

  async delete(id: string): Promise<{ message: string }> {
    const tag = await this.findOne(id);
    if (tag.availability !== Availability.DELETED) {
      throw new BadRequestException('Tag must be in DELETED availability state');
    }

    await this.deletabilityService.assertDeletable(DeletableEntityType.TAG, id);

    await this.tagRepo.remove(tag);
    return { message: 'Tag permanently deleted' };
  }

  async assignTagToClause(clauseId: string, tagId: string): Promise<Tag> {
    const clause = await this.clauseRepo.findOne({ where: { id: clauseId } });
    if (!clause) throw new NotFoundException('Clause not found');

    const tag = await this.tagRepo.findOne({ where: { id: tagId } });
    if (!tag) throw new NotFoundException('Tag not found');

    const existingAssignment = await this.clauseTagRepo.findOne({ where: { clauseId, tagId } });
    if (existingAssignment) {
      throw new ConflictException('Tag is already assigned to this clause');
    }

    const assignment = this.clauseTagRepo.create({ clauseId, tagId });
    await this.clauseTagRepo.save(assignment);

    return tag;
  }

  async removeTagFromClause(clauseId: string, tagId: string): Promise<{ message: string }> {
    const clause = await this.clauseRepo.findOne({ where: { id: clauseId } });
    if (!clause) throw new NotFoundException('Clause not found');

    const tag = await this.tagRepo.findOne({ where: { id: tagId } });
    if (!tag) throw new NotFoundException('Tag not found');

    const assignment = await this.clauseTagRepo.findOne({ where: { clauseId, tagId } });
    if (!assignment) {
      throw new BadRequestException('Tag is not assigned to this clause');
    }

    await this.clauseTagRepo.remove(assignment);

    return { message: 'Tag removed from clause successfully' };
  }
}
