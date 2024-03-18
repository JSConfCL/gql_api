import { SQL, gte, lte } from "drizzle-orm";

import { builder } from "~/builder";
import {
  paymentLogsSchema,
  selectPaymentLogsSchema,
} from "~/datasources/db/paymentLogs";
import {
  ConsolidatedPaymentLogEntryRef,
  PaymentLogRef,
} from "~/schema/shared/refs";

const SearchPaymentLogsInput = builder.inputType("SearchPaymentLogsInput", {
  fields: (t) => ({
    startDate: t.field({
      required: true,
      type: "DateTime",
    }),
    endDate: t.field({
      required: false,
      type: "DateTime",
    }),
  }),
});

builder.queryFields((t) => ({
  searchPaymentLogs: t.field({
    description:
      "Search on the payment logs by date, and returns a list of payment logs",
    type: [PaymentLogRef],
    nullable: false,
    args: {
      input: t.arg({ type: SearchPaymentLogsInput, required: true }),
    },
    resolve: async (_, { input }, { DB }) => {
      const wheres: SQL[] = [];
      if (input.startDate) {
        wheres.push(
          gte(paymentLogsSchema.externalCreationDate, input.startDate),
        );
      }
      if (input.endDate) {
        wheres.push(lte(paymentLogsSchema.externalCreationDate, input.endDate));
      }

      const paymentLogs = await DB.query.paymentLogsSchema.findMany({
        where: (_, { and }) => and(...wheres),
      });
      return paymentLogs.map((p) => selectPaymentLogsSchema.parse(p));
    },
  }),
  searchConsolidatedPaymentLogs: t.field({
    description:
      "Search a consolidated payment logs, by date, aggregated by platform and currency_id",
    type: [ConsolidatedPaymentLogEntryRef],
    nullable: false,
    args: {
      input: t.arg({ type: SearchPaymentLogsInput, required: true }),
    },
    resolve: async (_, { input }, { DB }) => {
      const wheres: SQL[] = [];
      if (input.startDate) {
        wheres.push(
          gte(paymentLogsSchema.externalCreationDate, input.startDate),
        );
      }
      if (input.endDate) {
        wheres.push(lte(paymentLogsSchema.externalCreationDate, input.endDate));
      }

      const paymentLogs = await DB.query.paymentLogsSchema.findMany({
        where: (_, { and }) => and(...wheres),
      });

      const consolidatedPayments: Record<
        string,
        {
          id: string;
          totalTransactionAmount: number;
          platform: string;
          currencyId: string;
        }
      > = {};
      paymentLogs.forEach((p) => {
        const key = `${p.platform}-${p.currencyId}`;
        if (!consolidatedPayments[key]) {
          consolidatedPayments[key] = {
            id: key,
            totalTransactionAmount: 0,
            platform: p.platform,
            currencyId: p.currencyId,
          };
        }
        consolidatedPayments[key].totalTransactionAmount += parseFloat(
          p.transactionAmount,
        );
      });

      return Object.values(consolidatedPayments);
    },
  }),
}));
