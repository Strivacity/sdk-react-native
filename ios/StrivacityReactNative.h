#ifdef RCT_NEW_ARCH_ENABLED
#import "RNStrivacityReactNativeSpec.h"

@interface StrivacityReactNative : NSObject <NativeStrivacityReactNativeSpec>
#else
#import <React/RCTBridgeModule.h>

@interface StrivacityReactNative : NSObject <RCTBridgeModule>
#endif

@end
