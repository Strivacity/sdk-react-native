#import <Foundation/Foundation.h>
#import "StrivacityReactNativeAuthFlowManagerDelegate.h"

@protocol StrivacityReactNativeAuthFlowManager <NSObject>
@required
@property(nonatomic, weak)id<StrivacityReactNativeAuthFlowManagerDelegate>authorizationFlowManagerDelegate;
@end
