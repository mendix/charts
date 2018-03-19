# Multiple browser end-to-end test

## Setup options

### Internet Explorer

Add `wdio-iedriver-service` as a devDependency using`npm`.
You can simply do it by:

```bash
npm install wdio-iedriver-service --save-dev
```
```json
{
    "devDependencies": {
        "wdio-iedriver-service": "~0.1"
  }
}
```
This service uses IEDriver to communicate with the browser directly when running tests with the WDIO testrunner on the host system.

Note - `wdio-iedriver-service` package MUST be excluded from `package.json` after the local tests have been performed as it may break `travis CI` once committed.

[More tips on setting up internet explorer](https://heliumhq.com/docs/internet_explorer)

### Microsoft Edge

The `Microsoft Edge` selenium driver must be installed separately in order to run tests on the host system. Links to all selenium drivers are available [Here](http://docs.seleniumhq.org/download/).

Create a directory on your drive C: as follows `C:\Selenium\EdgeDriver`,
Copy MicrosoftWebDriver.exe to the created directory.

For `Firefox` and `Chrome` their drivers are included with selenium-standalone no setup is needed.

To run the end to end test on multiple browsers run: 
    `npm run test:e2e:dev:mult-browser`.
Note - you must have the 4 browsers installed on your local windows machine.
