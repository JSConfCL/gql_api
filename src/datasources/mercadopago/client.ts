import { MercadoPagoConfig } from "mercadopago";

let mercadoPagoClient: MercadoPagoConfig | null = null;
export const getMercadoPagoClient = (accessToken: string) => {
  if (!mercadoPagoClient) {
    mercadoPagoClient = new MercadoPagoConfig({
      accessToken,
    });
  }
  return mercadoPagoClient;
};
