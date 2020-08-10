const debug = process.env.DEBUG;
const browser = process.env.BROWSER || "firefox";

exports.config = {
    host: "127.0.0.1",
    port: 4444,
    specs: ["./dist/e2e/**/*.spec.js"],
    maxInstances: 1,
    capabilities: [
        {
            browserName: "chrome",
            "goog:chromeOptions": {
                args: debug
                    ? []
                    : [
                          "--no-sandbox",
                          "--headless",
                          "--disable-gpu",
                          "--disable-extensions",
                      ],
            },
        },
    ],
    sync: true,
    logLevel: "silent",
    coloredLogs: true,
    bail: 0,
    screenshotPath: "dist/wdio/",
    baseUrl: debug
        ? "http://localhost:8080/"
        : "https://charts102-sandbox.mxapps.io/",
    waitforTimeout: 180000,
    connectionRetryTimeout: 200000,
    connectionRetryCount: 2,
    killInstances: true,
    services: ["selenium-standalone"],
    framework: "jasmine",
    reporters: ["dot", "spec"],
    execArgv: debug ? ["--inspect"] : undefined,
    jasmineNodeOpts: {
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
