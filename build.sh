#!/usr/bin/env bash

### Build Charts packge that includes widgets from charts v2 and new, pluggable charts widgets

### Usage:
###   ./build <local-widgets-resources-path>
### Example:
###   ./build ~/code/mendix/widget-resources

### Loading nvm
NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

if ! command -v nvm &> /dev/null
then
  echo "nvm could not be found"
  exit
fi

### paths
root="$PWD"
mxwr="$1"
pkgsdir="$root/dist/pkgsv3"
target="$root/dist/tmp/src"

version=`node -e 'console.log(require("./package.json").version)'`
echo "Building Charts.mpk v$version"
echo "charts root:" $root
echo "widgets-resources root:" $mxwr

### Prebuild
rm -rf dist


### Building charts v2
nvm use 14
# npm install
npm run buildChartsV2


### Changing dir to widgets-resources, building charts and copy mpks to pkgsv3
cd $mxwr
# use node version from monorepo
nvm use
# npm install
npx lerna run release --scope '*-chart-web' --concurrency 1
mkdir -p $pkgsdir
npx lerna exec "find -E dist -regex 'dist/[0-9.]+/.*.mpk' | xargs -I % cp % $pkgsdir" --scope '*-chart-web'


### Unpacking new charts
cd $target
widgetNames=(ColumnChart BarChart LineChart AreaChart PieChart TimeSeries HeatMap BubbleChart)
for widgetName in ${widgetNames[*]};
do
  archive=com.mendix.widget.web.$widgetName.mpk
  echo "Unpacking:" $archive
  mkdir $widgetName
  cd $widgetName
  tar -xf $pkgsdir/$archive
  # We need to merge $target/com and $widget/com,
  # so we copy com files to parent dir ($target)
  cp -Rf com ..
  rm -rf com
  # Remove widget package.xml
  rm package.xml
  cd ..
done

npm run compress
### Changing dir to charts, open Charts.mpk
# cd $root/dist
# mkdir -p target
# cd target
# find -E .. -regex '../[0-9.]+/Charts.mpk' | xargs tar -xf

### Open packages content
# cd $root/dist
# mkdir -p v3
# cd ../v3
# tar -xvf ../../com.mendix.widget.web.AreaChart.mpk
# cd ..
# mkdir -p target/v3/AreaChart
# cp v3/* target/v3/AreaChart
# rm target/v3/AreaChart/package.xml
# cp -R v3/com/mendix/shared target/com/mendix/
# cp -R v3/com/mendix/widget/web target/com/mendix/widget/
# rm Charts.mpk
# cd target
# zip -r ../Charts.mpk *
