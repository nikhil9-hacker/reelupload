import { IDatabaseClient } from '../types/database.types';

export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export abstract class BaseRepository<T extends { id: string }> implements IBaseRepository<T> {
  protected readonly db: IDatabaseClient;
  protected readonly tableName: string;

  constructor(db: IDatabaseClient, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  public async findById(id: string): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1 LIMIT 1`;
    const result = await this.db.query<T>(query, [id]);
    return result.rows[0] || null;
  }

  public async findAll(): Promise<T[]> {
    const query = `SELECT * FROM ${this.tableName}`;
    const result = await this.db.query<T>(query);
    return result.rows;
  }

  public abstract create(entity: Partial<T>): Promise<T>;
  public abstract update(id: string, entity: Partial<T>): Promise<T | null>;

  public async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rowCount > 0;
  }
}
