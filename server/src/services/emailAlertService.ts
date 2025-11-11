import axios from 'axios';
import config from '../config';
import { MEVAttack } from '../types';

type AlertPreferences = {
  sandwich: boolean;
  frontrun: boolean;
  backrun: boolean;
  highGas: boolean;
  highSlippage: boolean;
};

type Subscriber = {
  email: string;
  alerts: AlertPreferences;
  subscribedAt: string;
};

type TestAttack = {
  type: string;
  riskScore: number;
  slippageLoss: number;
  timestamp: string;
};

const subscribers = new Map<string, Subscriber>();

const defaultAlerts = (): AlertPreferences => ({
  sandwich: true,
  frontrun: true,
  backrun: true,
  highGas: true,
  highSlippage: true,
});

const getAlertSummary = (alerts: AlertPreferences): string => {
  const enabled = Object.entries(alerts)
    .filter((entry) => entry[1])
    .map((entry) => entry[0].replace(/([A-Z])/g, ' $1').trim());
  return enabled.length ? enabled.join(', ') : 'No alerts selected';
};

const numericFromString = (value?: string): number => {
  if (!value) return 0;
  const match = value.match(/[-+]?\d*\.?\d+/);
  return match ? parseFloat(match[0]) : 0;
};

const sendEmail = async (templateId: string, templateParams: Record<string, any>): Promise<boolean> => {
  const emailConfig = config.email;
  if (!emailConfig?.serviceId || !emailConfig.publicKey || !emailConfig.privateKey || !templateId || !emailConfig.apiUrl) {
    return false;
  }
  try {
    await axios.post(emailConfig.apiUrl, {
      service_id: emailConfig.serviceId,
      template_id: templateId,
      user_id: emailConfig.publicKey,
      accessToken: emailConfig.privateKey,
      template_params: templateParams,
    });
    return true;
  } catch (error) {
    console.error('Email alert send failed', (error as any)?.message || error);
    return false;
  }
};

const subscribe = async (email: string, alerts: Partial<AlertPreferences>) => {
  const normalizedAlerts = { ...defaultAlerts(), ...alerts } as AlertPreferences;
  const entry: Subscriber = {
    email,
    alerts: normalizedAlerts,
    subscribedAt: new Date().toISOString(),
  };
  subscribers.set(email.toLowerCase(), entry);
  const templateId = config.email?.subscriptionTemplateId;
  if (templateId) {
    await sendEmail(templateId, {
      to_email: email,
      subscriber_email: email,
      alert_types: getAlertSummary(normalizedAlerts),
      message: "You've successfully subscribed to MEV Detector alerts!",
    });
  }
  return entry;
};

const getSubscriber = (email: string): Subscriber | undefined => subscribers.get(email.toLowerCase());

const listSubscribers = (): Subscriber[] => Array.from(subscribers.values());

const sendTestEmail = async (email: string, testAttack?: TestAttack): Promise<boolean> => {
  const templateId = config.email?.alertTemplateId;
  if (!templateId) {
    return false;
  }
  const attack = testAttack || {
    type: 'sandwich',
    riskScore: 75,
    slippageLoss: 50,
    timestamp: new Date().toISOString(),
  };
  return sendEmail(templateId, {
    to_email: email,
    attack_type: attack.type,
    risk_score: `${attack.riskScore}`,
    slippage_loss: `$${attack.slippageLoss.toFixed(2)}`,
    timestamp: attack.timestamp,
    message: 'MEV Detector Alert',
  });
};

const attackerKeyForAttack = (
  attackType: MEVAttack['attackType']
): keyof AlertPreferences | null => {
  if (attackType === 'sandwich') return 'sandwich';
  if (attackType === 'front-run') return 'frontrun';
  if (attackType === 'back-run') return 'backrun';
  return null;
};

const shouldNotify = (subscriber: Subscriber, attack: MEVAttack): boolean => {
  const key = attackerKeyForAttack(attack.attackType);
  if (key && !subscriber.alerts[key]) {
    return false;
  }
  const gasPrice = numericFromString(attack.gasPrice);
  if (gasPrice > 80 && subscriber.alerts.highGas) {
    return true;
  }
  if (attack.slippageLoss > 50 && subscriber.alerts.highSlippage) {
    return true;
  }
  if (key && subscriber.alerts[key]) {
    return true;
  }
  return false;
};

const notifyAttack = async (attack: MEVAttack): Promise<void> => {
  const templateId = config.email?.alertTemplateId;
  if (!templateId) {
    return;
  }
  const recipients = listSubscribers().filter((subscriber) => shouldNotify(subscriber, attack));
  if (recipients.length === 0) {
    return;
  }
  const tasks = recipients.map((subscriber) =>
    sendEmail(templateId, {
      to_email: subscriber.email,
      attack_type: attack.attackType,
      risk_score: `${attack.riskScore}`,
      slippage_loss: `$${attack.slippageLoss.toFixed(2)}`,
      gas_price: attack.gasPrice,
      timestamp: attack.timestamp,
      victim_address: attack.victimAddress || 'Unknown',
      attacker_address: attack.attackerAddress || 'Unknown',
    })
  );
  await Promise.allSettled(tasks);
};

export default {
  subscribe,
  listSubscribers,
  getSubscriber,
  sendTestEmail,
  notifyAttack,
};
