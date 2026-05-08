import Constants from "expo-constants";

type AppVersionInfo = {
  version: string | null;
  build: string | null;
};

function readExpoVersion(): string | null {
  return (
    Constants.expoConfig?.version ??
    // Older / alternate runtime shapes
    (Constants as any).manifest?.version ??
    (Constants as any).manifest2?.extra?.expoClient?.version ??
    null
  );
}

function readBuildNumber(): string | null {
  const iosBuild =
    Constants.expoConfig?.ios?.buildNumber ??
    (Constants as any).manifest?.ios?.buildNumber ??
    null;

  const androidBuild =
    (Constants.expoConfig?.android?.versionCode != null
      ? String(Constants.expoConfig.android.versionCode)
      : null) ??
    ((Constants as any).manifest?.android?.versionCode != null
      ? String((Constants as any).manifest.android.versionCode)
      : null) ??
    null;

  return iosBuild ?? androidBuild;
}

export function getAppVersionInfo(): AppVersionInfo {
  return {
    version: readExpoVersion(),
    build: readBuildNumber(),
  };
}

export function getAppVersionLabel(): string {
  const { version, build } = getAppVersionInfo();
  if (version && build) return `${version} (${build})`;
  return version ?? build ?? "—";
}

