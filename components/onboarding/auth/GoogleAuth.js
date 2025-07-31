import * as Google from "expo-auth-session/providers/google";
import { useEffect } from "react";
import { auth } from "../../../firebase";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth(onSuccess, onError) {
  const redirectUri = AuthSession.makeRedirectUri({
    native: "com.yourcompany.rapiddelivery:/oauthredirect",
    useProxy: false, // Important: false for EAS build
  });
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:
      "794305130358-6632tr8s3hln6qcfus85cj99vqhbm0h5.apps.googleusercontent.com",
    androidClientId:
      "794305130358-tvso5psqv9cl0tk3pd52obqk040n239i.apps.googleusercontent.com",
    redirectUri,
    webClientId:
      "794305130358-6632tr8s3hln6qcfus85cj99vqhbm0h5.apps.googleusercontent.com",
  });

  console.log("Redirect URI:", redirectUri);

  useEffect(() => {
    if (response?.type === "success") {
      const { idToken, accessToken } = response.authentication || {};
  
      if (!idToken) {
        console.error("❌ Google Auth: Missing idToken");
        onError(new Error("Missing ID token from Google authentication"));
        return;
      }
  
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
  
      signInWithCredential(auth, credential)
        .then(onSuccess)
        .catch(onError);
    }
    console.log("Google Auth response:", response);
  }, [response]);
  

  return { request, promptAsync };
}
