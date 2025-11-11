import WebSocket from 'ws';
import axios from 'axios';
import EventEmitter from 'events';
import config from '../config';
import { BackrunOpportunity, MevShareBundle } from '../types';

export interface MevShareSubscribeParams {
  filters?: Record<string, unknown>;
}

interface MevShareBundleMessage {
  id: string;
  bundleHash: string;
  transactions?: string[];
  metadata?: Record<string, any>;
  target?: string;
  builder?: string;
  mevGasPrice?: string;
  createdAt?: string;
}

class MevShareService extends EventEmitter {
  private ws?: WebSocket;
  private reconnectTimer?: NodeJS.Timeout;
  private readonly reconnectDelay = 5000;
  private currentParams?: MevShareSubscribeParams;

  start(params?: MevShareSubscribeParams): void {
    this.currentParams = params;
    this.openConnection();
  }

  stop(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = undefined;
    }
  }

  async fetchBundle(bundleId: string): Promise<MevShareBundle | null> {
    const endpoint = config.mevShare?.endpoint;
    if (!endpoint) {
      console.warn('MEV-Share REST endpoint not configured');
      return null;
    }
    try {
      const url = `${endpoint}/bundles/${bundleId}`;
      const response = await axios.get(url, {
        headers: config.mevShare?.apiKey ? { 'x-api-key': config.mevShare.apiKey } : undefined,
        timeout: 10000,
      });
      return this.mapBundle(response.data as MevShareBundleMessage);
    } catch (error) {
      console.error('Failed to fetch MEV-Share bundle', error);
      return null;
    }
  }

  private openConnection(): void {
    this.stop();

    const wsUrl = config.mevShare?.wsUrl;
    if (!wsUrl) {
      console.warn('MEV-Share WS URL not configured');
      return;
    }

    const url = this.currentParams?.filters
      ? `${wsUrl}?filters=${encodeURIComponent(JSON.stringify(this.currentParams.filters))}`
      : wsUrl;
    this.ws = new WebSocket(url, {
      headers: config.mevShare?.apiKey ? { 'x-api-key': config.mevShare.apiKey } : undefined,
    });

    this.ws.on('open', () => {
      console.log('Connected to Flashbots MEV-Share');
      this.emit('connected');
    });

    this.ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString()) as MevShareBundleMessage;
        const bundle = this.mapBundle(parsed);
        const opportunity = this.analyzeBundle(bundle);
        if (opportunity) {
          this.emit('opportunity', opportunity);
        }
        this.emit('bundle', bundle);
      } catch (error) {
        console.error('Failed to parse MEV-Share message', error);
        this.emit('error', error);
      }
    });

    this.ws.on('close', () => {
      console.warn('MEV-Share connection closed, attempting reconnect');
      this.emit('disconnected');
      this.scheduleReconnect();
    });

    this.ws.on('error', (error) => {
      console.error('MEV-Share WebSocket error', error);
      this.emit('error', error);
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.openConnection();
    }, this.reconnectDelay);
  }

  private mapBundle(message: MevShareBundleMessage): MevShareBundle {
    return {
      id: message.id,
      bundleHash: message.bundleHash,
      transactions: message.transactions || [],
      timestamp: message.createdAt || new Date().toISOString(),
      builder: message.builder,
      target: message.target,
      metadata: message.metadata,
    };
  }

  private analyzeBundle(bundle: MevShareBundle): BackrunOpportunity | null {
    if (!bundle.metadata) {
      return null;
    }

    const hints = bundle.metadata?.hints as Record<string, any> | undefined;
    const profitUsd = hints?.expected_profit_usd ? Number(hints.expected_profit_usd) : undefined;
    const targetTx = hints?.target_tx_hash as string | undefined;
    const confidence = hints?.confidence ? Number(hints.confidence) : profitUsd ? 0.6 : 0.3;

    if (!targetTx && !profitUsd) {
      return null;
    }

    return {
      bundleHash: bundle.bundleHash,
      targetTxHash: targetTx,
      expectedProfitUsd: profitUsd,
      confidence,
      bundle,
      analysis: this.describeOpportunity(bundle, profitUsd, confidence),
      createdAt: new Date().toISOString(),
    };
  }

  private describeOpportunity(bundle: MevShareBundle, profitUsd?: number, confidence?: number): string {
    const segments: string[] = [];
    segments.push(`Bundle ${bundle.bundleHash.slice(0, 10)} offers potential backrun`);
    if (profitUsd) {
      segments.push(`Estimated profit ${profitUsd.toFixed(2)} USD`);
    }
    if (confidence) {
      segments.push(`Confidence ${(confidence * 100).toFixed(0)}%`);
    }
    if (bundle.target) {
      segments.push(`Target ${bundle.target}`);
    }
    return segments.join(' | ');
  }
}

export default new MevShareService();
