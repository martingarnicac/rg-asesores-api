import { Field, ID, ObjectType, registerEnumType, HideField } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TokenType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_CHANGE = 'EMAIL_CHANGE',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  SESSION = 'SESSION',
}

registerEnumType(TokenType, { name: 'TokenType' });

@ObjectType()
@Entity('auth_tokens')
export class AuthToken {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @HideField()
  @Column({ type: 'uuid', nullable: false, name: 'user_id' })
  userId: string;

  @HideField()
  @Column({ type: 'varchar', length: 255, nullable: false, name: 'token_hash' })
  tokenHash: string;

  @HideField()
  @Column({ type: 'varchar', length: 16, nullable: false, name: 'token_prefix' })
  tokenPrefix: string;

  @Field(() => TokenType)
  @Column({
    type: 'enum',
    enum: TokenType,
    nullable: false,
  })
  type: TokenType;

  @Field()
  @Column({ type: 'timestamptz', nullable: false, name: 'expires_at' })
  expiresAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
  revokedAt: Date | null;

  @HideField()
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Field()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.authTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
