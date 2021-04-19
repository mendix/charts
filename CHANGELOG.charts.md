# Changelog
All notable changes to this multi-widget MPK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Fixed
- The component now has a `shouldComponentUpdate` method that compares the new props with the previous props. If there is a difference, it re-renders. This fixes issues arising due to re-plotting the Plotly Chart unnecessarily, such as when grouped legends are configured.
- In MX 9.1 certain public client methods were removed. A check is now in-place to check the function's existence before use, else it fallsback to an alternative approach. This means ensures compatibility with MX 7, 8 and 9.

## Changed
- Update `plotly.js` dependency
- Update `react-ace` dependency and switch `brace` for `ace-builds`

### Security
- Patch `lodash` via Snyk
- Update `fast-json-patch` dependency

## [major.minor.patch] - YYYY-MM-DD

## Previous versions

See [marketplace](https://marketplace.mendix.com/link/component/105695) notes.

--------------------------------------------------------------------

`<heading>` should be one of:

- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.

Add [YANKED] after the release date if the release was unpublished.

--------------------------------------------------------------------
