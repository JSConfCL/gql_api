import { sql } from "drizzle-orm";
import { PgSelect } from "drizzle-orm/pg-core";

import { ORM_TYPE } from "~/datasources/db";

export const paginationDBHelper = async <
  T extends { execute: (...args: any) => any },
>(
  DB: ORM_TYPE,
  select: T,
  pagination: {
    page: number;
    pageSize: number;
  } = {
    page: 0,
    pageSize: 30,
  },
) => {
  const safePageSize = Math.max(pagination.pageSize, 1);
  const safePage = Math.max(pagination.page, 0);
  const query = select as unknown as PgSelect;
  const offset = safePage * safePageSize;
  const subQuery = query.as("sub");
  const totalRecordsQuery = DB.select({
    total: sql<number>`count(*)`,
  }).from(subQuery);

  // TODO: Considerar parallelizar estas queries en un Promise.all
  const totalRecordsResult = await totalRecordsQuery.execute();
  const results = await query.limit(safePageSize).offset(offset).execute();

  const totalRecords = Number(totalRecordsResult[0].total);
  const totalPages = Math.ceil(totalRecords / safePageSize);

  return {
    data: results as unknown as Awaited<ReturnType<T["execute"]>>,
    pagination: {
      totalRecords,
      totalPages,
      currentPage: safePage,
      pageSize: safePageSize,
    },
  };
};
