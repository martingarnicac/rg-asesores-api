import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { ResponseBuilder } from '@/common/response';
import { Availability } from '@/common/availability/entities';
import { PaginationInput } from '@/common/pagination/dto';
import { GqlAuthGuard, RolesGuard } from '@/auth/guards';
import { Roles } from '@/auth/decorators';

import { UserRole } from '@/users/entities';
import { VariablesService } from '@/variables/variables.service';

import {
  VariableResponse,
  VariablesPaginatedResponse,
  CreateVariableInput,
  UpdateVariableInput,
  VariableFilterInput,
  VariableSortInput,
} from '@/variables/dto';

@Resolver()
export class VariablesResolver {
  constructor(private readonly variablesService: VariablesService) {}

  @Query(() => VariablesPaginatedResponse)
  @UseGuards(GqlAuthGuard)
  async variables(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: VariableFilterInput,
    @Args('sort', { nullable: true }) sort?: VariableSortInput,
  ): Promise<VariablesPaginatedResponse> {
    const result = await this.variablesService.findAll(
      pagination || { page: 1, itemsPerPage: 10 },
      filter,
      sort,
    );
    return {
      ...ResponseBuilder.success(result, 'Variables retrieved successfully'),
      data: result,
    };
  }

  @Query(() => VariableResponse)
  @UseGuards(GqlAuthGuard)
  async variable(@Args('id') id: string): Promise<VariableResponse> {
    const result = await this.variablesService.findOne(id);
    return {
      ...ResponseBuilder.success(result, 'Variable retrieved successfully'),
      data: result,
    };
  }

  @Mutation(() => VariableResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createVariable(@Args('input') input: CreateVariableInput): Promise<VariableResponse> {
    const result = await this.variablesService.create(input);
    return {
      ...ResponseBuilder.created(result, 'Variable created successfully'),
      data: result,
    };
  }

  @Mutation(() => VariableResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateVariable(
    @Args('id') id: string,
    @Args('input') input: UpdateVariableInput,
  ): Promise<VariableResponse> {
    const result = await this.variablesService.update(id, input);
    return {
      ...ResponseBuilder.success(result, 'Variable updated successfully'),
      data: result,
    };
  }

  @Mutation(() => VariableResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async changeVariableAvailability(
    @Args('id') id: string,
    @Args('availability', { type: () => Availability }) availability: Availability,
  ): Promise<VariableResponse> {
    const result = await this.variablesService.changeAvailability(id, availability);
    return {
      ...ResponseBuilder.success(result, 'Variable availability changed successfully'),
      data: result,
    };
  }

  @Mutation(() => VariableResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteVariable(@Args('id') id: string): Promise<VariableResponse> {
    const result = await this.variablesService.delete(id);
    return {
      ...ResponseBuilder.success(result.message, 'Variable permanently deleted'),
      data: null,
    };
  }
}
