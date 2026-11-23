import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export const GOOGLE_FORMS_SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
] as const;

const provider = new GoogleAuthProvider();
for (const scope of GOOGLE_FORMS_SCOPES) {
  provider.addScope(scope);
}
provider.setCustomParameters({
  prompt: 'consent',
});

let isSigningIn = false;
// Strictly in-memory OAuth access token (never stored in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;

export const initFormsAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthUnavailable?: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthUnavailable?.(user);
      }
    } else {
      cachedAccessToken = null;
      onAuthUnavailable?.(null);
    }
  });
};

export const signInWithGoogleForms = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve Google Forms access token from sign-in.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getFormsAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const clearFormsAccessToken = () => {
  cachedAccessToken = null;
};

export const signOutGoogleForms = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
