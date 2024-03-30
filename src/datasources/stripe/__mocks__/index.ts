import { faker } from "@faker-js/faker";

export const createStripeProduct = async ({
  item,
}: {
  item: {
    id: string;
    currency: string;
    name: string;
    description?: string;
    metadata?: {
      [name: string]: string | number | null;
    };
    unit_amount: number;
  };
  getStripeClient: () => unknown;
  // eslint-disable-next-line @typescript-eslint/require-await
}) => {
  return {
    id: faker.string.uuid(),
    name: item.name,
    description: item.description,
    metadata: item.metadata,
    default_price_data: {
      currency: item.currency,
      ...(Number.isInteger(item.unit_amount)
        ? { unit_amount: item.unit_amount }
        : { unit_amount_decimal: item.unit_amount.toString() }),
    },
    shippable: false,
  };
};
