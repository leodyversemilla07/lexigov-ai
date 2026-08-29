import type { SanggunianRole } from '@lexigov/shared';
import { SetMetadata } from '@nestjs/common';

export const SANGGUNIAN_ROLES_KEY = 'sanggunian_roles';

export const RequireSanggunianRoles = (...roles: SanggunianRole[]) => SetMetadata(SANGGUNIAN_ROLES_KEY, roles);
