import crypto from "crypto";

export interface PasswordHash {
  base64: string;
  salt: string;
  iterations: number;
}

export default class PasswordAuth {
  private readonly hashLength = 256;
  private readonly digest = "sha256";
  private readonly saltLength = 64;
  private readonly iterations = 10000;

  async createHash(password: string): Promise<PasswordHash> {
    return new Promise<PasswordHash>((resolve, reject) => {
      const salt = crypto.randomBytes(this.saltLength).toString("base64");
      crypto.pbkdf2(
        password,
        salt,
        this.iterations,
        this.hashLength,
        this.digest,
        (error, hash) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              salt,
              iterations: this.iterations,
              base64: hash.toString("base64"),
            });
          }
        }
      );
    });
  }

  async verifyHash(hash: PasswordHash, password: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      crypto.pbkdf2(
        password,
        hash.salt,
        hash.iterations,
        this.hashLength,
        this.digest,
        (error, hashBuffer) => {
          if (error) {
            reject(error);
          } else {
            resolve(hash.base64 === hashBuffer.toString("base64"));
          }
        }
      );
    });
  }
}
