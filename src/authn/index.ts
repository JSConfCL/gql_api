import { decode, verify } from "@tsndr/cloudflare-worker-jwt";

import { ORM_TYPE } from "~/datasources/db";
import { insertUsersSchema } from "~/datasources/db/schema";
import { updateUserProfileInfo } from "~/datasources/queries/users";
import { unauthorizedError } from "~/errors";

type TokenPayload = {
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

// Obtener el token de autorización de la solicitud, ya sea del encabezado de
// autorización o de la cookie "community-os-access-token"
const getAuthToken = (request: Request) => {
  const cookieHeader = request.headers.get("Cookie");
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    const token = authHeader.split("Bearer ")[1];
    return token;
  }
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const tokenCookie = cookies.find((c) =>
      c.startsWith("community-os-access-token="),
    );
    if (tokenCookie) {
      return tokenCookie.split("=")[1];
    }
  }
  return null;
};

const decodeJWT = (JWT_TOKEN: string) => {
  try {
    const { payload } = decode(JWT_TOKEN) as TokenPayload;
    return payload;
  } catch (e) {
    console.error("Could not parse token", e);
    return null;
  }
};

export const getUser = async ({
  request,
  SUPABASE_JWT_DECODER,
  DB,
}: {
  request: Request;
  SUPABASE_JWT_DECODER: string;
  DB: ORM_TYPE;
}) => {
  const JWT_TOKEN = getAuthToken(request);
  if (!JWT_TOKEN) {
    return null;
  }
  const payload = decodeJWT(JWT_TOKEN);
  if (!payload) {
    console.error("Could not parse token");
    return payload;
  }
  const verified = await verify(JWT_TOKEN, SUPABASE_JWT_DECODER);
  if (!verified) {
    throw unauthorizedError("Could not verify token");
  }
  const isExpired = payload.exp < Date.now() / 1000;
  if (isExpired) {
    throw unauthorizedError("Token expired");
  }
  const { avatar_url, name, user_name, email_verified, sub, picture } =
    payload.user_metadata;
  const profileInfo = insertUsersSchema.safeParse({
    email: payload.email,
    emailVerified: email_verified,
    imageUrl: avatar_url ? avatar_url : picture ? picture : "",
    externalId: sub,
    name,
    username: user_name,
    publicMetadata: payload,
  });
  if (profileInfo.success === false) {
    console.error("Could not parse profile info", profileInfo.error);
    throw new Error("Could not parse profile info", profileInfo.error);
  }
  console.log("Updating profile Info for user ID:", sub);
  return updateUserProfileInfo(DB, profileInfo.data);
};

export const logPossibleUserIdFromJWT = (request: Request) => {
  const isOptions = request.method === "OPTIONS";
  if (isOptions) {
    return null;
  }
  const JWT_TOKEN = getAuthToken(request);
  if (!JWT_TOKEN) {
    console.info("No token present");
    return null;
  }
  try {
    const { payload } = decode(JWT_TOKEN);
    const userId = (payload as { id: string })?.id ?? "ANONYMOUS";
    console.log("User_ID", userId);
  } catch (error) {
    console.error("Could not parse token", error);
    return null;
  }
};
