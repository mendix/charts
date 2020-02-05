## Development
Prerequisite: Install git, node package manager, webpack CLI, grunt CLI, Karma CLI

To contribute, fork and clone this repo.

The code is in typescript. Use a typescript IDE of your choice, like Visual Studio Code or WebStorm.

To set up the development environment, run:

    npm install

Create a folder named dist in the project root.

Create a Mendix test project in the dist folder and rename its root folder to `dist/MxTestProject`.

To automatically compile, bundle and push code changes to the running test project, run:

    npm start

To run the project unit tests with code coverage, results can be found at dist/testresults/coverage/index.html, run:

    npm test:unit

or run the test continuously during development:

    karma start

## Scripts
While developing, you will probably rely mostly on `npm start`; however, there are additional scripts at your disposal:

|`npm run <script>`|Description|
|------------------|-----------|
|`start`|Build the project and monitor source and config for changes and rebuild.|
|`test`|Runs lint, build, unit tests with Karma and generates a coverage report, deploy and run e2e test|
|`test:dev`|Runs karma and watches for changes to re-run tests. Does not generate coverage reports.|
|`test:unit`|Runs unit tests with karma and generates a coverage report.|
|`deploy`|Use the latest widget build to update the Mendix sandbox project.|
|`build`|Build the widget optimized for production|
|`lint`|Lint all `.js` files.|
|`lint:fix`|Lint and fix all fixable issues in the `.ts` files.|

# CI and remote testing
To enable the continues integration services.
Copy the `node_modules/mendix-widget-build-script/dist/localSettings.js` to your project root, and update the settings to run the update deployment from local source.

**Do not forget** to exclude this file in the `.gitignore` as it contains sensitive data.
```
exports.settings = {
    appName: "appName",
    key: "xxxxxxxx-xxxx-xxxx-xxxxx-xxxxxxxxxxxx",
    password: "secret",
    projectId: "xxxxxxxx-xxxx-xxxx-xxxxx-xxxxxxxxxxxx",
    user: "ci@example.com"
};
```

More information about the [Mendix widget build script](https://github.com/FlockOfBirds/mendix-widget-build-script).

# Releasing

Since this repo contains two widgets (Any charts and Charts), release process will require follows:

Charts:

- Update version to x.x.x in `package.json` and `package.xml`
- Draft a new release in github with name "App store release x.x.x". This will automatically update the test project in the cloud and generate necessary mpk.
- Go to mendix appstore and release the widget. The release will be automatically picked up since its connected to the github repo.

AnyChart:

- Open Charts mendix project, update the widgets if necessary (During the process of releasing Charts, this step is already taken care of)
- Go to `AnyChart_BuildingBlocks` module and increase the version
- Commit your changes
- Right click the `AnyChart_BuildingBlocks` and export the module.
- Draft another release in github with name "App store release Any Chart x.x.x"
- Add `AnyChart_BuildingBlocks` module as extra assets (In order to track previous releases)
- Since in the appstore the rule is one repo = one widget, our release wont get picked up automatically. Thus we will use the exported module. 