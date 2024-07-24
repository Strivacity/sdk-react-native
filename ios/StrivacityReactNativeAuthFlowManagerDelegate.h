#import <Foundation/Foundation.h>

@protocol StrivacityReactNativeAuthFlowManagerDelegate <NSObject>
@required
-(BOOL)resumeExternalUserAgentFlowWithURL:(NSURL *)url;
@end
