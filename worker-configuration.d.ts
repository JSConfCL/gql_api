// Generated by Wrangler on Fri Jul 07 2023 08:10:34 GMT-0700 (Pacific Daylight Time)
import type WorkerEntrypoint from "./workers/transactional_email_service";
export interface Env {
  GRAPHQL_BASE_ENDPOINT: "/";
  NEON_URL: string | undefined;
  SUPABASE_JWT_DECODER: string | undefined;
  STRIPE_KEY: string | undefined;
  MERCADOPAGO_KEY: string;
  ENFORCED_JWT_TOKEN: string | undefined;
  MAIL_QUEUE: Queue;
  SANITY_PROJECT_ID: string | undefined;
  SANITY_DATASET: string | undefined;
  SANITY_API_VERSION: string | undefined;
  SANITY_SECRET_TOKEN: string | undefined;
  GOOGLE_PHOTOS_IMPORT_QUEUE: Queue;
  RESEND_API_KEY: string;
  HIGHLIGHT_PROJECT_ID: string;
  HYPERDRIVE: Hyperdrive;
  PURCHASE_CALLBACK_URL: string;
  RPC_SERVICE_EMAIL: Service<WorkerEntrypoint>;
}

declare global {
  // Declare types for replace variables
  const _APP_ENV: "development" | "production" | "staging";
  const HONEYCOMB_TOKEN: string | undefined;
}

export {};
