const debug = process.env.DEBUG;

exports.config = {
    host: "127.0.0.1",
    port: 4444,
    specs: [ "./dist/e2e/**/*.spec.js" ],
    maxInstances: debug ? 1 : 5,
    capabilities: [
        { browserName: "chrome" },
        { browserName: "firefox", marionette: true },
        // { 
        //     browserName: "internet explorer",
        //     "ignoreZoomSetting": true,
        //     "ignoreProtectedModeSettings": true
        // },
        // { browserName: "MicrosoftEdge" }
    ],
    sync: true,
    logLevel: "silent",
    coloredLogs: true,
    bail: 0,
    screenshotPath: "dist/wdio/",
    baseUrl: debug ? "http://localhost:8080/" : "https://charts102.mxapps.io/",
    waitforTimeout: 180000,
    connectionRetryTimeout: 200000,
    connectionRetryCount: 2,
    services: [ /*"iedriver", */"selenium-standalone" ],
    // seleniumArgs: {
    //     javaArgs: [
    //         "-Dwebdriver.edge.driver=C:\\Program Files (x86)\\Microsoft Web Driver\\MicrosoftWebDriver.exe"
    //     ]
    // },
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
