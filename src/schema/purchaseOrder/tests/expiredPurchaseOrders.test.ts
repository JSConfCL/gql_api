import { assert, describe, it } from "vitest";

import { someMinutesIntoTheFuture } from "~/datasources/helpers";
import { clearExpiredPurchaseOrders } from "~/schema/purchaseOrder/actions";
import { insertPurchaseOrder } from "~/tests/fixtures";
import { getTestDB } from "~/tests/fixtures/databaseHelper";

describe("clearExpiredPurchaseOrders", () => {
  it("Should clear expired purchase orders", async () => {
    const DB = await getTestDB();
    const purchaseOrder1 = await insertPurchaseOrder({
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
      paymentPlatformExpirationDate: someMinutesIntoTheFuture(-10),
    });
    const purchaseOrder2 = await insertPurchaseOrder({
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
      paymentPlatformExpirationDate: someMinutesIntoTheFuture(-11),
    });

    await insertPurchaseOrder({
      status: "open",
      purchaseOrderPaymentStatus: "unpaid",
      paymentPlatformExpirationDate: someMinutesIntoTheFuture(60 * 24),
    });

    const result = await clearExpiredPurchaseOrders({
      DB,
    });

    assert.equal(result.length, 2);
    assert.equal(result[0].id, purchaseOrder1.id);
    assert.equal(result[1].id, purchaseOrder2.id);
  });
});
