import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";

export interface JwtPayload {
  sub: string;
  scopes: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "your-secret-key",
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.scopes) {
      throw new UnauthorizedException("Invalid token structure");
    }

    return {
      userId: payload.sub,
      scopes: payload.scopes,
    };
  }
}
