import axios from 'axios';
import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

const DEFAULT_PORT = '5000';
const EXPO_TUNNEL_HOST_PATTERNS = ['.expo.dev', '.exp.direct', '.exp.host'];

const sanitizeApiUrl = (url: string) => url.trim().replace(/\/$/, '');

const extractHost = (hostUri?: string | null) => {
  if (!hostUri) return null;

  const withoutProtocol = hostUri.replace(/^https?:\/\//, '');
  const hostPart = withoutProtocol.split('/')[0]?.split(':')[0] ?? null;
  return hostPart?.trim() || null;
};

const isLikelyTunnelHost = (host: string) =>
  EXPO_TUNNEL_HOST_PATTERNS.some((pattern) => host.toLowerCase().includes(pattern));

const buildApiUrl = (host: string, port = DEFAULT_PORT) => `http://${host}:${port}/api`;

const getExpoHostCandidates = () => {
  const expoConfigHost = extractHost(Constants.expoConfig?.hostUri as string | undefined);

  const manifestHost = extractHost(
    (Constants.manifest as { debuggerHost?: string } | null | undefined)?.debuggerHost
  );

  const manifest2Host = extractHost(
    (
      Constants.manifest2 as
        | {
            extra?: {
              expoClient?: {
                hostUri?: string;
              };
            };
          }
        | null
        | undefined
    )?.extra?.expoClient?.hostUri
  );

  const scriptHost = extractHost(
    (
      NativeModules.SourceCode as
        | {
            scriptURL?: string;
          }
        | undefined
    )?.scriptURL
  );

  return [expoConfigHost, manifestHost, manifest2Host, scriptHost].filter(
    (host): host is string => !!host
  );
};

const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    const sanitized = sanitizeApiUrl(envUrl);
    console.log('[api] Using API URL from EXPO_PUBLIC_API_URL:', sanitized);
    return sanitized;
  }

  if (Platform.OS === 'web') {
    return buildApiUrl('localhost');
  }

  const hostCandidates = getExpoHostCandidates();
  const lanHost = hostCandidates.find((host) => !isLikelyTunnelHost(host));

  if (lanHost) {
    const detected = buildApiUrl(lanHost);
    console.log('[api] Auto-detected local API URL:', detected);
    return detected;
  }

  if (Platform.OS === 'android') {
    return buildApiUrl('10.0.2.2');
  }

  return buildApiUrl('localhost');
};

export const API_URL = getApiUrl();
axios.defaults.timeout = 20000;
console.log('[api] Resolved API_URL:', API_URL);
