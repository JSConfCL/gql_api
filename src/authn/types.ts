export type TokenPayload = {
  payload: {
    aud: string;
    exp: number;
    iat: number;
    iss: string;
    sub: string;
    email: string;
    phone: string;
    app_metadata: { provider: string; providers: string[] };
    user_metadata: {
      avatar_url: string;
      email: string;
      email_verified: boolean;
      full_name: string;
      iss: string;
      name: string;
      phone_verified: boolean;
      preferred_username: string;
      provider_id: string;
      picture: string;
      sub: string;
      user_name: string;
    };
    role: string;
    aal: string;
    amr: { method: "oauth"; timestamp: number }[];
    session_id: string;
    is_anonymous: boolean;
  };
};
