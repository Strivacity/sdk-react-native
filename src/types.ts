export interface ServiceConfiguration {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint?: string;
  registrationEndpoint?: string;
  endSessionEndpoint?: string;
}

export type BaseConfiguration =
  | {
      issuer?: string;
      serviceConfiguration: ServiceConfiguration;
    }
  | {
      issuer: string;
      serviceConfiguration?: ServiceConfiguration;
    };

export type CustomHeaders = {
  authorize?: Record<string, string>;
  token?: Record<string, string>;
  register?: Record<string, string>;
};

export type AdditionalHeaders = Record<string, string>;

export interface RegistrationResponse {
  clientId: string;
  additionalParameters?: { [name: string]: string };
  clientIdIssuedAt?: string;
  clientSecret?: string;
  clientSecretExpiresAt?: string;
  registrationAccessToken?: string;
  registrationClientUri?: string;
  tokenEndpointAuthMethod?: string;
}

interface BuiltInParameters {
  display?: 'page' | 'popup' | 'touch' | 'wap';
  login_prompt?: string;
  prompt?: 'consent' | 'login' | 'none' | 'select_account';
}

export type BaseAuthConfiguration = BaseConfiguration & {
  clientId: string;
  clientSecret?: string;
};

export type AuthConfiguration = BaseAuthConfiguration & {
  clientSecret?: string;
  scopes: string[];
  redirectUrl: string;
  additionalParameters?: BuiltInParameters & { [name: string]: string };
  clientAuthMethod?: 'basic' | 'post' | 'none';
  dangerouslyAllowInsecureHttpRequests?: boolean;
  customHeaders?: CustomHeaders;
  additionalHeaders?: AdditionalHeaders;
  connectionTimeoutSeconds?: number;
  useNonce?: boolean;
  usePKCE?: boolean;
  warmAndPrefetchChrome?: boolean;
  skipCodeExchange?: boolean;
  iosCustomBrowser?: 'safari' | 'chrome' | 'opera' | 'firefox';
  androidAllowCustomBrowsers?: (
    | 'chrome'
    | 'chromeCustomTab'
    | 'firefox'
    | 'firefoxCustomTab'
    | 'samsung'
    | 'samsungCustomTab'
  )[];
  androidTrustedWebActivity?: boolean;
  iosPrefersEphemeralSession?: boolean;
};

export type EndSessionConfiguration = BaseAuthConfiguration & {
  additionalParameters?: { [name: string]: string };
  dangerouslyAllowInsecureHttpRequests?: boolean;
  iosPrefersEphemeralSession?: boolean;
  iosCustomBrowser?: 'safari' | 'chrome' | 'opera' | 'firefox';
  androidAllowCustomBrowsers?: (
    | 'chrome'
    | 'chromeCustomTab'
    | 'firefox'
    | 'firefoxCustomTab'
    | 'samsung'
    | 'samsungCustomTab'
  )[];
};

export interface AuthorizeResult {
  accessToken: string;
  accessTokenExpirationDate: string;
  authorizeAdditionalParameters?: { [name: string]: string };
  tokenAdditionalParameters?: { [name: string]: string };
  idToken: string;
  refreshToken: string;
  tokenType: string;
  scopes: string[];
  authorizationCode: string;
  codeVerifier?: string;
}

export interface RefreshResult {
  accessToken: string;
  accessTokenExpirationDate: string;
  additionalParameters?: { [name: string]: string };
  idToken: string;
  refreshToken: string | null;
  tokenType: string;
}

export interface RevokeConfiguration {
  tokenToRevoke: string;
  sendClientId?: boolean;
  includeBasicAuth?: boolean;
}

export interface RefreshConfiguration {
  refreshToken: string;
}

export interface LogoutConfiguration {
  idToken: string;
  postLogoutRedirectUrl: string;
}

export interface EndSessionResult {
  idTokenHint: string;
  postLogoutRedirectUri: string;
  state: string;
}

// https://tools.ietf.org/html/rfc6749#section-4.1.2.1
type OAuthAuthorizationErrorCode =
  | 'unauthorized_client'
  | 'access_denied'
  | 'unsupported_response_type'
  | 'invalid_scope'
  | 'server_error'
  | 'temporarily_unavailable';
// https://tools.ietf.org/html/rfc6749#section-5.2
type OAuthTokenErrorCode =
  | 'invalid_request'
  | 'invalid_client'
  | 'invalid_grant'
  | 'unauthorized_client'
  | 'unsupported_grant_type'
  | 'invalid_scope';
// https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationError
type OICRegistrationErrorCode =
  | 'invalid_redirect_uri'
  | 'invalid_client_metadata';
type StrivacityAuthErrorCode =
  | 'service_configuration_fetch_error'
  | 'authentication_failed'
  | 'token_refresh_failed'
  | 'token_exchange_failed'
  | 'registration_failed'
  | 'browser_not_found'
  | 'end_session_failed'
  | 'authentication_error'
  | 'run_time_exception';

type ErrorCode =
  | OAuthAuthorizationErrorCode
  | OAuthTokenErrorCode
  | OICRegistrationErrorCode
  | StrivacityAuthErrorCode;

export interface StrivacityAuthError extends Error {
  code: ErrorCode;
}
