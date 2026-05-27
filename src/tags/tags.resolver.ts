import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { ResponseBuilder } from '@/common/response';
import { DeletableEntityType } from '@/common/deletability/entities';
import { DeletabilityService } from '@/common/deletability/deletability.service';
import { Availability } from '@/common/availability/entities';
import { PaginationInput } from '@/common/pagination/dto';
import { GqlAuthGuard, RolesGuard } from '@/auth/guards';
import { Roles } from '@/auth/decorators';

import { UserRole } from '@/users/entities';
import { TagsService } from '@/tags/tags.service';

import {
  TagResponse,
  TagsByClauseResponse,
  TagsPaginatedResponse,
  CreateTagInput,
  UpdateTagInput,
  TagFilterInput,
  TagSortInput,
  AssignTagToClauseInput,
  RemoveTagFromClauseInput,
} from '@/tags/dto';
import { Tag } from '@/tags/entities';

@Resolver(() => Tag)
export class TagsResolver {
  constructor(
    private readonly tagsService: TagsService,
    private readonly deletabilityService: DeletabilityService,
  ) {}

  @ResolveField(() => Boolean)
  async isDeletable(@Parent() tag: Tag): Promise<boolean> {
    return this.deletabilityService.isDeletable(DeletableEntityType.TAG, tag.id);
  }

  @Query(() => TagsPaginatedResponse)
  @UseGuards(GqlAuthGuard)
  async tags(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: TagFilterInput,
    @Args('sort', { nullable: true }) sort?: TagSortInput,
  ): Promise<TagsPaginatedResponse> {
    const result = await this.tagsService.findAll(
      pagination || { page: 1, itemsPerPage: 10 },
      filter,
      sort,
    );
    return {
      ...ResponseBuilder.success(result, 'Tags retrieved successfully'),
      data: result,
    };
  }

  @Query(() => TagResponse)
  @UseGuards(GqlAuthGuard)
  async tag(@Args('id') id: string): Promise<TagResponse> {
    const result = await this.tagsService.findOne(id);
    return {
      ...ResponseBuilder.success(result, 'Tag retrieved successfully'),
      data: result,
    };
  }

  @Query(() => TagsByClauseResponse)
  @UseGuards(GqlAuthGuard)
  async tagsByClause(@Args('clauseId') clauseId: string): Promise<TagsByClauseResponse> {
    const result = await this.tagsService.findByClause(clauseId);
    return {
      ...ResponseBuilder.success(result, 'Tags retrieved successfully'),
      data: result,
    };
  }

  @Mutation(() => TagResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createTag(@Args('input') input: CreateTagInput): Promise<TagResponse> {
    const result = await this.tagsService.create(input);
    return {
      ...ResponseBuilder.created(result, 'Tag created successfully'),
      data: result,
    };
  }

  @Mutation(() => TagResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateTag(
    @Args('id') id: string,
    @Args('input') input: UpdateTagInput,
  ): Promise<TagResponse> {
    const result = await this.tagsService.update(id, input);
    return {
      ...ResponseBuilder.success(result, 'Tag updated successfully'),
      data: result,
    };
  }

  @Mutation(() => TagResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async changeTagAvailability(
    @Args('id') id: string,
    @Args('availability', { type: () => Availability }) availability: Availability,
  ): Promise<TagResponse> {
    const result = await this.tagsService.changeAvailability(id, availability);
    return {
      ...ResponseBuilder.success(result, 'Tag availability changed successfully'),
      data: result,
    };
  }

  @Mutation(() => TagResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteTag(@Args('id') id: string): Promise<TagResponse> {
    const result = await this.tagsService.delete(id);
    return {
      ...ResponseBuilder.success(result.message, 'Tag permanently deleted'),
      data: null,
    };
  }

  @Mutation(() => TagResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async assignTagToClause(
    @Args('input') input: AssignTagToClauseInput,
  ): Promise<TagResponse> {
    const result = await this.tagsService.assignTagToClause(input.clauseId, input.tagId);
    return {
      ...ResponseBuilder.success(result, 'Tag assigned to clause successfully'),
      data: result,
    };
  }

  @Mutation(() => TagResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async removeTagFromClause(
    @Args('input') input: RemoveTagFromClauseInput,
  ): Promise<TagResponse> {
    const result = await this.tagsService.removeTagFromClause(input.clauseId, input.tagId);
    return {
      ...ResponseBuilder.success(result.message, 'Tag removed from clause successfully'),
      data: null,
    };
  }
}
