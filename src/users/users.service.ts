import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, FindOptionsWhere, FindOptionsOrder, In } from 'typeorm';

import { CryptoService } from '@/common/crypto/crypto.service';
import { AvailabilityFlowService } from '@/common/availability/availability-flow.service';
import { PaginationService } from '@/common/pagination/pagination.service';
import { FilterSortService } from '@/common/filter-sort/filter-sort.service';
import { IdentifierService } from '@/common/identifier/identifier.service';
import { DeletableEntityType } from '@/common/deletability/entities';
import { DeletabilityService } from '@/common/deletability/deletability.service';
import { AuthService } from '@/auth/auth.service';

import { Availability, AvailabilityAction } from '@/common/availability/entities';
import { User } from '@/users/entities';
import { PaginationInput } from '@/common/pagination/dto';
import { CreateUserInput, UpdateUserInput, UserFilterInput, UserSortInput } from '@/users/dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly paginationService: PaginationService,
    private readonly availabilityFlowService: AvailabilityFlowService,
    private readonly cryptoService: CryptoService,
    private readonly filterSortService: FilterSortService,
    private readonly identifierService: IdentifierService,
    private readonly authService: AuthService,
    private readonly deletabilityService: DeletabilityService,
  ) {}

  async findAll(
    pagination: PaginationInput,
    filter?: UserFilterInput,
    sort?: UserSortInput,
  ): Promise<{ meta: { total: number; page: number; itemsPerPage: number; totalPages: number }; items: User[] }> {
    // Build dynamic where using common filter-sort service
    let where = this.filterSortService.buildWhere<User>(filter, {
      search: { fields: ['name', 'email'] },
    });

    const mergeConditions = (target: any) => {
      target.availability = Not(Availability.DELETED);
      if (filter?.role && filter.role.length > 0) {
        target.role = In(filter.role);
      }
    };

    if (Array.isArray(where)) {
      for (const condition of where) {
        mergeConditions(condition);
      }
    } else {
      mergeConditions(where);
    }

    // Build dynamic order using common filter-sort service
    const order = this.filterSortService.buildOrder<User>(sort);
    // Default sort by createdAt DESC if no sort provided
    if (!sort?.createdAt && !sort?.availability && !sort?.name && !sort?.email && !sort?.role) {
      (order as any).createdAt = 'DESC';
    }
    if (sort?.name) { (order as any).name = sort.name; }
    if (sort?.email) { (order as any).email = sort.email; }
    if (sort?.role) { (order as any).role = sort.role; }

    const result = await this.paginationService.paginateRepository(this.userRepo, pagination, {
      where: where as any,
      order,
    });

    return {
      meta: {
        total: result.total,
        page: result.page,
        itemsPerPage: result.itemsPerPage,
        totalPages: result.totalPages,
      },
      items: result.items,
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(input: CreateUserInput): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const identifier = await this.identifierService.generateNextIdentifier<User>(
      this.userRepo,
      'USRIO',
    );

    const passwordHash = await this.cryptoService.hashPassword(input.password);
    const user = this.userRepo.create({
      identifier,
      email: input.email,
      passwordHash,
      name: input.name,
      lastname: input.lastname ?? null,
      role: input.role,
      availability: Availability.INACTIVE,
    });
    await this.userRepo.save(user);

    await this.authService.sendVerificationEmail(user);

    return user;
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.findOne(id);

    if (input.name !== undefined) user.name = input.name;
    if (input.lastname !== undefined) user.lastname = input.lastname ?? null;
    if (input.role !== undefined) user.role = input.role;

    return this.userRepo.save(user);
  }

  getAvailableActions(id: string): Promise<AvailabilityAction[]> {
    return this.findOne(id).then((user) =>
      this.availabilityFlowService.getAvailableActions(user.availability),
    );
  }

  async transitionAvailability(id: string, availability: Availability): Promise<User> {
    const user = await this.findOne(id);
    if (!this.availabilityFlowService.isValidDirectTransition(user.availability, availability)) {
      throw new BadRequestException('Invalid availability transition');
    }
    user.availability = availability;
    return this.userRepo.save(user);
  }

  async delete(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);
    if (user.availability !== Availability.DELETED) {
      throw new BadRequestException('User must be in DELETED availability state');
    }

    await this.deletabilityService.assertDeletable(DeletableEntityType.USER, id);

    await this.userRepo.remove(user);
    return { message: 'User permanently deleted' };
  }
}
