import { SQL, and, asc, ilike, inArray } from "drizzle-orm";

import { ORM_TYPE } from "~/datasources/db";
import {
  purchaseOrderPaymentPlatforms,
  purchaseOrderStatusEnum,
  purchaseOrdersSchema,
} from "~/datasources/db/purchaseOrders";
import {
  PaginationOptionsType,
  paginationDBHelper,
} from "~/datasources/helpers/paginationQuery";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";

export type PurchaseOrderSearch = {
  userIds?: string[];
  status?: (typeof purchaseOrderStatusEnum)[number][];
  paymentPlatform?: (typeof purchaseOrderPaymentPlatforms)[number][];
  description?: string;
};

const getSearchPurchaseOrdersQuery = (
  DB: ORM_TYPE,
  search: PurchaseOrderSearch = {},
) => {
  const { userIds, status, paymentPlatform, description } = search;

  const wheres: SQL[] = [];
  const query = DB.select().from(purchaseOrdersSchema);

  if (userIds && userIds.length >= 0) {
    wheres.push(inArray(purchaseOrdersSchema.userId, userIds));
  }

  if (status && status.length >= 0) {
    wheres.push(inArray(purchaseOrdersSchema.status, status));
  }

  if (paymentPlatform) {
    wheres.push(inArray(purchaseOrdersSchema.paymentPlatform, paymentPlatform));
  }

  if (description) {
    wheres.push(
      ilike(
        purchaseOrdersSchema.description,
        sanitizeForLikeSearch(description),
      ),
    );
  }

  return query
    .where(and(...wheres))
    .orderBy(asc(purchaseOrdersSchema.createdAt));
};

const searchPurchaseOrders = async ({
  DB,
  search = {},
}: {
  DB: ORM_TYPE;
  search: PurchaseOrderSearch;
}) => {
  const purchaseOrders = await getSearchPurchaseOrdersQuery(
    DB,
    search,
  ).execute();

  return purchaseOrders;
};

const searchPaginatedPurchaseOrders = async ({
  DB,
  pagination,
  search = {},
}: {
  DB: ORM_TYPE;
  search: PurchaseOrderSearch;
  pagination: PaginationOptionsType;
}) => {
  const query = getSearchPurchaseOrdersQuery(DB, search);

  const results = await paginationDBHelper(DB, query, pagination);

  return results;
};

export const purchaseOrderFetcher = {
  searchPurchaseOrders,
  searchPaginatedPurchaseOrders,
};
