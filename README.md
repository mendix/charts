Please see [Charts](https://docs.mendix.com/appstore/widgets/charts) in the Mendix documentation for details.

## Raising problems/issues
-   We encourage everyone to open a Support ticket on [Mendix Support](https://support.mendix.com) in case of problems with widgets or scaffolding tools (Pluggable Widgets Generator or Pluggable Widgets Tools)

## Building Charts 3.0

### Prerequisits

You should have `nvm` installed in your system

### Steps

#### Step 1

Clone `widgets-resources`

#### Step 2

Change dir to `widgets-resources` and run `npm install`

#### Step 3

Back to the current repo and `nvm use 14` then `npm install`.
Now you ready to run `build.sh` script.

#### Step 4

Now you can run `build.sh`
```
./build.sh <your-path>/widgets-resources
```

As result you should have `Charts.mpk` in `dist/x.x.x` directory