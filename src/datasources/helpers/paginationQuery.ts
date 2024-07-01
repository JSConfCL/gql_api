import { sql } from "drizzle-orm";
import { PgSelect } from "drizzle-orm/pg-core";

import { ORM_TYPE } from "~/datasources/db";

export const paginationDBHelper = async <
  T extends { execute: (...args: any) => any },
>(
  DB: ORM_TYPE,
  select: T,
  {
    page,
    pageSize,
  }: {
    page: number;
    pageSize: number;
  },
) => {
  const query = select as unknown as PgSelect;
  const offset = Math.max(page, 0) * pageSize;
  const subQuery = query.as("sub");
  const totalRecordsQuery = DB.select({
    total: sql<number>`count(*)`,
  }).from(subQuery);

  // TODO: Considerar parallelizar estas queries en un Promise.all
  const totalRecordsResult = await totalRecordsQuery.execute();
  const results = await query.limit(pageSize).offset(offset).execute();

  const totalRecords = Number(totalRecordsResult[0].total);
  const totalPages = Math.ceil(totalRecords / pageSize);

  return {
    data: results as unknown as Awaited<ReturnType<T["execute"]>>,
    pagination: {
      totalRecords: totalRecords,
      totalPages: totalPages,
      currentPage: page,
      pageSize: pageSize,
    },
  };
};
