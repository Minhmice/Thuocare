/**
 * Monorepo root Expo config: the real app lives in `apps/mobile`.
 * EAS CLI and `expo install` run from the repo root and read this file.
 * Asset paths from the mobile app are relative to `apps/mobile` — resolve them here.
 *
 * expo-router `root` in the mobile app is `./src/app` (relative to apps/mobile). When this
 * file is evaluated from the repo root, rewrite it to `apps/mobile/src/app` so router resolves.
 *
 * For day-to-day dev server, prefer: `pnpm dev:mobile` (correct package.json `main`).
 */
const path = require("path");

const mobileRoot = path.join(__dirname, "apps", "mobile");
const getMobileExpoConfig = require(path.join(mobileRoot, "app.config.js"));

const ROUTER_ROOT_FROM_REPO = "apps/mobile/src/app";

function rewriteExpoRouterRoot(plugins) {
  if (!Array.isArray(plugins)) return plugins;
  return plugins.map((p) => {
    if (Array.isArray(p) && p[0] === "expo-router") {
      const opts = typeof p[1] === "object" && p[1] !== null ? { ...p[1] } : {};
      opts.root = ROUTER_ROOT_FROM_REPO;
      return ["expo-router", opts];
    }
    return p;
  });
}

function fromMobile(rel) {
  if (rel == null || typeof rel !== "string") return rel;
  return path.resolve(mobileRoot, rel);
}

const base = getMobileExpoConfig();
const adaptive = base.android?.adaptiveIcon;

module.exports = {
  expo: {
    ...base,
    plugins: rewriteExpoRouterRoot(base.plugins),
    icon: fromMobile(base.icon),
    splash: {
      ...base.splash,
      image: fromMobile(base.splash?.image),
    },
    android: {
      ...base.android,
      adaptiveIcon: adaptive
        ? {
            ...adaptive,
            foregroundImage: fromMobile(adaptive.foregroundImage),
            backgroundImage: fromMobile(adaptive.backgroundImage),
            monochromeImage: fromMobile(adaptive.monochromeImage),
          }
        : base.android?.adaptiveIcon,
    },
    web: {
      ...base.web,
      favicon: fromMobile(base.web?.favicon),
    },
  },
};
