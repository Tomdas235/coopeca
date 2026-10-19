import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthService } from './auth.service';

const credentialsSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(256),
}).strict();

@Controller('auth/sessions')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  create(@Body() body: unknown) {
    const result = credentialsSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException('Identifiant et mot de passe requis.');
    }
    return this.authService.createSession(result.data.username, result.data.password);
  }
}