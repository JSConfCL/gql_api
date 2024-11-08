import { builder } from "~/builder";
import { UserTicketTransferStatus } from "~/datasources/db/schema";
import { UserTicketTransferRef } from "~/schema/shared/refs";

import { UserTicketLoadable } from "../userTickets/types";

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
    createdAt: t.expose("createdAt", {
      type: "DateTime",
      nullable: false,
    }),
    sender: t.loadable({
      type: TicketTransferUserInfoRef,
      load: async (sendersIds: string[], { DB }) => {
        const users = await DB.query.usersSchema.findMany({
          where: (u, { inArray }) => inArray(u.id, sendersIds),
        });

        return sendersIds.map((id) => {
          const user = users.find((u) => u.id === id);

          if (!user) {
            throw new Error("User not found");
          }

          return {
            email: user.email,
            name: user.name,
          };
        });
      },
      resolve: (root) => root.senderUserId,
    }),
    recipient: t.loadable({
      type: TicketTransferUserInfoRef,
      load: async (recipientIds: string[], { DB }) => {
        const users = await DB.query.usersSchema.findMany({
          where: (u, { inArray }) => inArray(u.id, recipientIds),
        });

        return recipientIds.map((id) => {
          const user = users.find((u) => u.id === id);

          if (!user) {
            throw new Error("User not found");
          }

          return {
            email: user.email,
            name: user.name,
          };
        });
      },
      resolve: (root) => root.recipientUserId,
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
      type: UserTicketLoadable,
      resolve: (root) => root.userTicketId,
    }),
  }),
});
