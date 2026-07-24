import { BaseRepository } from './base.repository';
import { IDatabaseClient } from '../types/database.types';

export interface WorkspaceEntity {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export class WorkspaceRepository extends BaseRepository<WorkspaceEntity> {
  constructor(db: IDatabaseClient) {
    super(db, 'workspaces');
  }

  public async findByOwnerId(ownerId: string): Promise<WorkspaceEntity[]> {
    const query = `SELECT * FROM ${this.tableName} WHERE owner_id = $1`;
    const result = await this.db.query<WorkspaceEntity>(query, [ownerId]);
    return result.rows;
  }

  public async create(entity: Partial<WorkspaceEntity>): Promise<WorkspaceEntity> {
    const query = `
      INSERT INTO ${this.tableName} (name, owner_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const params = [entity.name || 'Default Workspace', entity.ownerId || ''];
    const result = await this.db.query<WorkspaceEntity>(query, params);
    return (
      result.rows[0] || {
        id: 'placeholder-workspace-id',
        name: entity.name || 'Default Workspace',
        ownerId: entity.ownerId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  }

  public async update(id: string, entity: Partial<WorkspaceEntity>): Promise<WorkspaceEntity | null> {
    const query = `UPDATE ${this.tableName} SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    const result = await this.db.query<WorkspaceEntity>(query, [entity.name, id]);
    return result.rows[0] || null;
  }
}
