import { faker } from "@faker-js/faker";

export const createOrUpdateStripeProductAndPrice = async ({
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
}): Promise<string> => {
  return faker.string.uuid();
};
