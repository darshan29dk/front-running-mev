import axios from 'axios';
import { MEVAttack } from '../types';

type Platform = 'ios' | 'android' | 'web';

interface TokenMeta {
  platform: Platform;
  address?: string;
  label?: string;
  updatedAt: string;
}

class PushNotificationService {
  private tokens = new Map<string, TokenMeta>();

  registerToken(token: string, meta: { platform: Platform; address?: string; label?: string }): TokenMeta {
    const trimmed = token?.trim();
    if (!trimmed) {
      throw new Error('token is required');
    }
    const stored: TokenMeta = { ...meta, updatedAt: new Date().toISOString() };
    this.tokens.set(trimmed, stored);
    return stored;
  }

  unregisterToken(token: string): boolean {
    return this.tokens.delete(token);
  }

  getToken(token: string): TokenMeta | undefined {
    return this.tokens.get(token);
  }

  getTokenCount(): number {
    return this.tokens.size;
  }

  async sendAttackNotification(attack: MEVAttack): Promise<void> {
    if (this.tokens.size === 0) {
      return;
    }
    const payloads = Array.from(this.tokens.entries()).map(([token, meta]) => ({
      to: token,
      title: 'MEV Alert',
      body: `${attack.attackType.toUpperCase()} risk score ${attack.riskScore.toFixed(1)}`,
      data: { attack },
      channelId: meta.platform === 'android' ? 'default' : undefined,
    }));
    try {
      await axios.post('https://exp.host/--/api/v2/push/send', payloads, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Failed to dispatch Expo push notifications', error);
    }
  }
}

export default new PushNotificationService();
