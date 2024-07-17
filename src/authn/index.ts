import { decode, verify } from "@tsndr/cloudflare-worker-jwt";

import { TokenPayload } from "~/authn/types";
import { ORM_TYPE } from "~/datasources/db";
import { insertUsersSchema, USER } from "~/datasources/db/schema";
import {
  findUserByID,
  updateUserProfileInfo,
} from "~/datasources/queries/users";
import { unauthorizedError } from "~/errors";
import { logger } from "~/logging";

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

// Obtener el token de autorización de la solicitud, ya sea del encabezado de
// autorización o de la cookie "community-os-access-token"
const getImpersonatedUserFromRequest = async (
  request: Request,
  DB: ORM_TYPE,
) => {
  const authHeader = request.headers.get("x-impersonated-user-id");

  if (authHeader) {
    const user = await findUserByID(DB, authHeader);

    return user;
  }

  return null;
};

const decodeJWT = (JWT_TOKEN: string) => {
  try {
    const { payload } = decode(JWT_TOKEN) as TokenPayload;

    return payload;
  } catch (e) {
    logger.error("Could not parse token", e);

    return null;
  }
};

export const getUserFromRequest = async ({
  ORIGINAL_USER,
  request,
  DB,
}: {
  ORIGINAL_USER: USER | null;
  request: Request;
  DB: ORM_TYPE;
}) => {
  if (!ORIGINAL_USER) {
    return ORIGINAL_USER;
  }

  if (ORIGINAL_USER.isSuperAdmin) {
    const user = await getImpersonatedUserFromRequest(request, DB);

    if (user) {
      logger.info(`User: ${ORIGINAL_USER.id} is impersonating user ${user.id}`);
    }

    return user;
  }

  return ORIGINAL_USER;
};

export const upsertUserFromRequest = async ({
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
    throw unauthorizedError("Could not parse token");
  }

  try {
    await verify(JWT_TOKEN, SUPABASE_JWT_DECODER, {
      throwError: true,
    });
  } catch (error) {
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
    isEmailVerified: email_verified,
    imageUrl: avatar_url ? avatar_url : picture ? picture : "",
    externalId: sub,
    name,
    username: user_name,
    publicMetadata: payload,
  });

  if (profileInfo.success === false) {
    logger.error("Could not parse profile info", profileInfo.error);
    throw new Error("Could not parse profile info", profileInfo.error);
  }

  logger.info(`Updating profile Info for user ID: ${sub}`);

  return updateUserProfileInfo(DB, profileInfo.data);
};

export const logPossibleUserIdFromJWT = (request: Request) => {
  const isOptions = request.method === "OPTIONS";

  if (isOptions) {
    return null;
  }

  const JWT_TOKEN = getAuthToken(request);

  if (!JWT_TOKEN) {
    logger.info("No token present");

    return null;
  }

  try {
    const { payload } = decode(JWT_TOKEN);
    const userId = (payload as { id: string })?.id ?? "ANONYMOUS";

    logger.info({
      userId,
    });
  } catch (error) {
    logger.error("Could not parse token", error);

    return null;
  }
};
