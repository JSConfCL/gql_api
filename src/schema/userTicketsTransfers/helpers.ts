import { addDays, endOfDay } from "date-fns";

import { ORM_TYPE } from "~/datasources/db";
import { usersSchema } from "~/datasources/db/users";
import { getUsername } from "~/datasources/queries/utils/createUsername";

type GetOrCreateTransferRecipientsOptions = {
  DB: ORM_TYPE;
  transferRecipients: {
    email: string;
    name: string;
  }[];
};

type GetOrCreateTransferRecipientsItem = {
  id: string;
  email: string;
  name: string | null;
  username: string;
};

export const getOrCreateTransferRecipients = async ({
  DB,
  transferRecipients,
}: GetOrCreateTransferRecipientsOptions): Promise<
  Map<string, GetOrCreateTransferRecipientsItem>
> => {
  if (transferRecipients.length === 0) {
    return new Map();
  }

  // Insert users that don't exist
  // We use onConflictDoNothing to avoid errors
  // if the user already exists or if is being created by another process
  await DB.insert(usersSchema)
    .values(
      transferRecipients.map((recipient) => ({
        email: recipient.email,
        name: recipient.name,
        username: getUsername(recipient.email),
      })),
    )
    .onConflictDoNothing()
    .returning({
      id: usersSchema.id,
      email: usersSchema.email,
      name: usersSchema.name,
      username: usersSchema.username,
    });

  const users = await DB.query.usersSchema.findMany({
    where: (t, { inArray }) =>
      inArray(
        t.email,
        transferRecipients.map((r) => r.email),
      ),
  });

  const emailToUser = new Map<string, GetOrCreateTransferRecipientsItem>(
    users.map((user) => [user.email, user]),
  );

  return emailToUser;
};

/**
 * Returns the expiration date for a transfer.
 * The expiration date is at least 7 days from the current date with the end at 23:59:59 of the 7th day.
 */
export const getExpirationDateForTicketTransfer = () => {
  const minDays = 7;
  const expirationDate = endOfDay(addDays(new Date(), minDays));

  return expirationDate;
};
