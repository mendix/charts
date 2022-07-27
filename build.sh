#!/bin/bash

npm run build
cd dist
rm -rf target
rm -rf v3
mkdir -p target
mkdir -p v3
cd target
tar -xvf ../2.0.1/Charts.mpk
cd ../v3
tar -xvf ../../com.mendix.widget.web.AreaChart.mpk
cd ..
mkdir -p target/v3/AreaChart
cp v3/* target/v3/AreaChart
rm target/v3/AreaChart/package.xml
cp -R v3/com/mendix/shared target/com/mendix/
cp -R v3/com/mendix/widget/web target/com/mendix/widget/
cd target
zip -r ../Charts.mpk *
