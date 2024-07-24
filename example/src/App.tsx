import type { AuthConfiguration } from '../../src/types';
import { useState, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Button,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { authorize, refresh, revoke } from 'strivacity-react-native';

const config: AuthConfiguration = {
  issuer: '<YOUR_ISSUER_URL>',
  clientId: '<YOUR_CLIENT_ID>',
  redirectUrl: 'strivacityreactnative.example://callback',
  scopes: ['openid', 'profile'],
};

const defaultAuthState = {
  hasLoggedInOnce: false,
  idToken: '',
  accessToken: '',
  accessTokenExpirationDate: '',
  refreshToken: '',
  scopes: [],
};

export default function App() {
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState(defaultAuthState);

  const handleAuthorize = useCallback(async () => {
    try {
      setLoading(true);

      const newAuthState = await authorize({
        ...config,
        connectionTimeoutSeconds: 5,
        iosPrefersEphemeralSession: true,
      });

      setAuthState({
        hasLoggedInOnce: true,
        ...newAuthState,
      });
      setLoading(false);
    } catch (error: any) {
      Alert.alert('Failed to log in', error.message);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      const newAuthState = await refresh(config, {
        refreshToken: authState.refreshToken,
      });

      setAuthState((current) => ({
        ...current,
        ...newAuthState,
        refreshToken: newAuthState.refreshToken || current.refreshToken,
      }));
    } catch (error: any) {
      Alert.alert('Failed to refresh token', error.message);
    }
  }, [authState]);

  const handleRevoke = useCallback(async () => {
    try {
      await revoke(config, {
        tokenToRevoke: authState.accessToken,
        sendClientId: true,
      });

      setAuthState({
        hasLoggedInOnce: false,
        idToken: '',
        accessToken: '',
        accessTokenExpirationDate: '',
        refreshToken: '',
        scopes: [],
      });
    } catch (error: any) {
      Alert.alert('Failed to revoke token', error.message);
    }
  }, [authState]);

  const showRevoke = useMemo(() => {
    if (authState.accessToken) {
      if (config.issuer || config.serviceConfiguration?.revocationEndpoint) {
        return true;
      }
    }
    return false;
  }, [authState]);

  return (
    <SafeAreaView style={styles.view}>
      {loading ? (
        <View style={styles.container}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <View style={styles.container}>
          {authState.accessToken ? (
            <View style={styles.header}>
              <Text style={styles.formLabel}>accessToken</Text>
              <Text
                style={styles.formText}
                numberOfLines={10}
                ellipsizeMode="tail"
              >
                {authState.accessToken}
              </Text>
              <Text style={styles.formLabel}>accessTokenExpirationDate</Text>
              <Text
                style={styles.formText}
                numberOfLines={10}
                ellipsizeMode="tail"
              >
                {authState.accessTokenExpirationDate}
              </Text>
              <Text style={styles.formLabel}>refreshToken</Text>
              <Text
                style={styles.formText}
                numberOfLines={10}
                ellipsizeMode="tail"
              >
                {authState.refreshToken}
              </Text>
              <Text style={styles.formLabel}>scopes</Text>
              <Text
                style={styles.formText}
                numberOfLines={10}
                ellipsizeMode="tail"
              >
                {authState.scopes.join(', ')}
              </Text>
            </View>
          ) : (
            <View style={styles.header}>
              <Text style={styles.heading}>Welcome!</Text>
            </View>
          )}
          <View style={styles.buttons}>
            {!authState.accessToken ? (
              <Button onPress={handleAuthorize} title="Login" />
            ) : null}
            {authState.refreshToken ? (
              <Button onPress={handleRefresh} title="Refresh" />
            ) : null}
            {showRevoke ? (
              <Button onPress={handleRevoke} title="Revoke" />
            ) : null}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flex: 1,
    paddingVertical: 32,
    paddingHorizontal: 32,
  },
  buttons: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignSelf: 'flex-end',
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    marginVertical: 32,
    marginHorizontal: 16,
  },
  heading: {
    fontSize: 32,
    paddingBottom: 16,
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  formLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  formText: {
    fontSize: 14,
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
});
