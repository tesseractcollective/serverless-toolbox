import { nanoid, customAlphabet } from "nanoid";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

import {
  ObjectStore,
  HttpError,
  PasswordAuth,
  PasswordHash,
  log,
  ExpiringObjectStore,
} from "../index";

export interface User {
  id: string;
  email: string;
  role: string;
  mobile?: string;
  emailVerified: boolean;
  mobileVerified: boolean;
  [key: string]: any;
}
export interface JwtData {
  sub: string;
  iat: number;
  [key: string]: any;
}
export interface TicketBox {
  ticket: string;
}
export interface UserIdBox {
  userId: string;
}
export type JwtConfiguration = (user: User) => JwtData;

const nanoidTextCodeCreator = customAlphabet("0123456789", 6);

export default class JwtAuth {
  private readonly passwordAuth = new PasswordAuth();
  private readonly passwordStore: ObjectStore<PasswordHash>;
  private readonly expiringTicketStore: ExpiringObjectStore<TicketBox>;
  private readonly cacheMapStore: ObjectStore<UserIdBox>;
  private readonly userStore: ObjectStore<User>;
  private readonly jwtConfiguration: JwtConfiguration;
  private readonly minPasswordLength: number;

  readonly jwtTimeToLive: number;
  readonly jwtSecret: string;
  readonly emailOrPasswordError = new HttpError(
    400,
    "incorrect email or password"
  );

  constructor(
    passwordStore: ObjectStore<PasswordHash>,
    expiringTicketStore: ExpiringObjectStore<TicketBox>,
    cacheMapStore: ObjectStore<UserIdBox>,
    userStore: ObjectStore<User>,
    jwtSecret: string,
    jwtConfiguration: JwtConfiguration,
    minPasswordLength: number = 10
  ) {
    this.passwordStore = passwordStore;
    this.expiringTicketStore = expiringTicketStore;
    this.cacheMapStore = cacheMapStore;
    this.userStore = userStore;
    this.jwtTimeToLive = -1;
    this.jwtSecret = jwtSecret;
    this.jwtConfiguration = jwtConfiguration;
    this.minPasswordLength = minPasswordLength;
  }

  /**
   * Create a new user.
   * @param email User account email.
   * @param password Account password.
   * @param role User role.
   */
  async createUser(
    email: string,
    password: string,
    role: string
  ): Promise<{ user: User; token: string }> {
    try {
      let userId = await this.getUserIdForEmail(email);
      if (userId) {
        return Promise.reject(new HttpError(409, "user already exists"));
      }
      if (password.length < this.minPasswordLength) {
        return Promise.reject(
          new HttpError(
            400,
            `password must be ${this.minPasswordLength} characters or longer`
          )
        );
      }

      userId = uuidv4();
      const user: User = {
        id: userId,
        email,
        role,
        emailVerified: false,
        mobileVerified: false,
      };
      const hash = await this.passwordAuth.createHash(password);

      await Promise.all([
        this.userStore.put(userId, user),
        this.cacheMapStore.put(email, { userId: userId }),
        this.passwordStore.put(userId, hash),
      ]);

      const token = this.createJwt(user);
      return { user, token };
    } catch (error) {
      return Promise.reject(new HttpError(400, error.message));
    }
  }

  /**
   * Put a user.
   * @param user User to put.
   * @param passwordHash PasswordHash associated with user to put.
   * @returns User
   */
  async putUser(user: User, passwordHash?: PasswordHash): Promise<User> {
    if (passwordHash) {
      await this.passwordStore.put(user.id, passwordHash);
    }
    await Promise.all([
      this.userStore.put(user.id, user),
      this.cacheMapStore.put(user.email, { userId: user.id }),
    ]);
    return user;
  }

  /**
   * Gets user.
   * @param id User id.
   */
  async getUser(id: string): Promise<User | undefined> {
    return this.userStore.get(id);
  }

  /**
   * Gets user.
   * @param email User account email.
   */
  async getUserWithEmail(email: string): Promise<User> {
    try {
      const userId = await this.getUserIdForEmail(email);
      if (userId) {
        const user = await this.getUser(userId);
        if (user) {
          return user;
        }
      }
      return Promise.reject(new HttpError(404, "can't find user"));
    } catch (error) {
      return Promise.reject(new HttpError(400, error.message));
    }
  }

