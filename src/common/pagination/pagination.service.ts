import { Injectable } from '@nestjs/common';

export interface PaginationInput {
  page: number;
  itemsPerPage: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  itemsPerPage: number;
  totalPages: number;
}

@Injectable()
export class PaginationService {
  paginate<T>(items: T[], total: number, input: PaginationInput): PaginatedResult<T> {
    const totalPages = Math.ceil(total / input.itemsPerPage);
    return {
      items,
      total,
      page: input.page,
      itemsPerPage: input.itemsPerPage,
      totalPages,
    };
  }

  async paginateRepository<T>(
    repo: { findAndCount: (options: object) => Promise<[T[], number]> },
    input: PaginationInput,
    findOptions: object = {},
  ): Promise<PaginatedResult<T>> {
    const [items, total] = await repo.findAndCount({
      ...findOptions,
      skip: (input.page - 1) * input.itemsPerPage,
      take: input.itemsPerPage,
    });
    return this.paginate(items, total, input);
  }
}
