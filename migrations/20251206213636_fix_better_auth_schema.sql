-- Rename columns to match Better Auth's camelCase convention

ALTER TABLE public.user 
  RENAME COLUMN email_verified TO "emailVerified";

ALTER TABLE public.user 
  RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.user 
  RENAME COLUMN updated_at TO "updatedAt";

ALTER TABLE public.session 
  RENAME COLUMN expires_at TO "expiresAt";

ALTER TABLE public.session 
  RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.session 
  RENAME COLUMN updated_at TO "updatedAt";

ALTER TABLE public.session 
  RENAME COLUMN ip_address TO "ipAddress";

ALTER TABLE public.session 
  RENAME COLUMN user_agent TO "userAgent";

ALTER TABLE public.session 
  RENAME COLUMN user_id TO "userId";

ALTER TABLE public.account 
  RENAME COLUMN account_id TO "accountId";

ALTER TABLE public.account 
  RENAME COLUMN provider_id TO "providerId";

ALTER TABLE public.account 
  RENAME COLUMN user_id TO "userId";

ALTER TABLE public.account 
  RENAME COLUMN access_token TO "accessToken";

ALTER TABLE public.account 
  RENAME COLUMN refresh_token TO "refreshToken";

ALTER TABLE public.account 
  RENAME COLUMN id_token TO "idToken";

ALTER TABLE public.account 
  RENAME COLUMN access_token_expires_at TO "accessTokenExpiresAt";

ALTER TABLE public.account 
  RENAME COLUMN refresh_token_expires_at TO "refreshTokenExpiresAt";

ALTER TABLE public.account 
  RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.account 
  RENAME COLUMN updated_at TO "updatedAt";

ALTER TABLE public.verification 
  RENAME COLUMN expires_at TO "expiresAt";

ALTER TABLE public.verification 
  RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.verification 
  RENAME COLUMN updated_at TO "updatedAt";
