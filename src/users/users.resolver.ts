import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';

import { UsersService } from '@/users/users.service';
import { AuthTokenService } from '@/auth/auth-token.service';
import { GqlAuthGuard, RolesGuard } from '@/auth/guards';
import { CurrentUser, Roles } from '@/auth/decorators';

import { User, UserRole } from '@/users/entities';
import { AuthToken } from '@/auth/entities';
import { Availability } from '@/common/availability/entities';
import { ResponseBuilder } from '@/common/response';
import { DeletableEntityType } from '@/common/deletability/entities';
import { DeletabilityService } from '@/common/deletability/deletability.service';

import {
  CreateUserInput,
  UpdateUserInput,
  UserResponse,
  UsersPaginatedResponse,
  DeleteResponse,
  UserFilterInput,
  UserSortInput,
} from '@/users/dto';
import { PaginationInput } from '@/common/pagination/dto';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly authTokenService: AuthTokenService,
    private readonly deletabilityService: DeletabilityService,
  ) {}

  @ResolveField(() => Boolean)
  async isDeletable(@Parent() user: User): Promise<boolean> {
    return this.deletabilityService.isDeletable(DeletableEntityType.USER, user.id);
  }

  @ResolveField(() => AuthToken, { nullable: true })
  async lastSession(@Parent() user: User): Promise<AuthToken | null> {
    return this.authTokenService.getLastSession(user.id);
  }

  @Query(() => UsersPaginatedResponse)
  @UseGuards(GqlAuthGuard)
  async users(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: UserFilterInput,
    @Args('sort', { nullable: true }) sort?: UserSortInput,
  ): Promise<UsersPaginatedResponse> {
    const result = await this.usersService.findAll(
      pagination || { page: 1, itemsPerPage: 10 },
      filter,
      sort,
    );
    return {
      ...ResponseBuilder.success(result, 'Users retrieved successfully'),
      data: result,
    };
  }

  @Query(() => UserResponse)
  @UseGuards(GqlAuthGuard)
  async user(@Args('id') id: string): Promise<UserResponse> {
    const result = await this.usersService.findOne(id);
    return {
      ...ResponseBuilder.success(result, 'User retrieved successfully'),
      data: result,
    };
  }

  @Mutation(() => UserResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createUser(@Args('input') input: CreateUserInput): Promise<UserResponse> {
    const result = await this.usersService.create(input);
    return {
      ...ResponseBuilder.created(result, 'User created successfully'),
      data: result,
    };
  }

  @Mutation(() => UserResponse)
  @UseGuards(GqlAuthGuard)
  async updateUser(
    @Args('id') id: string,
    @Args('input') input: UpdateUserInput,
  ): Promise<UserResponse> {
    const result = await this.usersService.update(id, input);
    return {
      ...ResponseBuilder.success(result, 'User updated successfully'),
      data: result,
    };
  }

  @Mutation(() => UserResponse)
  @UseGuards(GqlAuthGuard)
  async changeUserAvailability(
    @CurrentUser() currentUser: User,
    @Args('id') id: string,
    @Args('availability', { type: () => Availability }) availability: Availability,
  ): Promise<UserResponse> {
    if (currentUser.id === id) {
      throw new ForbiddenException('You cannot change your own availability');
    }
    const result = await this.usersService.transitionAvailability(id, availability);
    return {
      ...ResponseBuilder.success(result, 'User availability changed successfully'),
      data: result,
    };
  }

  @Mutation(() => DeleteResponse)
  @UseGuards(GqlAuthGuard)
  async deleteUser(
    @CurrentUser() currentUser: User,
    @Args('id') id: string,
  ): Promise<DeleteResponse> {
    if (currentUser.id === id) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    const result = await this.usersService.delete(id);
    return {
      ...ResponseBuilder.success(result.message, 'User permanently deleted'),
      data: result.message,
    };
  }
}
