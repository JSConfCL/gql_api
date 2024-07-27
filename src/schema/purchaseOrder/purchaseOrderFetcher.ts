import { SQL, and, ilike, inArray, desc } from "drizzle-orm";

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
type SortableType =
  // TODO: Implement sorting
  // | [{ field: string; direction: "asc" | "desc" }]
  null | undefined;

const getSearchPurchaseOrdersQuery = (
  DB: ORM_TYPE,
  search: PurchaseOrderSearch = {},
  sort: SortableType,
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

  const orderBy: SQL<unknown>[] = [];

  if (sort !== null) {
    // This is to support data loaders. for data loaders we should not order by anything.
    // TODO: Handle the case for doing actual column sorting
    orderBy.push(desc(purchaseOrdersSchema.createdAt));
  }

  return query.where(and(...wheres)).orderBy(...orderBy);
};

const searchPurchaseOrders = async ({
  DB,
  search = {},
  sort,
}: {
  DB: ORM_TYPE;
  search: PurchaseOrderSearch;
  sort?: SortableType;
}) => {
  const purchaseOrders = await getSearchPurchaseOrdersQuery(
    DB,
    search,
    sort,
  ).execute();

  return purchaseOrders;
};

const searchPaginatedPurchaseOrders = async ({
  DB,
  pagination,
  search = {},
  sort,
}: {
  DB: ORM_TYPE;
  search: PurchaseOrderSearch;
  sort?: SortableType;
  pagination: PaginationOptionsType;
}) => {
  const query = getSearchPurchaseOrdersQuery(DB, search, sort);

  const results = await paginationDBHelper(DB, query, pagination);

  return results;
};

export const purchaseOrderFetcher = {
  searchPurchaseOrders,
  searchPaginatedPurchaseOrders,
};
