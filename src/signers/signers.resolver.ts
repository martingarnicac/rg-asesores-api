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

import { SignersService } from '@/signers/signers.service';
import {
  SignerResponse,
  SignersPaginatedResponse,
  CreateSignerInput,
  UpdateSignerInput,
  SignerFilterInput,
  SignerSortInput,
  SignerLookupInput,
} from '@/signers/dto';
import { Signer } from '@/signers/entities';

@Resolver(() => Signer)
export class SignersResolver {
  constructor(
    private readonly signersService: SignersService,
    private readonly deletabilityService: DeletabilityService,
  ) {}

  @ResolveField(() => Boolean)
  async isDeletable(@Parent() signer: Signer): Promise<boolean> {
    return this.deletabilityService.isDeletable(DeletableEntityType.SIGNER, signer.id);
  }

  @Query(() => SignersPaginatedResponse)
  @UseGuards(GqlAuthGuard)
  async signers(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: SignerFilterInput,
    @Args('sort', { nullable: true }) sort?: SignerSortInput,
  ): Promise<SignersPaginatedResponse> {
    const result = await this.signersService.findAll(
      pagination || { page: 1, itemsPerPage: 10 },
      filter,
      sort,
    );
    return {
      ...ResponseBuilder.success(result, 'Signers retrieved successfully'),
      data: result,
    };
  }

  @Query(() => SignerResponse)
  @UseGuards(GqlAuthGuard)
  async signer(@Args('id') id: string): Promise<SignerResponse> {
    const result = await this.signersService.findOne(id);
    return {
      ...ResponseBuilder.success(result, 'Signer retrieved successfully'),
      data: result,
    };
  }

  @Query(() => SignerResponse)
  @UseGuards(GqlAuthGuard)
  async lookupSigner(
    @Args('input') input: SignerLookupInput,
  ): Promise<SignerResponse> {
    const result = await this.signersService.lookup(input);
    return {
      ...ResponseBuilder.success(result, result ? 'Signer found' : 'Signer not found'),
      data: result,
    };
  }

  @Mutation(() => SignerResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createSigner(@Args('input') input: CreateSignerInput): Promise<SignerResponse> {
    const result = await this.signersService.create(input);
    return {
      ...ResponseBuilder.created(result, 'Signer created successfully'),
      data: result,
    };
  }

  @Mutation(() => SignerResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateSigner(
    @Args('id') id: string,
    @Args('input') input: UpdateSignerInput,
  ): Promise<SignerResponse> {
    const result = await this.signersService.update(id, input);
    return {
      ...ResponseBuilder.success(result, 'Signer updated successfully'),
      data: result,
    };
  }

  @Mutation(() => SignerResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async changeSignerAvailability(
    @Args('id') id: string,
    @Args('availability', { type: () => Availability }) availability: Availability,
  ): Promise<SignerResponse> {
    const result = await this.signersService.changeAvailability(id, availability);
    return {
      ...ResponseBuilder.success(result, 'Signer availability changed successfully'),
      data: result,
    };
  }

  @Mutation(() => SignerResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteSigner(@Args('id') id: string): Promise<SignerResponse> {
    const result = await this.signersService.delete(id);
    return {
      ...ResponseBuilder.success(result.message, 'Signer permanently deleted'),
      data: null,
    };
  }
}
