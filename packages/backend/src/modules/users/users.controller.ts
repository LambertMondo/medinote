import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Request() req: any) {
    const user = await this.usersService.findById(req.user.sub);
    const { passwordHash, totpSecret, ...result } = user;
    return result;
  }
}
