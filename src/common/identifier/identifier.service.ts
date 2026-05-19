import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';

@Injectable()
export class IdentifierService {
  private readonly logger = new Logger(IdentifierService.name);

  async generateNextIdentifier<T extends ObjectLiteral>(
    repo: Repository<T>,
    prefix: string,
    options?: {
      columnName?: string;
      where?: any;
      padLength?: number;
    },
  ): Promise<string> {
    const column = options?.columnName ?? 'identifier';
    const padLength = options?.padLength ?? 4;
    const whereClause = options?.where ?? {};

    // Obtener el último registro ordenado por identifier descendente
    const lastRecord = await repo.findOne({
      where: whereClause,
      order: { [column]: 'DESC' } as any,
      select: [column] as any,
    });

    let nextSequence = 1;

    if (lastRecord && (lastRecord as any)[column]) {
      const lastIdentifier: string = (lastRecord as any)[column];
      const match = lastIdentifier.match(new RegExp(`^${prefix}\\-(\\d+)$`));
      if (match) {
        nextSequence = parseInt(match[1], 10) + 1;
      }
    }

    const identifier = `${prefix}-${String(nextSequence).padStart(padLength, '0')}`;

    // Verificar que no exista (por si acaso)
    const exists = await repo.findOne({
      where: { [column]: identifier, ...whereClause } as any,
      select: ['id'] as any,
    });

    if (exists) {
      this.logger.warn(`Identifier ${identifier} already exists, retrying with next sequence`);
      return this.generateNextIdentifier(repo, prefix, {
        ...options,
        where: { ...whereClause, [column]: undefined },
      });
    }

    return identifier;
  }
}
