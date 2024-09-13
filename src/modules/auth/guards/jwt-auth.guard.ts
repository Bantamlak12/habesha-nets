import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers['authorization'];

    if (!authorizationHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authorizationHeader.split(' ')[1];

    try {
      const decoded = await this.jwtService.verifyAsync(token);
      request.user = decoded;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // If the user is not verified, restrict access to specific routes
    if (!request.user.isVerified && !this.isVerificationRoute(request)) {
      throw new UnauthorizedException('User is not verified yet');
    }

    return true;
  }

  private isVerificationRoute(request: any): boolean {
    const path = request.url;
    const verificationEndPoints = ['/send-verification', '/verify'];
    return verificationEndPoints.some((endpoint) => path.includes(endpoint));
  }
}