  /**
   * Gets user if password is correct.
   * @param email User account email.
   * @param password Account password.
   */
  async getUserWithEmailPassword(
    email: string,
    password: string
  ): Promise<User> {
    try {
      const user = await this.getUserWithEmail(email);
      if (user) {
        const passwordHash = await this.passwordStore.get(user.id);
        if (passwordHash) {
          const isValid = await this.passwordAuth.verifyHash(
            passwordHash,
            password
          );
          if (isValid) {
            return user;
          }
        }
      }
    } catch (error) {
      return Promise.reject(new HttpError(400, error.message));
    }
    return Promise.reject(this.emailOrPasswordError);
  }

  /**
   * Gets the PasswordHash for user
   * @param id id of user
   */
  async getUserPasswordHash(id: string): Promise<PasswordHash | undefined> {
    return this.passwordStore.get(id);
  }

  /**
   * Delete user account & account password records.
   * @param userId User id.
   */
  async deleteUser(userId: string): Promise<string> {
    try {
      const promises = [
        this.userStore.delete(userId),
        this.passwordStore.delete(userId),
      ];
      const user = await this.userStore.get(userId);
      if (user) {
        promises.push(this.cacheMapStore.delete(user.email));
      }
      await Promise.all(promises);

      return userId;
    } catch (error) {
      return Promise.reject(new HttpError(400, error.message));
    }
  }

  /**
   * Add a new password reset ticket, replacing any old ones, refreshing expiration date.
   * @param email User account email.
   */
  async addPasswordResetTicket(
    email: string,
    timeToLiveSeconds: number
  ): Promise<string> {
    try {
      const userId = await this.getUserIdForEmail(email);
      if (userId) {
        const ticketId = `${userId}/passwordReset`;
        const ticket = nanoid();
        await this.expiringTicketStore.put(
          ticketId,
          { ticket },
          timeToLiveSeconds
        );
        return ticket;
      }
    } catch (error) {
      log.error(error);
    }
    return Promise.reject(
      new HttpError(400, "Error creating password reset ticket")
    );
  }

  /**
   * Updates password if ticket is correct.
   * @param email User account email.
   * @param password Account password.
   * @param ticket Password change ticket.
   */
  async updatePassword(
    email: string,
    password: string,
    ticket: string
  ): Promise<void> {
    try {
      const userId = await this.getUserIdForEmail(email);
      if (!userId) {
        return Promise.reject(new HttpError(404, "email does not exist"));
      }
      const ticketId = `${userId}/passwordReset`;
      const ticketVerified = await this.verifyTicket(ticketId, ticket);
      if (ticketVerified) {
        if (password.length < this.minPasswordLength) {
          return Promise.reject(
            new HttpError(
              400,
              `password must be ${this.minPasswordLength} characters or longer`
            )
          );
        }
        await this.expiringTicketStore.delete(ticketId);
        const hash = await this.passwordAuth.createHash(password);
        await this.passwordStore.put(userId, hash);
        return;
      }
    } catch (error) {
      return Promise.reject(new HttpError(400, error.message));
    }
    return Promise.reject(
      new HttpError(
        400,
        "Your password reset ticket has expired. Please start the password reset process again."
      )
    );
  }

  /**
   * Add a new email verification ticket, replacing any old ones, refreshing the expiration date.
   * @param email User account email.
   */
  async addEmailVerifyTicket(
    email: string,
    timeToLiveSeconds: number
  ): Promise<string> {
    try {
      const userId = await this.getUserIdForEmail(email);
      if (userId) {
        const ticketId = `${userId}/${email}`;
        const ticket = nanoid();
        await this.expiringTicketStore.put(
          ticketId,
          { ticket },
          timeToLiveSeconds
        );
        return ticket;
      }
    } catch (error) {
      log.error(error);
    }

    return Promise.reject(
      new HttpError(400, "Error creating email verification ticket")
    );
  }

