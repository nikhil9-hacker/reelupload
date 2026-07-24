import { BaseRepository } from './base.repository';
import { IDatabaseClient } from '../types/database.types';

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  instagramConnected: boolean;
  googleDriveConnected: boolean;
  createdAt: string;
  updatedAt: string;
}

export class UserRepository extends BaseRepository<UserEntity> {
  constructor(db: IDatabaseClient) {
    super(db, 'users');
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE email = $1 LIMIT 1`;
    const result = await this.db.query<UserEntity>(query, [email]);
    return result.rows[0] || null;
  }

  public async create(entity: Partial<UserEntity>): Promise<UserEntity> {
    const query = `
      INSERT INTO ${this.tableName} (email, name, instagram_connected, google_drive_connected)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const params = [
      entity.email || '',
      entity.name || '',
      entity.instagramConnected ?? false,
      entity.googleDriveConnected ?? false,
    ];
    const result = await this.db.query<UserEntity>(query, params);
    return (
      result.rows[0] || {
        id: 'placeholder-user-id',
        email: entity.email || '',
        name: entity.name || '',
        instagramConnected: false,
        googleDriveConnected: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  }

  public async update(id: string, entity: Partial<UserEntity>): Promise<UserEntity | null> {
    const query = `UPDATE ${this.tableName} SET updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await this.db.query<UserEntity>(query, [id]);
    return result.rows[0] || null;
  }
}
