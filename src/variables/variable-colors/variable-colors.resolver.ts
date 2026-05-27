import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { Availability } from '@/common/availability/entities';
import { ResponseBuilder } from '@/common/response';
import { DeletableEntityType } from '@/common/deletability/entities';
import { DeletabilityService } from '@/common/deletability/deletability.service';
import { PaginationInput } from '@/common/pagination/dto';
import { GqlAuthGuard, RolesGuard } from '@/auth/guards';
import { Roles } from '@/auth/decorators';

import { UserRole } from '@/users/entities';
import { VariableColorsService } from '@/variables/variable-colors/variable-colors.service';

import {
  VariableColorResponse,
  VariableColorsPaginatedResponse,
  CreateVariableColorInput,
  UpdateVariableColorInput,
  VariableColorFilterInput,
  VariableColorSortInput,
} from '@/variables/variable-colors/dto';
import { VariableColor } from '@/variables/variable-colors/entities';

@Resolver(() => VariableColor)
export class VariableColorsResolver {
  constructor(
    private readonly variableColorsService: VariableColorsService,
    private readonly deletabilityService: DeletabilityService,
  ) {}

  @ResolveField(() => Boolean)
  async isDeletable(@Parent() color: VariableColor): Promise<boolean> {
    return this.deletabilityService.isDeletable(DeletableEntityType.VARIABLE_COLOR, color.id);
  }

  @Query(() => VariableColorsPaginatedResponse)
  @UseGuards(GqlAuthGuard)
  async variableColors(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: VariableColorFilterInput,
    @Args('sort', { nullable: true }) sort?: VariableColorSortInput,
  ): Promise<VariableColorsPaginatedResponse> {
    const result = await this.variableColorsService.findAll(
      pagination || { page: 1, itemsPerPage: 10 },
      filter,
      sort,
    );
    return {
      ...ResponseBuilder.success(result, 'Colors retrieved successfully'),
      data: result,
    };
  }

  @Query(() => VariableColorResponse)
  @UseGuards(GqlAuthGuard)
  async variableColor(@Args('id') id: string): Promise<VariableColorResponse> {
    const result = await this.variableColorsService.findOne(id);
    return {
      ...ResponseBuilder.success(result, 'Color retrieved successfully'),
      data: result,
    };
  }

  @Mutation(() => VariableColorResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createVariableColor(@Args('input') input: CreateVariableColorInput): Promise<VariableColorResponse> {
    const result = await this.variableColorsService.create(input);
    return {
      ...ResponseBuilder.created(result, 'Color created successfully'),
      data: result,
    };
  }

  @Mutation(() => VariableColorResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateVariableColor(
    @Args('id') id: string,
    @Args('input') input: UpdateVariableColorInput,
  ): Promise<VariableColorResponse> {
    const result = await this.variableColorsService.update(id, input);
    return {
      ...ResponseBuilder.success(result, 'Color updated successfully'),
      data: result,
    };
  }

  @Mutation(() => VariableColorResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async changeVariableColorAvailability(
    @Args('id') id: string,
    @Args('availability', { type: () => Availability }) availability: Availability,
  ): Promise<VariableColorResponse> {
    const result = await this.variableColorsService.changeAvailability(id, availability);
    return {
      ...ResponseBuilder.success(result, 'Color availability changed successfully'),
      data: result,
    };
  }

  @Mutation(() => VariableColorResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteVariableColor(@Args('id') id: string): Promise<VariableColorResponse> {
    const result = await this.variableColorsService.delete(id);
    return {
      ...ResponseBuilder.success(result.message, 'Color permanently deleted'),
      data: null,
    };
  }
}
