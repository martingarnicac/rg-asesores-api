import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

import { Availability } from '@/common/availability/entities';
import { AuthToken } from '@/auth/entities';

export enum UserRole {
  ADMIN = 'ADMIN',
  EJECUTIVO = 'EJECUTIVO',
  OPERADOR = 'OPERADOR',
  VIEWER = 'VIEWER',
}

registerEnumType(UserRole, { name: 'UserRole' });

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  identifier: string;

  @Field()
  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false, name: 'password_hash' })
  passwordHash: string;

  @Field()
  @Column({ type: 'varchar', length: 150, nullable: false })
  name: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 150, nullable: true, name: 'last_name' })
  lastname: string | null;

  @Field(() => UserRole)
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EJECUTIVO,
    nullable: false,
  })
  role: UserRole;

  @Field()
  @Column({ type: 'boolean', default: false, nullable: false, name: 'email_verified' })
  emailVerified: boolean;

  @Field(() => Availability)
  @Column({ type: 'enum', enum: Availability, default: Availability.DRAFT, nullable: false })
  availability: Availability;

  @Field()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => AuthToken, (token) => token.user)
  authTokens: AuthToken[];
}
