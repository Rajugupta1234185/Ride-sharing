import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as express from 'express';

export interface JwtPayload {
  sub: string;
  role: 'RIDER' | 'DRIVER';
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<express.Request>();
    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      // attach to request, same shape Passport would have given you
      (req as any).user = { userId: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(req: express.Request): string | null {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      return null;
    }
    return header.slice('Bearer '.length).trim();
  }
}