import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

import { User } from '@/users/entities';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  password: string;
}

@InputType()
export class RequestPasswordResetInput {
  @Field()
  @IsEmail()
  email: string;
}

@InputType()
export class ResetPasswordInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  token: string;

  @Field()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

@InputType()
export class RequestEmailChangeInput {
  @Field()
  @IsEmail()
  newEmail: string;
}

@InputType()
export class ConfirmEmailChangeInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  token: string;
}

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @Field()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

@InputType()
export class VerifyEmailInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  token: string;
}

@ObjectType()
export class AuthPayload {
  @Field()
  token: string;

  @Field(() => User)
  user: User;
}
