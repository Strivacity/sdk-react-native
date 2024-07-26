import type {
  ServiceConfiguration,
  CustomHeaders,
  AdditionalHeaders,
  AuthConfiguration,
  BaseAuthConfiguration,
  RefreshConfiguration,
  RevokeConfiguration,
  EndSessionConfiguration,
  LogoutConfiguration,
} from './types';
import { NativeModules, Platform } from 'react-native';
import invariant from 'invariant';
import base64 from 'react-native-base64';

const LINKING_ERROR =
  `The package 'strivacity-react-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const StrivacityReactNative = NativeModules.StrivacityReactNative
  ? NativeModules.StrivacityReactNative
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

const validateIssuerOrServiceConfigurationEndpoints = (
  issuer?: string,
  serviceConfiguration?: ServiceConfiguration
) =>
  invariant(
    typeof issuer === 'string' ||
      (serviceConfiguration &&
        typeof serviceConfiguration.authorizationEndpoint === 'string' &&
        typeof serviceConfiguration.tokenEndpoint === 'string'),
    'Config error: you must provide either an issuer or a service endpoints'
  );
const validateIssuerOrServiceConfigurationRevocationEndpoint = (
  issuer?: string,
  serviceConfiguration?: ServiceConfiguration
) =>
  invariant(
    typeof issuer === 'string' ||
      (serviceConfiguration &&
        typeof serviceConfiguration.revocationEndpoint === 'string'),
    'Config error: you must provide either an issuer or a revocation endpoint'
  );
const validateIssuerOrServiceConfigurationEndSessionEndpoint = (
  issuer?: string,
  serviceConfiguration?: ServiceConfiguration
) =>
  invariant(
    typeof issuer === 'string' ||
      (serviceConfiguration &&
        typeof serviceConfiguration.endSessionEndpoint === 'string'),
    'Config error: you must provide either an issuer or an end session endpoint'
  );
const validateClientId = (clientId?: string) =>
  invariant(
    typeof clientId === 'string',
    'Config error: clientId must be a string'
  );
const validateRedirectUrl = (redirectUrl?: string) =>
  invariant(
    typeof redirectUrl === 'string',
    'Config error: redirectUrl must be a string'
  );

const validateHeaders = (headers?: CustomHeaders) => {
  if (!headers) {
    return;
  }
  const customHeaderTypeErrorMessage =
    'Config error: customHeaders type must be { token?: { [key: string]: string }, authorize?: { [key: string]: string }, register: { [key: string]: string }}';

  const authorizedKeys = ['token', 'authorize', 'register'];
  const keys = Object.keys(headers);
  const correctKeys = keys.filter((key) => authorizedKeys.includes(key));
  invariant(
    keys.length <= authorizedKeys.length &&
      correctKeys.length > 0 &&
      correctKeys.length === keys.length,
    customHeaderTypeErrorMessage
  );

  Object.values(headers).forEach((value) => {
    invariant(typeof value === 'object', customHeaderTypeErrorMessage);
    invariant(
      Object.values(value).filter((key) => typeof key !== 'string').length ===
        0,
      customHeaderTypeErrorMessage
    );
  });
};

const validateAdditionalHeaders = (headers?: AdditionalHeaders) => {
  if (!headers) {
    return;
  }

  const errorMessage =
    'Config error: additionalHeaders must be { [key: string]: string }';

  invariant(typeof headers === 'object', errorMessage);
  invariant(
    Object.values(headers).filter((key) => typeof key !== 'string').length ===
      0,
    errorMessage
  );
};

const validateConnectionTimeoutSeconds = (timeout?: number) => {
  if (!timeout) {
    return;
  }

  invariant(
    typeof timeout === 'number',
    'Config error: connectionTimeoutSeconds must be a number'
  );
};

export const SECOND_IN_MS = 1000;
export const DEFAULT_TIMEOUT_IOS = 60;
export const DEFAULT_TIMEOUT_ANDROID = 15;

const convertTimeoutForPlatform = (
  platform: string,
  connectionTimeout = Platform.OS === 'ios'
    ? DEFAULT_TIMEOUT_IOS
    : DEFAULT_TIMEOUT_ANDROID
) =>
  platform === 'android' ? connectionTimeout * SECOND_IN_MS : connectionTimeout;

export const prefetchConfiguration = async ({
  warmAndPrefetchChrome = false,
  issuer,
  redirectUrl,
  clientId,
  scopes,
  serviceConfiguration,
  dangerouslyAllowInsecureHttpRequests = false,
  customHeaders,
  connectionTimeoutSeconds,
}: AuthConfiguration) => {
  if (Platform.OS === 'android') {
    validateIssuerOrServiceConfigurationEndpoints(issuer, serviceConfiguration);
    validateClientId(clientId);
    validateRedirectUrl(redirectUrl);
    validateHeaders(customHeaders);
    validateConnectionTimeoutSeconds(connectionTimeoutSeconds);

    const nativeMethodArguments = [
      warmAndPrefetchChrome,
      issuer,
      redirectUrl,
      clientId,
      scopes,
      serviceConfiguration,
      dangerouslyAllowInsecureHttpRequests,
      customHeaders,
      convertTimeoutForPlatform(Platform.OS, connectionTimeoutSeconds),
    ];

    StrivacityReactNative.prefetchConfiguration(...nativeMethodArguments);
  }
};

export const authorize = ({
  issuer,
  redirectUrl,
  clientId,
  clientSecret,
  scopes,
  useNonce = true,
  usePKCE = true,
  additionalParameters,
  serviceConfiguration,
  clientAuthMethod = 'none',
  dangerouslyAllowInsecureHttpRequests = false,
  customHeaders,
  additionalHeaders,
  skipCodeExchange = false,
  iosCustomBrowser = undefined,
  androidAllowCustomBrowsers = [],
  androidTrustedWebActivity = false,
  connectionTimeoutSeconds,
  iosPrefersEphemeralSession = false,
}: AuthConfiguration) => {
  validateIssuerOrServiceConfigurationEndpoints(issuer, serviceConfiguration);
  validateClientId(clientId);
  validateRedirectUrl(redirectUrl);
  validateHeaders(customHeaders);
  validateAdditionalHeaders(additionalHeaders);
  validateConnectionTimeoutSeconds(connectionTimeoutSeconds);

  const nativeMethodArguments: Array<any> = [
    issuer,
    redirectUrl,
    clientId,
    clientSecret,
    scopes,
    additionalParameters,
    serviceConfiguration,
    skipCodeExchange,
    convertTimeoutForPlatform(Platform.OS, connectionTimeoutSeconds),
  ];

  if (Platform.OS === 'android') {
    nativeMethodArguments.push(useNonce);
    nativeMethodArguments.push(usePKCE);
    nativeMethodArguments.push(clientAuthMethod);
    nativeMethodArguments.push(dangerouslyAllowInsecureHttpRequests);
    nativeMethodArguments.push(customHeaders);
    nativeMethodArguments.push(androidAllowCustomBrowsers);
    nativeMethodArguments.push(androidTrustedWebActivity);
  }

  if (Platform.OS === 'ios') {
    nativeMethodArguments.push(additionalHeaders);
    nativeMethodArguments.push(useNonce);
    nativeMethodArguments.push(usePKCE);
    nativeMethodArguments.push(iosCustomBrowser);
    nativeMethodArguments.push(iosPrefersEphemeralSession);
  }

  return StrivacityReactNative.authorize(...nativeMethodArguments);
};

export const refresh = (
  {
    issuer,
    redirectUrl,
    clientId,
    clientSecret,
    scopes,
    additionalParameters = {},
    serviceConfiguration,
    clientAuthMethod = 'none',
    dangerouslyAllowInsecureHttpRequests = false,
    customHeaders,
    additionalHeaders,
    iosCustomBrowser = undefined,
    androidAllowCustomBrowsers = [],
    connectionTimeoutSeconds,
  }: AuthConfiguration,
  { refreshToken }: RefreshConfiguration
) => {
  validateIssuerOrServiceConfigurationEndpoints(issuer, serviceConfiguration);
  validateClientId(clientId);
  validateRedirectUrl(redirectUrl);
  validateHeaders(customHeaders);
  validateAdditionalHeaders(additionalHeaders);
  validateConnectionTimeoutSeconds(connectionTimeoutSeconds);
  invariant(refreshToken, 'Please pass in a refresh token');
  // TODO: validateAdditionalParameters

  const nativeMethodArguments: Array<any> = [
    issuer,
    redirectUrl,
    clientId,
    clientSecret,
    refreshToken,
    scopes,
    additionalParameters,
    serviceConfiguration,
    convertTimeoutForPlatform(Platform.OS, connectionTimeoutSeconds),
  ];

  if (Platform.OS === 'android') {
    nativeMethodArguments.push(clientAuthMethod);
    nativeMethodArguments.push(dangerouslyAllowInsecureHttpRequests);
    nativeMethodArguments.push(customHeaders);
    nativeMethodArguments.push(androidAllowCustomBrowsers);
  }

  if (Platform.OS === 'ios') {
    nativeMethodArguments.push(additionalHeaders);
    nativeMethodArguments.push(iosCustomBrowser);
  }

  return StrivacityReactNative.refresh(...nativeMethodArguments);
};

export const revoke = async (
  {
    clientId,
    issuer,
    serviceConfiguration,
    clientSecret,
  }: BaseAuthConfiguration,
  {
    tokenToRevoke,
    sendClientId = false,
    includeBasicAuth = false,
  }: RevokeConfiguration
) => {
  invariant(tokenToRevoke, 'Please include the token to revoke');
  validateClientId(clientId);
  validateIssuerOrServiceConfigurationRevocationEndpoint(
    issuer,
    serviceConfiguration
  );

  let revocationEndpoint;
  if (serviceConfiguration && serviceConfiguration.revocationEndpoint) {
    revocationEndpoint = serviceConfiguration.revocationEndpoint;
  } else {
    const response = await fetch(`${issuer}/.well-known/openid-configuration`);
    const openidConfig = await response.json();

    invariant(
      openidConfig.revocation_endpoint,
      'The openid config does not specify a revocation endpoint'
    );

    revocationEndpoint = openidConfig.revocation_endpoint;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (includeBasicAuth) {
    headers.Authorization = `Basic ${base64.encode(`${clientId}:${clientSecret}`)}`;
  }
  /**
		Identity Server insists on client_id being passed in the body,
		but Google does not. According to the spec, Google is right
		so defaulting to no client_id
		https://tools.ietf.org/html/rfc7009#section-2.1
	**/
  return await fetch(revocationEndpoint, {
    method: 'POST',
    headers,
    body: `token=${tokenToRevoke}${sendClientId ? `&client_id=${clientId}` : ''}`,
  }).catch((error) => {
    throw new Error('Failed to revoke token', error);
  });
};

export const logout = (
  {
    issuer,
    serviceConfiguration,
    additionalParameters,
    dangerouslyAllowInsecureHttpRequests = false,
    iosCustomBrowser = undefined,
    iosPrefersEphemeralSession = false,
    androidAllowCustomBrowsers = [],
  }: EndSessionConfiguration,
  { idToken, postLogoutRedirectUrl }: LogoutConfiguration
) => {
  validateIssuerOrServiceConfigurationEndSessionEndpoint(
    issuer,
    serviceConfiguration
  );
  validateRedirectUrl(postLogoutRedirectUrl);
  invariant(idToken, 'Please pass in the ID token');

  const nativeMethodArguments: Array<any> = [
    issuer,
    idToken,
    postLogoutRedirectUrl,
    serviceConfiguration,
    additionalParameters,
  ];

  if (Platform.OS === 'android') {
    nativeMethodArguments.push(dangerouslyAllowInsecureHttpRequests);
    nativeMethodArguments.push(androidAllowCustomBrowsers);
  }

  if (Platform.OS === 'ios') {
    nativeMethodArguments.push(iosCustomBrowser);
    nativeMethodArguments.push(iosPrefersEphemeralSession);
  }

  return StrivacityReactNative.logout(...nativeMethodArguments);
};

export * from './types';
