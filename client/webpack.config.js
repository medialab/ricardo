"use strict";

// Modules
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

/**
 * Env
 * Get npm lifecycle event to identify the environment
 */
var ENV = process.env.npm_lifecycle_event;
var isTest = ENV === "test" || ENV === "test-watch";
var isProd = ENV === "build";

module.exports = (function makeWebpackConfig() {
  /**
   * Config
   * Reference: http://webpack.github.io/docs/configuration.html
   * This is the object where all configuration gets set
   */
  var config = {};

  /**
   * Entry
   * Reference: http://webpack.github.io/docs/configuration.html#entry
   * Should be an empty object if it's generating a test build
   * Karma will set this when it's a test build
   */
  config.entry = {
    app: "./src/js/app.js",
  };

  /**
   * Output
   * Reference: http://webpack.github.io/docs/configuration.html#output
   * Should be an empty object if it's generating a test build
   * Karma will handle setting it up for you when it's a test build
   */
  config.output = isTest
    ? {}
    : {
        // Absolute output directory
        path: __dirname + "/build",

        // Output path from the view of the page
        // Uses webpack-dev-server in development
        publicPath: "/",

        // Filename for entry points
        // Only adds hash in build mode
        filename: isProd ? "[name].[hash].js" : "[name].bundle.js",

        // Filename for non-entry points
        // Only adds hash in build mode
        chunkFilename: isProd ? "[name].[hash].js" : "[name].bundle.js",
      };

  /**
   * Devtool
   * Reference: http://webpack.github.io/docs/configuration.html#devtool
   * Type of sourcemap to use per build type
   */
  if (isTest) {
    config.devtool = "inline-source-map";
  } else if (isProd) {
    config.devtool = "source-map";
  } else {
    config.devtool = "eval-source-map";
  }

  /**
   * Loaders
   * Reference: http://webpack.github.io/docs/configuration.html#module-loaders
   * List: http://webpack.github.io/docs/list-of-loaders.html
   * This handles most of the magic responsible for converting modules
   */

  // Initialize module
  config.module = {
    rules: [
      {
        // JS LOADER
        // Reference: https://github.com/babel/babel-loader
        // Transpile .js files using babel-loader
        // Compiles ES6 and ES7 into ES5 code
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/,
      },
      {
        // CSS LOADER
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        // ASSET LOADER
        // Reference: https://github.com/webpack/file-loader
        // Copy png, jpg, jpeg, gif, svg, woff, woff2, ttf, eot files to output
        // Rename the file using the asset hash
        // Pass along the updated reference to your code
        // You can add here any file extension you want to get copied to your output
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
        loader: "file-loader",
      },
      {
        // HTML LOADER
        // Reference: https://github.com/webpack/raw-loader
        // Allow loading html through js
        test: /\.html$/,
        loader: "raw-loader",
      },
    ],
  };

  /**
   * PostCSS
   * Reference: https://github.com/postcss/autoprefixer-core
   * Add vendor prefixes to your css
   */
  // NOTE: This is now handled in the `postcss.config.js`
  //       webpack2 has some issues, making the config file necessary

  /**
   * Plugins
   * Reference: http://webpack.github.io/docs/configuration.html#plugins
   * List: http://webpack.github.io/docs/list-of-plugins.html
   */
  config.plugins = [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin(),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery",
      sigma: "sigma",
    }),
    new webpack.DefinePlugin({
      BASE_API_URL: JSON.stringify(process.env.API_URL || "http://localhost:5000"),
    }),
  ];

  config.optimization = {
    runtimeChunk: {
      name: function (entrypoint) {
        return `runtimechunk~${entrypoint.name}`;
      },
    },
    minimize: false,
  };

  // Skip rendering index.html in test mode
  if (!isTest) {
    // Reference: https://github.com/ampedandwired/html-webpack-plugin
    // Render index.html
    config.plugins.push(
      new HtmlWebpackPlugin({
        template: "./src/index.html",
        inject: "body",
      }),

      // Reference: https://github.com/webpack/extract-text-webpack-plugin
      // Extract css files
      // Disabled when in test mode or not in build mode
      new MiniCssExtractPlugin({
        allChunks: true,
      }),
    );
  }

  // Add build specific plugins
  if (isProd) {
    config.plugins.push(
      // Reference: http://webpack.github.io/docs/list-of-plugins.html#noerrorsplugin
      // Only emit files when there are no errors
      new webpack.NoEmitOnErrorsPlugin(),

      // Copy assets from the public folder
      // Reference: https://github.com/kevlened/copy-webpack-plugin
      new CopyWebpackPlugin({
        patterns: [{ from: __dirname + "/src/public", to: "." }],
      }),
    );
    config.optimization = {
      minimize: true,
    };
  }

  /**
   * Dev server configuration
   * Reference: http://webpack.github.io/docs/configuration.html#devserver
   * Reference: http://webpack.github.io/docs/webpack-dev-server.html
   */
  config.devServer = {
    contentBase: "./src/public",
    stats: "minimal",
    host: "0.0.0.0",
    compress: true,
    disableHostCheck: true,
  };

  return config;
})();
