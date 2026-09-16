import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "repeaterbook.userToken";
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: "pointmyyagi.repeaterbook",
};

/** Read the user's stored RepeaterBook app-bound token, or null if none. */
export async function getRepeaterBookToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY, OPTIONS);
  } catch {
    return null;
  }
}

/** Store the user's RepeaterBook app-bound token in the device keychain. */
export async function setRepeaterBookToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token, OPTIONS);
}

/** Remove the stored RepeaterBook token (logout / delete credentials). */
export async function clearRepeaterBookToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY, OPTIONS);
}
