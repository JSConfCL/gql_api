import { faker } from "@faker-js/faker";

export const createOrUpdateStripeProductAndPrice =
  async (): Promise<string> => {
    return new Promise((resolve) => {
      resolve(faker.string.uuid());
    });
  };
