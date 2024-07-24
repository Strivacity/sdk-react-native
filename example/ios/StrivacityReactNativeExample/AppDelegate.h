#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import <StrivacityReactNativeAuthFlowManager.h>

@interface AppDelegate : RCTAppDelegate <StrivacityReactNativeAuthFlowManager>

@property(nonatomic, weak) id<StrivacityReactNativeAuthFlowManagerDelegate> authorizationFlowManagerDelegate;

@end
