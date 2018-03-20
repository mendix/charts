const debug = process.env.DEBUG;
const multiclient = process.env.MULTCLIENT;

exports.config = {
    host: "127.0.0.1",
    port: 4444,
    specs: [ "./dist/e2e/**/*.spec.js" ],
    maxInstances: debug ? 1 : 5,
    capabilities: multiclient
        ? [
            { browserName: "chrome" },
            { browserName: "firefox", marionette: true },
            { browserName: "internet explorer", ignoreProtectedModeSettings: true, ignoreZoomSetting: true },
            { browserName: "MicrosoftEdge", elementScrollBehavior: 1, nativeEvents: false }
        ]
        : [{ maxInstances: debug ? 1 : 5, browserName: "chrome" }],
    sync: true,
    logLevel: "silent",
    coloredLogs: true,
    bail: 0,
    screenshotPath: "dist/wdio/",
    baseUrl: debug ? "http://localhost:8080/" : "https://charts102.mxapps.io/",
    waitforTimeout: 180000,
    connectionRetryTimeout: 200000,
    connectionRetryCount: 2,
    killInstances: true,
    services:  multiclient ? [ "iedriver", "selenium-standalone" ] : ["selenium-standalone" ],
    seleniumArgs: multiclient ? {
        javaArgs: [
            "-Dwebdriver.edge.driver=C:\\Selenium\\EdgeDriver\\MicrosoftWebDriver.exe"
        ]
    }
    : {},
    framework: "jasmine",
    reporters: [ "dot", "spec" ],
    execArgv: debug ? [ "--inspect" ] : undefined,
    jasmineNodeOpts: {
        defaultTimeoutInterval: debug ? (60 * 60 * 1000) : (100 * 1000),
        expectationResultHandler: function(passed, assertion) {
            if (passed) {
                return;
            }
            browser.saveScreenshot(
                "dist/wdio/assertionError_" + assertion.error.message + ".png"
            );
        }
    }
};
