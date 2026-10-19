import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { AuthenticatedPrincipal } from './auth.types';

@Controller('me')
@UseGuards(AuthGuard)
export class ProfileController {
  @Get()
  getProfile(@CurrentUser() user: AuthenticatedPrincipal) {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      branches: user.branches,
    };
  }

  @Get('branches')
  getBranches(@CurrentUser() user: AuthenticatedPrincipal) {
    return user.branches;
  }
}