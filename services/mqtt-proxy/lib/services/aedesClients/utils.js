import crypto from 'crypto';

export function createHash(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
}
