import { assert, describe, it } from "vitest";

import {
  executeGraphqlOperation,
  insertTicket,
  insertTicketTemplate,
  insertUser,
} from "~/tests/fixtures";

import {
  PublicTicketInfo,
  PublicTicketInfoQuery,
  PublicTicketInfoQueryVariables,
} from "./publicTicketInfo.generated";

describe("public user ticket information", () => {
  it("Should work for anonymous users", async () => {
    const ticketTemplate = await insertTicketTemplate();
    const user = await insertUser();
    const ticket = await insertTicket({
      approvalStatus: "approved",
      ticketTemplateId: ticketTemplate.id,
      userId: user.id,
    });

    const response = await executeGraphqlOperation<
      PublicTicketInfoQuery,
      PublicTicketInfoQueryVariables
    >({
      document: PublicTicketInfo,
      variables: {
        input: {
          publicTicketId: ticket.publicId,
        },
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.publicTicketInfo.id, ticket.publicId);

    assert.equal(response.data?.publicTicketInfo.userName, user.username);
  });

  describe("Should not work", () => {
    it("If ticket is not approved or gift_accepted", async () => {
      const ticketTemplate = await insertTicketTemplate();
      const user = await insertUser();
      const ticket = await insertTicket({
        approvalStatus: "pending",
        ticketTemplateId: ticketTemplate.id,
        userId: user.id,
      });

      const response = await executeGraphqlOperation<
        PublicTicketInfoQuery,
        PublicTicketInfoQueryVariables
      >({
        document: PublicTicketInfo,
        variables: {
          input: {
            publicTicketId: ticket.publicId,
          },
        },
      });

      assert.equal(response.errors?.[0].message, "Ticket not found");
    });
  });
});
