import { eq, inArray } from "drizzle-orm";

import { builder } from "~/builder";
import {
  userTicketsApprovalStatusEnum,
  puchaseOrderPaymentStatusEnum,
  userTicketsRedemptionStatusEnum,
  selectUsersSchema,
  SelectUserTicketTransferSchema,
  usersSchema,
  userTicketTransfersSchema,
  userTicketsSchema,
} from "~/datasources/db/schema";
import {
  PurchaseOrderLoadable,
  PurchaseOrderPaymentStatusEnum,
} from "~/schema/purchaseOrder/types";
import {
  UserRef,
  UserTicketRef,
  PublicUserTicketRef,
  UserTicketTransferRef,
} from "~/schema/shared/refs";
import { TicketLoadable } from "~/schema/ticket/types";
import { UserLoadable } from "~/schema/user/types";
import { usersFetcher } from "~/schema/user/userFetcher";

import { UserTicketAddonRef } from "../ticketAddons/types";

export const TicketPaymentStatus = builder.enumType("TicketPaymentStatus", {
  values: puchaseOrderPaymentStatusEnum,
});

export const TicketApprovalStatus = builder.enumType("TicketApprovalStatus", {
  values: userTicketsApprovalStatusEnum,
});

export const TicketRedemptionStatus = builder.enumType(
  "TicketRedemptionStatus",
  {
    values: userTicketsRedemptionStatusEnum,
  },
);

builder.objectType(UserTicketRef, {
  description: "Representation of a User ticket",
  fields: (t) => ({
    id: t.exposeID("id"),
    publicId: t.exposeString("publicId"),
    paymentStatus: t.field({
      type: PurchaseOrderPaymentStatusEnum,
      nullable: true,
      resolve: async (root, arg, context) => {
        const lodaer = PurchaseOrderLoadable.getDataloader(context);
        const purchaseOrder = await lodaer.load(root.purchaseOrderId);

        if (!purchaseOrder) {
          return null;
        }

        return purchaseOrder.purchaseOrderPaymentStatus;
      },
    }),
    user: t.field({
      type: UserRef,
      nullable: true,
      resolve: async (root, arg, context) => {
        const canRequest =
          context.USER?.id === root.userId || context.USER?.isSuperAdmin;

        if (!canRequest) {
          return null;
        }

        if (!root.userId) {
          return null;
        }

        const users = await usersFetcher.searchUsers({
          DB: context.DB,
          search: {
            userIds: [root.userId],
          },
        });

        const user = users[0];

        if (!user) {
          return null;
        }

        return selectUsersSchema.parse(users[0]);
      },
    }),
    approvalStatus: t.field({
      type: TicketApprovalStatus,
      resolve: (root) => root.approvalStatus,
    }),
    redemptionStatus: t.field({
      type: TicketRedemptionStatus,
      resolve: (root) => root.redemptionStatus,
    }),
    ticketTemplate: t.field({
      type: TicketLoadable,
      resolve: (root) => root.ticketTemplateId,
    }),
    purchaseOrder: t.field({
      type: PurchaseOrderLoadable,
      nullable: true,
      resolve: (root) => root.purchaseOrderId,
    }),
    createdAt: t.field({
      type: "DateTime",
      nullable: false,
      resolve: (root) => new Date(root.createdAt),
    }),
    transferAttempts: t.loadableList({
      type: UserTicketTransferRef,
      load: async (ids: string[], ctx) => {
        const idToUserTicketTransferMap: Record<
          string,
          SelectUserTicketTransferSchema[] | undefined
        > = {};

        const userTicketTransfers = await ctx.DB.select({
          transfer: userTicketTransfersSchema,
          userId: usersSchema.id,
        })
          .from(userTicketTransfersSchema)
          .innerJoin(
            userTicketsSchema,
            eq(userTicketTransfersSchema.userTicketId, userTicketsSchema.id),
          )
          .innerJoin(usersSchema, eq(userTicketsSchema.userId, usersSchema.id))
          .where(inArray(userTicketsSchema.id, ids));

        userTicketTransfers.forEach((userTicketTransfer) => {
          const { transfer, userId } = userTicketTransfer;

          const canRequest = ctx.USER?.id === userId || ctx.USER?.isSuperAdmin;

          if (!idToUserTicketTransferMap[transfer.userTicketId]) {
            idToUserTicketTransferMap[transfer.userTicketId] = [];
          }

          if (!canRequest) {
            return;
          }

          idToUserTicketTransferMap[transfer.userTicketId]?.push(transfer);
        });

        return ids.map((id) => idToUserTicketTransferMap[id] ?? []);
      },
      resolve: (root) => root.id,
    }),
    userTicketAddons: t.loadableList({
      type: UserTicketAddonRef,
      load: async (ids: string[], { DB }) => {
        const userTicketAddons = await DB.query.userTicketAddonsSchema.findMany(
          {
            where: (etc, { inArray }) => inArray(etc.userTicketId, ids),
          },
        );

        const resultGroupedByUserTicketId = ids.map((id) => {
          return userTicketAddons.filter((addon) => addon.userTicketId === id);
        });

        return resultGroupedByUserTicketId;
      },
      resolve: (root) => root.id,
    }),
  }),
});

builder.objectType(PublicUserTicketRef, {
  description: "Representation of the public information of a User ticket",
  fields: (t) => ({
    id: t.exposeID("publicId"),
    userImage: t.field({
      type: "String",
      nullable: true,
      resolve: async (root, arg, context) => {
        if (!root.userId) {
          return null;
        }

        const loader = UserLoadable.getDataloader(context);
        const user = await loader.load(root.userId);

        if (!user) {
          return null;
        }

        return user.imageUrl;
      },
    }),
    userUsername: t.field({
      type: "String",
      nullable: true,
      resolve: async (root, arg, context) => {
        if (!root.userId) {
          return null;
        }

        const loader = UserLoadable.getDataloader(context);
        const user = await loader.load(root.userId);

        if (!user) {
          return null;
        }

        return user.username;
      },
    }),
    userName: t.field({
      type: "String",
      nullable: true,
      resolve: async (root, arg, context) => {
        if (!root.userId) {
          return null;
        }

        const loader = UserLoadable.getDataloader(context);
        const user = await loader.load(root.userId);

        if (!user) {
          return null;
        }

        return user.name;
      },
    }),
    ticket: t.field({
      type: TicketLoadable,
      resolve: (root) => root.ticketTemplateId,
    }),
  }),
});
