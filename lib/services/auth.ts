import { config } from '../config';

export type LoginCredentials = {
  username: string;
  password: string;
};

export type LoginResult = {
  success: boolean;
  user?: {
    username: string;
  };
};

class AuthService {
  private readonly enabled: boolean;

  private readonly credentialMap: Map<string, string>;

  constructor() {
    this.enabled = config.auth.enabled;
    this.credentialMap = new Map(
      config.auth.mockUsers.map(({ username, password }) => [username, password])
    );
  }

  async login({ username, password }: LoginCredentials): Promise<LoginResult> {
    if (!username || !password) {
      return { success: false };
    }

    if (!this.enabled) {
      return { success: true, user: { username } };
    }

    const expectedPassword = this.credentialMap.get(username);

    if (!expectedPassword) {
      return { success: false };
    }

    if (expectedPassword !== password) {
      return { success: false };
    }

    return {
      success: true,
      user: { username },
    };
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const authService = new AuthService();
