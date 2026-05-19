import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, FindOptionsOrder, Between, LessThan, MoreThan, In, ILike } from 'typeorm';
import { BaseFilterInput } from './inputs/base-filter.input';
import { BaseSortInput } from './inputs/base-sort.input';

export interface SearchFieldConfig<T> {
  fields: (keyof T)[];
}

export interface FilterSortConfig<T> {
  search?: SearchFieldConfig<T>;
}

@Injectable()
export class FilterSortService {
  buildWhere<T extends Record<string, any>>(
    filter: BaseFilterInput | undefined,
    config?: FilterSortConfig<T>,
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    const baseWhere: any = {};
    if (!filter) return baseWhere;

    // Availability enum filter
    if (filter.availability && filter.availability.length > 0) {
      baseWhere.availability = In(filter.availability);
    }

    // CreatedAt date range
    if (filter.createdAtFrom || filter.createdAtTo) {
      if (filter.createdAtFrom && filter.createdAtTo) {
        baseWhere.createdAt = Between(
          new Date(filter.createdAtFrom),
          new Date(filter.createdAtTo),
        );
      } else if (filter.createdAtFrom) {
        baseWhere.createdAt = MoreThan(new Date(filter.createdAtFrom));
      } else if (filter.createdAtTo) {
        baseWhere.createdAt = LessThan(new Date(filter.createdAtTo));
      }
    }

    // Search term (ILike on configured fields) — TypeORM OR via array
    if (filter.searchTerm && config?.search?.fields.length) {
      const searchValue = `%${filter.searchTerm}%`;
      return config.search.fields.map((field) => ({
        ...baseWhere,
        [field]: ILike(searchValue),
      })) as FindOptionsWhere<T>[];
    }

    return baseWhere as FindOptionsWhere<T>;
  }

  buildOrder<T extends Record<string, any>>(
    sort: BaseSortInput | undefined,
  ): FindOptionsOrder<T> {
    const order: any = {};
    if (!sort) return order;

    if (sort.createdAt) {
      order.createdAt = sort.createdAt;
    }
    if (sort.availability) {
      order.availability = sort.availability;
    }

    return order as FindOptionsOrder<T>;
  }
}
