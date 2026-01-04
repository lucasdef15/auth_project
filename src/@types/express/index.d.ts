import { JwtPayload } from "../../auth/JwtPayload.ts";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
