export type AuthenticatedBranch = {
  id: string;
  code: string;
  name: string;
  isPrimary: boolean;
};

export type AuthenticatedPrincipal = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  branches: AuthenticatedBranch[];
};

export type AccessTokenClaims = {
  sub: string;
  iat: number;
  exp: number;
  iss: 'coopeca-api';
};