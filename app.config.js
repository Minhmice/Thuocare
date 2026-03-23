/**
 * Monorepo root Expo config: the real app lives in `apps/mobile`.
 * EAS CLI and `expo install` run from the repo root and read this file.
 * Asset paths in `apps/mobile/app.json` are relative to that folder — resolve them here.
 *
 * For day-to-day dev server, still prefer: `pnpm dev:mobile` (correct package.json `main`).
 */
const path = require("path");

const mobileRoot = path.join(__dirname, "apps", "mobile");
const { expo: base } = require(path.join(mobileRoot, "app.json"));

function fromMobile(rel) {
  if (rel == null || typeof rel !== "string") return rel;
  return path.resolve(mobileRoot, rel);
}

const adaptive = base.android?.adaptiveIcon;

module.exports = {
  expo: {
    ...base,
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
