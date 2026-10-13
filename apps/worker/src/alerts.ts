import type { Logger } from 'pino';

export interface Alerter {
  send(message: string): Promise<void>;
}

/** Posts alerts to a generic webhook (Slack/Discord-compatible `{text, content}` body). */
export function createAlerter(webhookUrl: string | undefined, log: Logger): Alerter {
  return {
    async send(message) {
      log.warn({ alert: message }, 'alert');
      if (!webhookUrl) return;
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `[Chouf] ${message}`, content: `[Chouf] ${message}` }),
          signal: AbortSignal.timeout(5000),
        });
      } catch (err) {
        log.error({ err }, 'alert webhook failed');
      }
    },
  };
}
