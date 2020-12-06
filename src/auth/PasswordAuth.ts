import bcrypt from "bcryptjs";

export interface PasswordHash {
  hash: string;
  salt: string;
}

export default class PasswordAuth {
  async createHash(password: string): Promise<PasswordHash> {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);
    return {
      salt,
      hash,
    };
  }

  async verifyHash(
    passwordHash: PasswordHash,
    password: string
  ): Promise<boolean> {
    const hash = await bcrypt.hash(password, passwordHash.salt);
    return hash === passwordHash.hash;
  }
}
