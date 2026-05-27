import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { ResponseBuilder } from '@/common/response';
import { DeletableEntityType } from '@/common/deletability/entities';
import { DeletabilityService } from '@/common/deletability/deletability.service';
import { Availability } from '@/common/availability/entities';
import { PaginationInput } from '@/common/pagination/dto';
import { GqlAuthGuard, RolesGuard } from '@/auth/guards';
import { Roles } from '@/auth/decorators';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';

import { UserRole } from '@/users/entities';
import { ClausesService } from '@/clauses/clauses.service';

import {
  ClauseResponse,
  ClausesPaginatedResponse,
  CreateClauseInput,
  UpdateClauseInput,
  ClauseFilterInput,
  ClauseSortInput,
} from '@/clauses/dto';
import { Clause } from '@/clauses/entities';

@Resolver(() => Clause)
export class ClausesResolver {
  constructor(
    private readonly clausesService: ClausesService,
    private readonly deletabilityService: DeletabilityService,
  ) {}

  @ResolveField(() => Boolean)
  async isDeletable(@Parent() clause: Clause): Promise<boolean> {
    return this.deletabilityService.isDeletable(DeletableEntityType.CLAUSE, clause.id);
  }

  @Query(() => ClausesPaginatedResponse)
  @UseGuards(GqlAuthGuard)
  async clauses(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: ClauseFilterInput,
    @Args('sort', { nullable: true }) sort?: ClauseSortInput,
  ): Promise<ClausesPaginatedResponse> {
    const result = await this.clausesService.findAll(
      pagination || { page: 1, itemsPerPage: 10 },
      filter,
      sort,
    );
    return {
      ...ResponseBuilder.success(result, 'Clauses retrieved successfully'),
      data: result,
    };
  }

  @Query(() => ClauseResponse)
  @UseGuards(GqlAuthGuard)
  async clause(@Args('id') id: string): Promise<ClauseResponse> {
    const result = await this.clausesService.findOne(id);
    return {
      ...ResponseBuilder.success(result, 'Clause retrieved successfully'),
      data: result,
    };
  }

  @Mutation(() => ClauseResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createClause(
    @Args('input') input: CreateClauseInput,
    @CurrentUser() user: any,
    @Args('replacesClauseId', { nullable: true }) replacesClauseId?: string,
  ): Promise<ClauseResponse> {
    const result = await this.clausesService.create(input, user.id, replacesClauseId);
    return {
      ...ResponseBuilder.created(result, 'Clause created successfully'),
      data: result,
    };
  }

  @Mutation(() => ClauseResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateClause(
    @Args('id') id: string,
    @Args('input') input: UpdateClauseInput,
  ): Promise<ClauseResponse> {
    const result = await this.clausesService.update(id, input);
    return {
      ...ResponseBuilder.success(result, 'Clause updated successfully'),
      data: result,
    };
  }

  @Mutation(() => ClauseResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async changeClauseAvailability(
    @Args('id') id: string,
    @Args('availability', { type: () => Availability }) availability: Availability,
  ): Promise<ClauseResponse> {
    const result = await this.clausesService.changeAvailability(id, availability);
    return {
      ...ResponseBuilder.success(result, 'Clause availability changed successfully'),
      data: result,
    };
  }

  @Mutation(() => ClauseResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteClause(@Args('id') id: string): Promise<ClauseResponse> {
    const result = await this.clausesService.delete(id);
    return {
      ...ResponseBuilder.success(result.message, 'Clause permanently deleted'),
      data: null,
    };
  }
}
