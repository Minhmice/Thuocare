const fs = require("fs");
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);
const defaultWatchFolders = config.watchFolders ?? [projectRoot];
config.watchFolders = [...new Set([...defaultWatchFolders, monorepoRoot])];

// pnpm workspace packages are symlinked under node_modules/@thuocare/*; Metro's
// resolver can fail to treat those as resolvable package roots. Map each linked
// workspace dep to its real path so imports like @thuocare/personal always resolve.
const appPkg = require("./package.json");
const extraNodeModules = { ...(config.resolver.extraNodeModules ?? {}) };
for (const name of Object.keys(appPkg.dependencies ?? {})) {
  if (!name.startsWith("@thuocare/")) continue;
  const linked = path.join(projectRoot, "node_modules", name);
  try {
    extraNodeModules[name] = fs.realpathSync(linked);
  } catch {
    // Missing install / broken link — leave unset so Metro surfaces the usual error.
  }
}
config.resolver.extraNodeModules = extraNodeModules;

module.exports = withNativewind(config, { inlineVariables: false });
