// Configuration for Google Authentication

// Project specific client IDs from the google-services.json
export const WEB_CLIENT_ID = "965289265275-00crng1jcruvnq9cfk51ls30qs0tt4vt.apps.googleusercontent.com";

// Configuration for @react-native-google-signin/google-signin
// Only include parameters that are explicitly supported
export const GOOGLE_SIGNIN_CONFIG = {
  webClientId: WEB_CLIENT_ID,
  offlineAccess: true
};