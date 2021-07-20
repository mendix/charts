const debug = process.env.DEBUG;
const browserName = process.env.BROWSER || "firefox";
const url = process.env.URL || "http://localhost:8080/";
const tsNode = require('ts-node');
tsNode.register({
    files: true,
    project: "./tsconfig.json"
});

exports.config = {
    host: "127.0.0.1",
    port: 4444,
    specs: ["./dist/e2e/**/*.spec.js"],
    maxInstances: 1,
    capabilities: [
        {
            browserName,
            ...(!process.env.CI
                ? {
                    "moz:firefoxOptions": {
                        prefs: { "media.navigator.streams.fake": true, "media.navigator.permission.disabled": true }
                    }
                }
                : {})
        }
    ],
    sync: true,
    logLevel: "silent",
    coloredLogs: true,
    bail: 0,
    screenshotPath: "dist/wdio/",
    baseUrl: url,
    waitForTimeout: 30000,
    connectionRetryTimeout: 90000,
    connectionRetryCount: 0,
    killInstances: true,
    services: ["selenium-standalone"],
    framework: "jasmine",
    reporters: ["spec"],
    execArgv: debug ? ["--inspect"] : undefined,
    jasmineNodeOpts: {
        // Required for Typescript
        requires: ["tsconfig-paths/register"],
        defaultTimeoutInterval: debug ? 60 * 60 * 1000 : 100 * 1000,
        expectationResultHandler: function (passed, assertion) {
            if (passed) {
                return;
            }
            browser.saveScreenshot(
                "dist/wdio/assertionError_" + assertion.error.message + ".png"
            );
        },
    },
};
