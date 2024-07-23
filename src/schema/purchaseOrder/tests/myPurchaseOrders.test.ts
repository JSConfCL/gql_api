import { v4 } from "uuid";
import { it, describe, assert } from "vitest";

import {
  executeGraphqlOperationAsUser,
  insertPurchaseOrder,
  insertUser,
} from "~/tests/fixtures";

import {
  MyPurchaseOrders,
  MyPurchaseOrdersQuery,
  MyPurchaseOrdersQueryVariables,
} from "./myPurchaseOrders.generated";

describe("My Purchase Orders", () => {
  it("should fetch purchase orders for a user", async () => {
    const user = await insertUser();
    const purchaseOrderId1 = v4();
    const purchaseOrderId2 = v4();

    const purchaseOrder = await insertPurchaseOrder({
      id: purchaseOrderId1,
      userId: user.id,
      status: "complete",
      purchaseOrderPaymentStatus: "paid",
    });

    await insertPurchaseOrder({
      id: purchaseOrderId2,
      userId: user.id,
      status: "expired",
      purchaseOrderPaymentStatus: "paid",
    });

    const variables: MyPurchaseOrdersQueryVariables = {
      input: {
        pagination: {
          page: 0,
          pageSize: 10,
        },
      },
    };

    const result = await executeGraphqlOperationAsUser<MyPurchaseOrdersQuery>(
      {
        document: MyPurchaseOrders,
        variables: variables,
      },
      user,
    );

    assert.equal(result.errors, undefined);
    assert.equal(result?.data?.myPurchaseOrders?.data?.length, 1);
    assert.equal(result?.data?.myPurchaseOrders.data[0].id, purchaseOrderId1);
    assert.equal(
      result?.data?.myPurchaseOrders.data[0].status,
      purchaseOrder.status,
    );
  });
});
