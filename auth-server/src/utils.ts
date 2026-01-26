import { createHash } from "crypto";

export function hashToken(token: string) {
    return createHash('sha256').update(token).digest('base64url');
}
