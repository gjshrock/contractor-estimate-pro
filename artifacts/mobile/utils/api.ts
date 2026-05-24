import Constants from "expo-constants";

export function getApiBase(): string {
  const linkingUri = Constants.linkingUri ?? "";
  const match = linkingUri.match(/^exp:\/\/([^/]+)/);
  if (match) {
    return `https://${match[1]}`;
  }
  return (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? "";
}
