import { SQL, and, ilike, inArray, desc, asc } from "drizzle-orm";

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
import { SortableSchemaFields } from "~/datasources/helpers/sorting";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";

export type PurchaseOrderSearch = {
  userIds?: string[];
  status?: (typeof purchaseOrderStatusEnum)[number][];
  paymentPlatform?: (typeof purchaseOrderPaymentPlatforms)[number][];
  description?: string;
};

type SortableFields = "createdAt" | "status";
type EventFetcherSort = SortableSchemaFields<SortableFields>;

const getSearchPurchaseOrdersQuery = (
  DB: ORM_TYPE,
  search: PurchaseOrderSearch = {},
  sort: EventFetcherSort,
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

  if (sort) {
    const sorts = sort.map(([field, direction]) => {
      const sortDirection = direction === "asc" ? asc : desc;

      return sortDirection(purchaseOrdersSchema[field]);
    });

    orderBy.push(...sorts);
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
  sort?: EventFetcherSort;
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
  sort?: EventFetcherSort;
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
