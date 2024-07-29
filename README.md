![React Native mobile SDK](https://static.strivacity.com/images/react-native-mobile-sdk.png)

[![npm package version](https://badge.fury.io/js/strivacity-react-native.svg)](https://badge.fury.io/js/strivacity-react-native) This versions supports `react-native@0.63+`

This SDK allows you to integrate Strivacity’s policy-driven journeys into your brand’s React Native mobile application. The SDK uses the OAuth 2.0 PKCE flow authenticate with Strivacity.

See our [Developer Portal](https://www.strivacity.com/learn-support/developer-hub) to get started with developing with the Strivacity product.

# How to include in your project

Get started by installing the dependencies in your application

```sh
yarn add strivacity-react-native
# or
npm install strivacity-react-native --save
```

## Usage

> [!WARNING]
> This SDK is not compatible with "Expo Go" app. It is compatible only with Custom Dev Client and EAS builds.
> Follow [this guide](https://docs.expo.dev/modules/get-started/#creating-the-local-expo-module) to generate native project directories.

```jsx
import { authorize } from 'strivacity-react-native';

// base config
const config = {
  issuer: '<YOUR_ISSUER_URL>', // Example: https://yourdomain.strivacity.com
  clientId: '<YOUR_CLIENT_ID>', // Your application Client ID
  redirectUrl: '<YOUR_REDIRECT_URL>', // Example: com.myapp://auth
  scopes: ['<YOUR_SCOPE_ARRAY>'], // Example: ['openid']
};

// use the client to make the auth request and receive the authState
try {
  // result includes accessToken, accessTokenExpirationDate and refreshToken
  const result = await authorize(config);
} catch (error) {
  console.log(error);
}
```

## iOS Setup

To setup the iOS project, you need to perform three steps:

### Install native dependencies

This library depends on the native AppAuth-ios project. To keep the React Native library agnostic of your dependency management method, the native libraries are not distributed as part of the bridge.

AppAuth supports three options for dependency management.

#### CocoaPods

```sh
cd ios
pod install
```

#### Carthage

With [Carthage](https://github.com/Carthage/Carthage), add the following line to your Cartfile:

```
github "openid/AppAuth-iOS" "master"
```

Then run `carthage update --platform iOS`.

Drag and drop `AppAuth.framework` from `ios/Carthage/Build/iOS` under `Frameworks` in `Xcode`.

Add a copy files build step for `AppAuth.framework`: open Build Phases on Xcode, add a new "Copy Files" phase, choose "Frameworks" as destination, add `AppAuth.framework` and ensure "Code Sign on Copy" is checked.

#### Static Library

You can also use [AppAuth-iOS](https://github.com/openid/AppAuth-iOS) as a static library. This requires linking the library and your project and including the headers. Suggested configuration:

1. Create an XCode Workspace.
2. Add `AppAuth.xcodeproj` to your Workspace.
3. Include libAppAuth as a linked library for your target (in the "General -> Linked Framework and Libraries" section of your target).
4. Add `AppAuth-iOS/Source` to your search paths of your target ("Build Settings -> "Header Search Paths").

### Register redirect URL scheme

If you intend to support iOS 10 and older, you need to define the supported redirect URL schemes in your Info.plist as follows:

```
<key>CFBundleURLTypes</key>
<array>
	<dict>
		<key>CFBundleURLName</key>
		<string>com.your.app.identifier</string>
		<key>CFBundleURLSchemes</key>
		<array>
			<string>io.identityserver.demo</string>
		</array>
	</dict>
</array>
```

`CFBundleURLName` is any globally unique string. A common practice is to use your app identifier.
`CFBundleURLSchemes` is an array of URL schemes your app needs to handle. The scheme is the beginning of your OAuth Redirect URL, up to the scheme separator (`:`) character. E.g. if your redirect uri is `com.myapp://oauth`, then the url scheme will is `com.myapp`.

### Define openURL callback in AppDelegate

You need to retain the auth session, in order to continue the authorization flow from the redirect. Follow these steps:

`StrivacityReactNative` will call on the given app's delegate via `[UIApplication sharedApplication].delegate`. Furthermore, StrivacityReactNative expects the delegate instance to conform to the protocol `StrivacityReactNativeAuthFlowManager`. Make `AppDelegate` conform to `StrivacityReactNativeAuthFlowManager` with the following changes to `AppDelegate.h`:

#### For Expo custom dev client or EAS build

```
+ #import <StrivacityReactNativeAuthFlowManager.h>

- @interface AppDelegate : EXAppDelegateWrapper
+ @interface AppDelegate : EXAppDelegateWrapper <StrivacityReactNativeAuthFlowManager>

+ @property(nonatomic, weak) id<StrivacityReactNativeAuthFlowManagerDelegate> authorizationFlowManagerDelegate;

@end
```

Add the following code to `AppDelegate.mm` to support React Navigation deep linking and overriding browser behavior in the authorization process

```
// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
+  if ([self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:url]) {
+     return YES;
+ }
  return [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];
}
```

If you want to support universal links, add the following to `AppDelegate.mm` under `continueUserActivity`

```
// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
+  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
+      if (self.authorizationFlowManagerDelegate) {
+        BOOL resumableAuth = [self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:userActivity.webpageURL];
+        if (resumableAuth) {
+          return YES;
+        }
+      }
+  }

  BOOL result = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return [super application:application continueUserActivity:userActivity restorationHandler:restorationHandler] || result;
}
```

#### For react-native >= 0.68

```
+ #import <React/RCTLinkingManager.h>
+ #import "StrivacityReactNativeAuthFlowManager.h"

- @interface AppDelegate : RCTAppDelegate
+ @interface AppDelegate : RCTAppDelegate <StrivacityReactNativeAuthFlowManager>

+ @property(nonatomic, weak) id<StrivacityReactNativeAuthFlowManagerDelegate> authorizationFlowManagerDelegate;
```

Add the following code to `AppDelegate.mm` to support React Navigation deep linking and overriding browser behavior in the authorization process

```
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
  if ([self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:url]) {
      return YES;
  }

  return [RCTLinkingManager application:application openURL:url options:options];
}
```

If you want to support universal links, add the following to `AppDelegate.mm` under `continueUserActivity`

```
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
{
  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
      if (self.authorizationFlowManagerDelegate) {
        BOOL resumableAuth = [self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:userActivity.webpageURL];
        if (resumableAuth) {
          return YES;
        }
      }
  }

  return [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
}
```

#### For react-native \< 0.68

```
+ #import "StrivacityReactNativeAuthFlowManager.h"

- @interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>
+ @interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate, StrivacityReactNativeAuthFlowManager>

+ @property(nonatomic, weak)id<StrivacityReactNativeAuthFlowManagerDelegate>authorizationFlowManagerDelegate;
```

Add the following code to `AppDelegate.m` (to support iOS 10, React Navigation deep linking and overriding browser behavior in the authorization process)

```
- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<NSString *, id> *) options {
	if ([self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:url]) {
		return YES;
	}

	return [RCTLinkingManager application:app openURL:url options:options];
}
```

If you want to support universal links, add the following to `AppDelegate.m` under `continueUserActivity`

```
if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
	if (self.authorizationFlowManagerDelegate) {
			BOOL resumableAuth = [self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:userActivity.webpageURL];
			if (resumableAuth) {
				return YES;
			}
	}
}
```

### Integration of the library with a Swift iOS project

The approach mentioned should work with Swift. In this case one should make `AppDelegate` conform to `StrivacityReactNativeAuthFlowManager`. Note that this is not tested/guaranteed by the maintainers.

Steps:

1. `swift-Bridging-Header.h` should include a reference to `#import "StrivacityReactNativeAuthFlowManager.h`, like so:

```
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTBridgeDelegate.h>
#import <React/RCTBridge.h>
#import "StrivacityReactNativeAuthFlowManager.h" // <-- Add this header
#if DEBUG
#import <FlipperKit/FlipperClient.h>
// etc...
```

2. `AppDelegate.swift` should implement the `StrivacityReactNativeAuthFlowManager` protocol and have a handler for url deep linking. The result should look something like this:

```
@UIApplicationMain
class AppDelegate: UIApplicationDelegate, StrivacityReactNativeAuthFlowManager { //<-- note the additional StrivacityReactNativeAuthFlowManager protocol
	public weak var authorizationFlowManagerDelegate: StrivacityReactNativeAuthFlowManagerDelegate? // <-- this property is required by the protocol
	//"open url" delegate function for managing deep linking needs to call the resumeExternalUserAgentFlowWithURL method
	func application(
		_ app: UIApplication,
		open url: URL,
		options: [UIApplicationOpenURLOptionsKey: Any] = [:]) -> Bool {
		return authorizationFlowManagerDelegate?.resumeExternalUserAgentFlow(with: url) ?? false
}
   }
```

## Android Setup

To setup the Android project, you need to add redirect scheme manifest placeholder:

To [capture the authorization redirect](https://github.com/openid/AppAuth-android#capturing-the-authorization-redirect), add the following property to the defaultConfig in `android/app/build.gradle`:

```
android {
  defaultConfig {
    manifestPlaceholders = [
      appAuthRedirectScheme: 'com.myapp'
    ]
  }
}
```

The scheme is the beginning of your OAuth Redirect URL, up to the scheme separator (`:`) character. E.g. if your redirect uri is `com.myapp://oauth`, then the url scheme will is `com.myapp`. The scheme must be in lowercase.

### Notes

When integrating with [React Navigation deep linking](https://reactnavigation.org/docs/deep-linking/#set-up-with-bare-react-native-projects), be sure to make this scheme (and the scheme in the config's redirectUrl) unique from the scheme defined in the deep linking intent-filter. E.g. if the scheme in your intent-filter is set to com.myapp, then update the above scheme/redirectUrl to be com.myapp

## Token Storage

Once the user has successfully authenticated, you'll have a JWT and possibly a refresh token that should be stored securely.

❗️ **Do not use Async Storage for storing sensitive information**

Async Storage is the simplest method of persisting data across application launches in React Native. However, it is an unencrypted key-value store and should therefore not be used for token storage.

✅ **DO use Secure Storage**

React Native does not come bundled with any way of storing sensitive data, so it is necessary to rely on the underlying platform-specific solutions.

### iOS - Keychain Services

Keychain Services allows you to securely store small chunks of sensitive info for the user. This is an ideal place to store certificates, tokens, passwords, and any other sensitive information that doesn’t belong in Async Storage.

### Android - Secure Shared Preferences

Shared Preferences is the Android equivalent for a persistent key-value data store. Data in Shared Preferences is not encrypted by default. Encrypted Shared Preferences wraps the Shared Preferences class for Android, and automatically encrypts keys and values.

In order to use iOS's Keychain services or Android's Secure Shared Preferences, you either can write a JS \< - > native interface yourself or use a library which wraps them for you. Some even provide a unified API.

Related OSS libraries

- [react-native-keychain](https://github.com/oblador/react-native-keychain) - we've had good experiences using this on projects
- [react-native-sensitive-info](https://github.com/mCodex/react-native-sensitive-info) - secure for iOS, but uses Android Shared Preferences for Android (which is not secure). There is however a fork that uses [Android Keystore](https://github.com/mCodex/react-native-sensitive-info/tree/keystore) which is secure
- [redux-persist-sensitive-storage](https://github.com/CodingZeal/redux-persist-sensitive-storage) - wraps `react-native-sensitive-info`, see comments above
- [rn-secure-storage](https://github.com/talut/rn-secure-storage)
- [expo-secure-store](https://github.com/expo/expo/tree/master/packages/expo-secure-store) - secure for iOS by using keychain services, secure for Android by using values in SharedPreferences encrypted with Android's Keystore system. This Expo library can be used in "Managed" and "Bare" workflow apps, but note that when using this Expo library with React Native App Auth, only the bare workflow is supported.

## Contributing

Please see our [contributing guide](./CONTRIBUTING.md).
