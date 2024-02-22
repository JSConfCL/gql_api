interface BusinessInfo {
  unit: string;
  branch?: string | null;
  sub_unit: string;
}

interface TransactionData {
  subscription_id?: string;
  user_present?: boolean | null;
  invoice_period?: { period: number; type: string };
  subscription_sequence?: { number: number; total: number | null };
  first_time_use?: boolean;
  invoice_id?: string;
  billing_date?: string;
  payment_reference?: string | null;
  processor?: string | null;
  plan_id?: string;
}

interface PointOfInteraction {
  business_info: BusinessInfo;
  transaction_data?: TransactionData;
  type: string;
  application_data?: { name: string; version: string };
}

interface Identification {
  number: string | null;
  type: string | null;
}

interface Phone {
  number: string | null;
  extension: string | null;
  area_code: string | null;
}

interface Payer {
  entity_type: string | null;
  identification: Identification;
  phone: Phone;
  operator_id: string | null;
  last_name: string | null;
  id: string;
  type: string | null;
  first_name: string | null;
  email: string | null;
}

interface TransactionDetails {
  transaction_id?: string;
  total_paid_amount: number;
  acquirer_reference: string | null;
  installment_amount: number;
  financial_institution: string | null;
  bank_transfer_id?: string | number;
  net_received_amount: number;
  overpaid_amount: number;
  external_resource_url: string | null;
  payable_deferral_period: string | null;
  payment_method_reference_id: string | null;
}

type RefundCharges = unknown;
type ChargeDetailsMetadata = unknown;

interface ChargesDetails {
  refund_charges: RefundCharges[];
  last_updated: string;
  metadata: ChargeDetailsMetadata;
  amounts: { original: number; refunded: number };
  date_created: string;
  name: string;
  reserve_id: string | null;
  accounts: { from: string; to: string };
  id: string;
  type: string;
  client_id: number;
}

interface Cardholder {
  identification: Identification;
  name: string;
}

interface Card {
  first_six_digits?: string;
  expiration_year?: number;
  bin?: string;
  date_created?: string;
  expiration_month?: number;
  id?: string | null;
  cardholder?: Cardholder;
  last_four_digits?: string;
  date_last_updated?: string;
}

interface Gateway {
  buyer_fee: number;
  finance_charge: number;
  date_created: string;
  merchant: string;
  reference: string | null;
  statement_descriptor: string | null;
  issuer_id: string;
  usn: string | null;
  installments: number;
  soft_descriptor: string;
  authorization_code: string | null;
  payment_id: number;
  profile_id: string;
  options: string;
  connection: string;
  id: string;
  operation: string;
}

type ResultItemMetadata =
  | {
      payment_id?: string;
      preapproval_id?: string;
    }
  | Record<string, never>;
type ResultItemOrder = {
  id?: string;
  type?: string;
};

export interface ResultItem {
  metadata: ResultItemMetadata;
  corporation_id: string | null;
  operation_type: string;
  point_of_interaction: PointOfInteraction;
  fee_details: { amount: number; fee_payer: string; type: string }[];
  notification_url: string | null;
  date_approved: string | null;
  money_release_schema: string | null;
  payer: Payer;
  transaction_details: TransactionDetails;
  statement_descriptor: string | null;
  call_for_authorize_id: string | null;
  installments: number;
  pos_id: string | null;
  external_reference: string | null;
  date_of_expiration: string | null;
  charges_details: ChargesDetails[];
  id: number;
  payment_type_id: string;
  payment_method: {
    issuer_id?: string;
    data?: { routing_data?: { merchant_account_id: string } };
    id: string;
    type: string;
  };
  order: ResultItemOrder;
  counter_currency: string | null;
  money_release_status: string | null;
  brand_id: string | null;
  status_detail: string;
  tags?: string | null;
  differential_pricing_id: string | null;
  additional_info: {
    authentication_code: string | null;
    ip_address?: string;
    nsu_processadora: string | null;
    available_balance: string | null;
    items?: {
      quantity: string;
      category_id: string | null;
      picture_url: string | null;
      description: string | null;
      id: string | null;
      title: string;
      unit_price: string;
    }[];
  };
  live_mode: boolean;
  marketplace_owner: number | null;
  card: Card;
  integrator_id: string | null;
  status: string;
  accounts_info?: string | null;
  transaction_amount_refunded: number;
  transaction_amount: number;
  description: string;
  financing_group: string | null;
  money_release_date: string | null;
  merchant_number: string | null;
  refunds: unknown[]; // You can add a specific type for refunds if needed
  callback_url?: string | null;
  expanded: { gateway: Gateway | null }; // You can add a specific type for expanded.gateway if needed
  authorization_code: string | null;
  captured: boolean;
  collector_id: number;
  merchant_account_id: string | null;
  taxes_amount: number;
  date_last_updated: string;
  coupon_amount: number;
  store_id: string | null;
  build_version: string;
  date_created: string;
  sponsor_id: string | null;
  shipping_amount: number;
  issuer_id: string;
  payment_method_id: string;
  binary_mode: boolean;
  platform_id: string | null;
  deduction_schema: string | null;
  processing_mode: string;
  currency_id: string;
  shipping_cost: number;
}

export type Pagination = {
  total: number;
  limit: number;
  offset: number;
};

export type SearchResponse = {
  results?: ResultItem[];
  paging: Pagination;
};
