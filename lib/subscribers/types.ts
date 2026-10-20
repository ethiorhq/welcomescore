export type SubscriberSource =
  | "welcomescore_app"
  | "welcomescore_banner"
  | "welcomescore_modal"
  | "welcomescore_report"
  | "welcomescore_how_it_works"
  | string;

export interface SubscriberSubmission {
  email: string;
  source?: SubscriberSource;
  hp?: string; // honeypot for spam bots
}

export interface StoredSubscriber {
  id: string;
  email: string;
  source: string;
  createdAt: string;
}

export type SubscriberResult =
  | { success: true; message: string; isExisting?: boolean; id?: string }
  | { success: false; error: string; code: string; retryAfterSeconds?: number };
