import { User as UserSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends UserSchema {}
  }
}

export {};
