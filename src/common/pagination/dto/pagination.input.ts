import { Field, InputType } from "@nestjs/graphql";
import { IsInt, Min } from "class-validator";

@InputType()
export class PaginationInput {
  @Field(() => Number, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page: number = 1;

  @Field(() => Number, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  itemsPerPage: number = 10;
}