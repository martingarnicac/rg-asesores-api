import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { Availability } from '@/common/availability/entities';
import { PaginationInput } from '@/common/pagination/dto';
import { ResponseBuilder } from '@/common/response';
import { Roles } from '@/auth/decorators';
import { GqlAuthGuard, RolesGuard } from '@/auth/guards';

import { UserRole } from '@/users/entities';
import { VariableIconsService } from '@/variables/variable-icons/variable-icons.service';

import {
  VariableIconResponse,
  VariableIconsPaginatedResponse,
  CreateVariableIconInput,
  UpdateVariableIconInput,
  VariableIconFilterInput,
  VariableIconSortInput,
} from '@/variables/variable-icons/dto';

@Resolver()
export class VariableIconsResolver {
  constructor(private readonly variableIconsService: VariableIconsService) {}

  @Query(() => VariableIconsPaginatedResponse)
  @UseGuards(GqlAuthGuard)
  async variableIcons(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: VariableIconFilterInput,
    @Args('sort', { nullable: true }) sort?: VariableIconSortInput,
  ): Promise<VariableIconsPaginatedResponse> {
    const result = await this.variableIconsService.findAll(
      pagination || { page: 1, itemsPerPage: 10 },
      filter,
      sort,
    );
    return {
      ...ResponseBuilder.success(result, 'Icons retrieved successfully'),
      data: result,
    };
  }

  @Query(() => VariableIconResponse)
  @UseGuards(GqlAuthGuard)
  async variableIcon(@Args('id') id: string): Promise<VariableIconResponse> {
    const result = await this.variableIconsService.findOne(id);
    return {
      ...ResponseBuilder.success(result, 'Icon retrieved successfully'),
      data: result,
    };
  }

  @Mutation(() => VariableIconResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createVariableIcon(@Args('input') input: CreateVariableIconInput): Promise<VariableIconResponse> {
    const result = await this.variableIconsService.create(input);
    return {
      ...ResponseBuilder.created(result, 'Icon created successfully'),
      data: result,
    };
  }

  @Mutation(() => VariableIconResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateVariableIcon(
    @Args('id') id: string,
    @Args('input') input: UpdateVariableIconInput,
  ): Promise<VariableIconResponse> {
    const result = await this.variableIconsService.update(id, input);
    return {
      ...ResponseBuilder.success(result, 'Icon updated successfully'),
      data: result,
    };
  }

  @Mutation(() => VariableIconResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async changeVariableIconAvailability(
    @Args('id') id: string,
    @Args('availability', { type: () => Availability }) availability: Availability,
  ): Promise<VariableIconResponse> {
    const result = await this.variableIconsService.changeAvailability(id, availability);
    return {
      ...ResponseBuilder.success(result, 'Icon availability changed successfully'),
      data: result,
    };
  }

  @Mutation(() => VariableIconResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteVariableIcon(@Args('id') id: string): Promise<VariableIconResponse> {
    const result = await this.variableIconsService.delete(id);
    return {
      ...ResponseBuilder.success(result.message, 'Icon permanently deleted'),
      data: null,
    };
  }
}
