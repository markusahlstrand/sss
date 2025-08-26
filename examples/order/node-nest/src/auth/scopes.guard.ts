import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.get<string[]>(
      "scopes",
      context.getHandler()
    );

    if (!requiredScopes) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.scopes) {
      throw new ForbiddenException("No scopes found in token");
    }

    const hasScope = requiredScopes.some((scope) =>
      user.scopes.includes(scope)
    );

    if (!hasScope) {
      throw new ForbiddenException(
        `Required scopes: ${requiredScopes.join(", ")}`
      );
    }

    return true;
  }
}
