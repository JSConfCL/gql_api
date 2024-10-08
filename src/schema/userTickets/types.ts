import { builder } from "~/builder";
import {
  userTicketsApprovalStatusEnum,
  puchaseOrderPaymentStatusEnum,
  userTicketsRedemptionStatusEnum,
  selectUsersSchema,
  UserTicketGiftStatus,
  selectUserTicketsSchema,
} from "~/datasources/db/schema";
import {
  PurchaseOrderLoadable,
  PurchaseOrderPaymentStatusEnum,
} from "~/schema/purchaseOrder/types";
import {
  UserRef,
  UserTicketRef,
  PublicUserTicketRef,
  UserTicketGiftRef,
} from "~/schema/shared/refs";
import { TicketLoadable } from "~/schema/ticket/types";
import { UserLoadable } from "~/schema/user/types";
import { usersFetcher } from "~/schema/user/userFetcher";

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

        return purchaseOrder.purchaseOrder.purchaseOrderPaymentStatus;
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
    giftAttempts: t.field({
      type: [UserTicketGiftRef],
      resolve: async (root, args, context) => {
        const canRequest =
          context.USER?.id === root.userId || context.USER?.isSuperAdmin;

        if (!canRequest) {
          return [];
        }

        if (!root.userId) {
          return [];
        }

        const userTicketGifts =
          await context.DB.query.userTicketGiftsSchema.findMany({
            where: (utg, { eq }) => eq(utg.userTicketId, root.id),
          });

        return userTicketGifts;
      },
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

export const RedeemUserTicketErrorRef = builder.objectRef<{
  error: true;
  errorMessage: string;
}>("RedeemUserTicketError");

export const RedeemUserTicketError = builder.objectType(
  RedeemUserTicketErrorRef,
  {
    fields: (t) => ({
      error: t.field({
        type: "Boolean",
        resolve: () => true,
      }),
      errorMessage: t.exposeString("errorMessage", {}),
    }),
  },
);

export const GiftAttemptStatusEnum = builder.enumType(UserTicketGiftStatus, {
  name: "GiftAttemptStatus",
});

const GiftTicketUserInfo = builder.objectRef<{
  email: string;
  name: string | null;
}>("GiftTicketUserInfo");

builder.objectType(GiftTicketUserInfo, {
  fields: (t) => ({
    email: t.exposeString("email"),
    name: t.exposeString("name", {
      nullable: true,
    }),
  }),
});

builder.objectType(UserTicketGiftRef, {
  description: "Representation of a user ticket gift",
  fields: (t) => ({
    id: t.exposeID("id"),
    gifter: t.field({
      type: GiftTicketUserInfo,
      resolve: async (root, args, { DB }) => {
        const user = await DB.query.usersSchema.findFirst({
          where: (u, { eq }) => eq(u.id, root.gifterUserId),
        });

        if (!user) {
          throw new Error("User not found");
        }

        return {
          email: user.email,
          name: user.name,
        };
      },
    }),
    recipient: t.field({
      type: GiftTicketUserInfo,
      resolve: async (root, args, { DB }) => {
        const user = await DB.query.usersSchema.findFirst({
          where: (u, { eq }) => eq(u.id, root.recipientUserId),
        });

        if (!user) {
          throw new Error("User not found");
        }

        return {
          email: user.email,
          name: user.name,
        };
      },
    }),
    status: t.expose("status", { type: GiftAttemptStatusEnum }),
    expirationDate: t.expose("expirationDate", {
      type: "DateTime",
      nullable: false,
    }),
    giftMessage: t.expose("giftMessage", {
      type: "String",
      nullable: true,
    }),
    userTicket: t.field({
      type: UserTicketRef,
      resolve: async (root, args, { DB }) => {
        const userTicket = await DB.query.userTicketsSchema.findFirst({
          where: (ut, { eq }) => eq(ut.id, root.userTicketId),
        });

        if (!userTicket) {
          throw new Error("User ticket not found");
        }

        return selectUserTicketsSchema.parse(userTicket);
      },
    }),
  }),
});
