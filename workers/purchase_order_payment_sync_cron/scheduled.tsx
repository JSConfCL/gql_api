import { getDb } from "~/datasources/db";
import { getMercadoPagoFetch } from "~/datasources/mercadopago";
import { getStripeClient } from "~/datasources/stripe/client";
import { createLogger } from "~/logging";
import {
  clearExpiredPurchaseOrders,
  syncPurchaseOrderPaymentStatus,
} from "~/schema/purchaseOrder/actions";
import { ensureKeys } from "~workers/utils";

type ENV = {
  DB_URL: string;
  STRIPE_KEY: string;
  MERCADOPAGO_KEY: string;
};

// Este cron hace lo siguiente
// 1. Busca todas las purchase orders que no estén pagadas.
// 2. Sincroniza el estado de pago con MercadoPago y Stripe.
// 3. Busca las OC, que no se ha pagado y su tiempo de expiración venció.
// 4. Actualiza el estado de la OC a "expired".
export const scheduled: ExportedHandlerScheduledHandler<ENV> = async (
  event,
  env,
) => {
  ensureKeys(env, ["DB_URL", "STRIPE_KEY", "MERCADOPAGO_KEY"]);
  const logger = createLogger("purchase_order_payment_sync_cron");
  const DB = await getDb({
    neonUrl: env.DB_URL,
    logger,
  });
  const GET_STRIPE_CLIENT = () => getStripeClient(env.STRIPE_KEY);
  const GET_MERCADOPAGO_CLIENT = getMercadoPagoFetch(
    env.MERCADOPAGO_KEY,
    logger,
  );

  // Busca todas las OCs que no estén pagadas.
  logger.info(`Getting upaid purchase orders...`);
  const getUnpaidPurchaseOrders = await DB.query.purchaseOrdersSchema.findMany({
    where: (po, { eq, and, isNotNull }) =>
      and(
        eq(po.purchaseOrderPaymentStatus, "unpaid"),
        isNotNull(po.paymentPlatformReferenceID),
      ),
  });

  logger.info(
    `Obtained ${getUnpaidPurchaseOrders.length} unpaid purchase orders`,
  );

  // Sincroniza el estado de pago de las OCs que no estén pagadas.
  for (const purchaseOrder of getUnpaidPurchaseOrders) {
    logger.info(
      `Syncing purchase order payment status for ${purchaseOrder.id}`,
    );
    await syncPurchaseOrderPaymentStatus({
      purchaseOrderId: purchaseOrder.id,
      DB,
      GET_STRIPE_CLIENT,
      GET_MERCADOPAGO_CLIENT,
      logger,
    });
    logger.info(`Synced purchase order payment status for ${purchaseOrder.id}`);
  }

  const clearedOders = await clearExpiredPurchaseOrders({ DB });
  const ordersIds = clearedOders.map((po) => po.id);

  logger.info(`Expired purchase orders: ${ordersIds.join(", ")}`);
};
