import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsOrder } from 'typeorm';

import { Availability } from '@/common/availability/entities';
import { AvailabilityFlowService } from '@/common/availability/availability-flow.service';
import { PaginationService } from '@/common/pagination/pagination.service';
import { FilterSortService } from '@/common/filter-sort/filter-sort.service';
import { IdentifierService } from '@/common/identifier/identifier.service';
import { DeletableEntityType } from '@/common/deletability/entities';
import { DeletabilityService } from '@/common/deletability/deletability.service';

import { Signer } from '@/signers/entities';
import { CreateSignerInput, UpdateSignerInput, SignerFilterInput, SignerSortInput } from '@/signers/dto';

@Injectable()
export class SignersService {
  constructor(
    @InjectRepository(Signer)
    private readonly signerRepo: Repository<Signer>,
    private readonly paginationService: PaginationService,
    private readonly filterSortService: FilterSortService,
    private readonly availabilityFlowService: AvailabilityFlowService,
    private readonly identifierService: IdentifierService,
    private readonly deletabilityService: DeletabilityService,
  ) {}

  async findAll(
    pagination: { page: number; itemsPerPage: number },
    filter?: SignerFilterInput,
    sort?: SignerSortInput,
  ) {
    const baseWhere = this.filterSortService.buildWhere<Signer>(filter, {
      search: { fields: ['name', 'lastname', 'email'] },
    });

    let where: FindOptionsWhere<Signer> | FindOptionsWhere<Signer>[] = baseWhere;

    const order: FindOptionsOrder<Signer> = this.filterSortService.buildOrder<Signer>(sort);
    if (sort?.name) order.name = sort.name;
    if (sort?.lastname) order.lastname = sort.lastname;
    if (!sort?.createdAt && !sort?.availability && !sort?.name && !sort?.lastname) {
      order.createdAt = 'DESC';
    }

    const result = await this.paginationService.paginateRepository(this.signerRepo, pagination, {
      where,
      order,
    });

    return {
      meta: { total: result.total, page: result.page, itemsPerPage: result.itemsPerPage, totalPages: result.totalPages },
      items: result.items,
    };
  }

  async findOne(id: string): Promise<Signer> {
    const signer = await this.signerRepo.findOne({ where: { id } });
    if (!signer) throw new NotFoundException('Signer not found');
    return signer;
  }

  async lookup(input: { email?: string; phone?: string }): Promise<Signer | null> {
    if (input.email) {
      return this.signerRepo.findOne({ where: { email: input.email } });
    }
    if (input.phone) {
      return this.signerRepo.findOne({ where: { phone: input.phone } });
    }
    return null;
  }

  async create(input: CreateSignerInput): Promise<Signer> {
    const existingEmail = await this.signerRepo.findOne({ where: { email: input.email } });
    if (existingEmail) {
      throw new ConflictException('Signer with this email already exists');
    }

    if (input.phone) {
      const existingPhone = await this.signerRepo.findOne({ where: { phone: input.phone } });
      if (existingPhone) {
        throw new ConflictException('Signer with this phone already exists');
      }
    }

    const identifier = await this.identifierService.generateNextIdentifier<Signer>(this.signerRepo, 'SGN');

    const signer = this.signerRepo.create({
      identifier,
      name: input.name,
      lastname: input.lastname,
      email: input.email,
      phone: input.phone,
      availability: Availability.ACTIVE,
    });

    return this.signerRepo.save(signer);
  }

  async update(id: string, input: UpdateSignerInput): Promise<Signer> {
    const signer = await this.findOne(id);

    if (input.email !== undefined && input.email !== signer.email) {
      const existing = await this.signerRepo.findOne({ where: { email: input.email } });
      if (existing) {
        throw new ConflictException('Signer with this email already exists');
      }
      signer.email = input.email;
    }

    if (input.phone !== undefined && input.phone !== signer.phone) {
      const existing = await this.signerRepo.findOne({ where: { phone: input.phone } });
      if (existing) {
        throw new ConflictException('Signer with this phone already exists');
      }
      signer.phone = input.phone;
    }

    if (input.name !== undefined) signer.name = input.name;
    if (input.lastname !== undefined) signer.lastname = input.lastname;

    return this.signerRepo.save(signer);
  }

  async changeAvailability(id: string, availability: Availability): Promise<Signer> {
    const signer = await this.findOne(id);
    if (!this.availabilityFlowService.isValidDirectTransition(signer.availability, availability)) {
      throw new BadRequestException('Invalid availability transition');
    }
    signer.availability = availability;
    return this.signerRepo.save(signer);
  }

  async delete(id: string): Promise<{ message: string }> {
    const signer = await this.findOne(id);
    if (signer.availability !== Availability.DELETED) {
      throw new BadRequestException('Signer must be in DELETED availability state');
    }

    await this.deletabilityService.assertDeletable(DeletableEntityType.SIGNER, id);

    await this.signerRepo.remove(signer);
    return { message: 'Signer permanently deleted' };
  }
}
