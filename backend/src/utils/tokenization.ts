import crypto from 'crypto';

export function generateCardToken(){
    return "card_tok_" + crypto.randomBytes(16).toString("hex");
}