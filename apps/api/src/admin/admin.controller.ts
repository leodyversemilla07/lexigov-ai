import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { RequireRoles, RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('users')
  @RequireRoles('ADMIN')
  @ApiOperation({ summary: 'List admin users with pagination and search' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  listUsers(@Query() query: ListAdminUsersQueryDto) {
    return this.adminService.listUsers({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
  }

  @Get('users/:id')
  @RequireRoles('ADMIN')
  @ApiOperation({ summary: 'Get an admin user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id/role')
  @RequireRoles('ADMIN')
  @ApiOperation({ summary: 'Update a user role' })
  @ApiResponse({ status: 200, description: 'User role updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(id, dto.role);
  }

  @Delete('users/:id')
  @RequireRoles('ADMIN')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  removeUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}
