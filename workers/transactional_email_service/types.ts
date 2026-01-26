export type ENV = {
  RESEND_API_KEY: string;
};

export interface CommunityInfo {
  name: string;
  slug: string | null;
  logoImageSanityRef: string | null;
}

export interface EventInfo {
  name: string;
  addressDescriptiveName: string | null;
  address: string | null;
  startDateTime: Date;
  endDateTime: Date | null;
  eventLogoCloudflareImageURL?: string;
}

export interface UserTicketTransferInfo {
  id: string;
  recipientUser: {
    name: string | null;
    email: string;
    username: string | null;
  };
  senderUser: {
    name: string | null;
    email: string;
    username: string | null;
  };
  transferMessage?: string | null;
  expirationDate?: Date;
  userTicket: {
    publicId: string;
    ticketTemplate: {
      tags: string[];
      event: {
        name: string;
        addressDescriptiveName: string | null;
        address: string | null;
        startDateTime: Date;
        endDateTime: Date | null;
        logoImageReference: {
          url: string;
        } | null;
        eventsToCommunities: Array<{
          community: {
            slug: string | null;
            name: string;
            logoImageSanityRef: string | null;
          };
        }>;
      };
    };
  };
}