  /**
   * Verify email address with a ticket.
   * @param email User account email.
   * @param ticket Email verification ticket value.
   */
  async verifyEmail(email: string, ticket: string): Promise<User> {
    try {
      const userId = await this.getUserIdForEmail(email);
      if (userId) {
        const ticketId = `${userId}/${email}`;
        const verified = await this.verifyTicket(ticketId, ticket);
        if (verified) {
          const user = await this.userStore.get(userId);
          if (user) {
            user.emailVerified = true;
            await this.userStore.put(userId, user);
            return user;
          }
        } else {
          return Promise.reject(
            new HttpError(
              400,
              "Ticket has expired, please initiate the email verification process again."
            )
          );
        }
      }
    } catch (error) {
      return Promise.reject(
        new HttpError(400, `Error verifying email ${email}. Please try again.`)
      );
    }
    return Promise.reject(
      new HttpError(
        400,
        "Unable to verify email. Either the user account does not exist or the email has already been verified."
      )
    );
  }

  /**
   * Add a new mobile ticket, replacing any old ones, refreshing expiration date.
   * @param email User account email.
   * @param mobile User account mobile number.
   */
  async addMobile(
    userId: string,
    mobile: string,
    timeToLiveSeconds: number
  ): Promise<string> {
    try {
      const user = await this.userStore.get(userId);
      if (user) {
        if (user.mobile === mobile && user.mobileVerified) {
          return Promise.reject(new HttpError(400, "mobile already verified"));
        }
        const ticketId = `${userId}/${mobile}`;
        const ticket = nanoidTextCodeCreator();
        await this.expiringTicketStore.put(
          ticketId,
          { ticket },
          timeToLiveSeconds
        );
        const newUser = {
          ...user,
          mobile,
          mobileVerified: false,
        };
        await this.userStore.put(userId, newUser);
        return ticket;
      }
    } catch (error) {
      log.error(error);
    }
    return Promise.reject(
      new HttpError(400, "Error creating mobile verify ticket")
    );
  }

  /**
   * Verify mobile number with a ticket.
   * @param userId User id.
   * @param ticket Mobile verification ticket value.
   */
  async verifyMobile(userId: string, ticket: string): Promise<User> {
    try {
      const user = await this.userStore.get(userId);
      if (user) {
        const ticketId = `${userId}/${user.mobile}`;
        const verified = await this.verifyTicket(ticketId, ticket);
        if (verified) {
          user.mobileVerified = true;
          await this.userStore.put(userId, user);
          return user;
        } else {
          return Promise.reject(
            new HttpError(
              400,
              "Ticket has expired, please initiate the mobile verification process again."
            )
          );
        }
      }
    } catch (error) {
      log.error(error);
      return Promise.reject(
        new HttpError(400, `Error verifying mobile. Please try again.`)
      );
    }
    return Promise.reject(
      new HttpError(
        400,
        "Unable to verify mobile number. Either the user account does not exist or the mobile number has already been verified."
      )
    );
  }

  /**
   * Gets user if jwt is correct.
   * @param token JWT.
   */
  async getUserWithJwt(token: string): Promise<User | undefined> {
    const decoded = this.verifyJwt(token);
    return this.getUser(decoded.sub);
  }

  /**
   * Creates JWT for user.
   * @param user User.
   */
  createJwt(user: User): string {
    const jwtData = this.jwtConfiguration(user);
    const options =
      this.jwtTimeToLive > 0 ? { expiresIn: this.jwtTimeToLive } : undefined;
    return jwt.sign(jwtData, this.jwtSecret, options);
  }

  /**
   * Creates JWT for user if password is correct.
   * @param email User account email.
   * @param password Account password.
   */
  async createJwtWithEmailPassword(
    email: string,
    password: string
  ): Promise<string> {
    try {
      const user = await this.getUserWithEmailPassword(email, password);
      if (user) {
        return this.createJwt(user);
      }
    } catch (error) {
      log.error(error);
    }
    return Promise.reject(this.emailOrPasswordError);
  }

  private async verifyTicket(id: string, ticket: string): Promise<boolean> {
    const cachedTicket = await this.expiringTicketStore.get(id);
    if (cachedTicket?.ticket === ticket) {
      return true;
    }
    return false;
  }

  private verifyJwt(token: string): any {
    const decoded = jwt.verify(token, this.jwtSecret);
    return decoded;
  }

  private async getUserIdForEmail(email: string): Promise<string | undefined> {
    this.validateEmailFormat(email);
    return this.cacheMapStore.get(email).then((box) => box?.userId);
  }

  private validateEmailFormat(email: string) {
    // HTML Standard: https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email)) {
      throw new Error("invalid email");
    }
  }
}
