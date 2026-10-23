import { type UserRole, userRoleValues } from '@lexigov/shared';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsIn(userRoleValues as unknown as string[])
  role!: UserRole;
}
