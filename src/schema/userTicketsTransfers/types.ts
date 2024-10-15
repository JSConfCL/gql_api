import { builder } from "~/builder";
import {
  UserTicketTransferStatus,
  selectUserTicketsSchema,
} from "~/datasources/db/schema";
import { UserTicketRef, UserTicketTransferRef } from "~/schema/shared/refs";

export const TicketTransferAttemptStatusEnum = builder.enumType(
  UserTicketTransferStatus,
  {
    name: "TicketTransferAttemptStatus",
  },
);

const TicketTransferUserInfoRef = builder.objectRef<{
  email: string;
  name: string | null;
}>("TicketTransferUserInfo");

builder.objectType(TicketTransferUserInfoRef, {
  fields: (t) => ({
    email: t.exposeString("email"),
    name: t.exposeString("name", {
      nullable: true,
    }),
  }),
});

builder.objectType(UserTicketTransferRef, {
  description: "Representation of a user ticket transfer",
  fields: (t) => ({
    id: t.exposeID("id"),
    sender: t.field({
      type: TicketTransferUserInfoRef,
      resolve: async (root, args, { DB }) => {
        const user = await DB.query.usersSchema.findFirst({
          where: (u, { eq }) => eq(u.id, root.senderUserId),
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
      type: TicketTransferUserInfoRef,
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
    status: t.expose("status", { type: TicketTransferAttemptStatusEnum }),
    expirationDate: t.expose("expirationDate", {
      type: "DateTime",
      nullable: false,
    }),
    transferMessage: t.expose("transferMessage", {
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
