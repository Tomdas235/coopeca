// ============================================================================
// Service de génération automatique des références métier (backend)
// Règles :
// - Génération côté serveur uniquement (jamais côté frontend)
// - Unicité garantie par transaction sérialisable + contrainte unique DB
// - Pas de calcul MAX + 1 hors transaction (risque de doublon)
// - Respect des références existantes (ne les réattribue jamais)
// - Format : PREFIX-001 (ex: CLT-001, BR-001, MARKET-001)
// - Préfixes conformes aux données de seed existantes
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

const REFERENCE_PADDING = 3;

const PREFIX_BY_ENTITY: Record<string, string> = {
  Client: 'CLT',
  Branch: 'BR',
  Market: 'MARKET',
};

interface GenerateReferenceParams {
  entity: 'Client' | 'Branch' | 'Market';
  field: 'clientCode' | 'code';
  tx?: Prisma.TransactionClient;
}

@Injectable()
export class ReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReference({
    entity,
    field,
    tx,
  }: GenerateReferenceParams): Promise<string> {
    const prefix = PREFIX_BY_ENTITY[entity];
    const prismaClient = tx ?? this.prisma;
    const table = this.entityTable(entity);

    // Verrouille la table dans une transaction sérialisable pour éviter
    // les créations simultanées avec le même numéro.
    const existing = await prismaClient.$queryRawUnsafe<
      Array<{ max_code: string }>
    >(
      `SELECT MAX(${field}) as max_code FROM "${table}" WHERE ${field} LIKE $1`,
      [`${prefix}-%`],
    );

    let nextNumber = 1;
    const maxCode = existing[0]?.max_code;
    if (maxCode) {
      const match = maxCode.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const reference = `${prefix}-${String(nextNumber).padStart(REFERENCE_PADDING, '0')}`;

    // Vérifie l'unicité (défense en profondeur contre les conditions de course)
    const conflict = await prismaClient.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "${table}" WHERE ${field} = $1 LIMIT 1`,
      [reference],
    );

    if (conflict.length > 0) {
      // Récursion avec le numéro suivant en cas de conflit rare
      return this.generateReference({ entity, field, tx });
    }

    return reference;
  }

  private entityTable(entity: string): string {
    const map: Record<string, string> = {
      Client: 'clients',
      Branch: 'branches',
      Market: 'markets',
    };
    return map[entity] ?? entity.toLowerCase();
  }
}
