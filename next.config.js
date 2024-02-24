/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

import CopyPlugin from "copy-webpack-plugin";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  webpack: (config, {}) => {
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: "./node_modules/onnxruntime-web/dist/ort-wasm.wasm",
            to: "static/chunks",
          },
          {
            from: "./node_modules/onnxruntime-web/dist/ort-wasm-simd.wasm",
            to: "static/chunks",
          },
        ],
      }),
    );
    return config;
  },
  // webpack: (config, {}) => {
  //   config.resolve.extensions.push(".ts", ".tsx");
  //   config.resolve.fallback = { fs: false };

  //   config.plugins.push(
  //     new NodePolyfillPlugin(),
  //     new CopyPlugin({
  //       patterns: [
  //         {
  //           from: "./node_modules/onnxruntime-web/dist/ort-wasm.wasm",
  //           to: "static/chunks/pages",
  //         },
  //         {
  //           from: "./node_modules/onnxruntime-web/dist/ort-wasm-simd.wasm",
  //           to: "static/chunks/pages",
  //         },
  //         {
  //           from: "./model",
  //           to: "static/chunks/pages",
  //         },
  //       ],
  //     }),
  //   );

  //   return config;
  // },
};

export default config;
