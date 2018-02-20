const webpack = require("webpack");
const path = require("path");

const widgetName = require("./package").widgetName;

module.exports = {
    entry: {
        ColumnChart: "./src/ColumnChart/components/ColumnChartContainer.ts",
        BarChart: "./src/BarChart/components/BarChartContainer.ts",
        LineChart: "./src/LineChart/components/LineChartContainer.ts",
        AreaChart: "./src/AreaChart/components/AreaChartContainer.ts",
        PieChart: "./src/PieChart/components/PieChartContainer.ts",
        TimeSeries: "./src/TimeSeries/components/TimeSeriesContainer.ts",
        HeatMap: "./src/HeatMap/components/HeatMapContainer.ts"
    },
    output: {
        path: path.resolve(__dirname, "dist/tmp/src"),
        filename: "com/mendix/widget/custom/[name]/[name].js",
        chunkFilename: `com/mendix/widget/custom/${widgetName.toLowerCase()}/chunk[id].js`,
        libraryTarget: "umd",
        publicPath: "widgets/"
    },
    resolve: {
        extensions: [ ".ts", ".js" ],
        alias: {
            "tests": path.resolve(__dirname, "./tests")
        }
    },
    devtool: "inline-source-map",
    module: {
        rules: [
            { test: /\.css$/, use: "raw-loader" },
            { test: /\.scss$/, use: [
                { loader: "raw-loader" },
                { loader: "sass-loader" }
            ] },
            {
                test: /\.ts$/,
                exclude: /(node_modules)/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: [ "babel-preset-env" ],
                            plugins: [
                                "babel-plugin-transform-async-to-generator",
                                "babel-plugin-transform-regenerator"
                            ]
                        }
                    },
                    {
                        loader: "ts-loader",
                        options: { configFile: "karma-tsconfig.json" }
                    }
                ]
            }
        ]
    },
    externals: [
        "react/lib/ExecutionEnvironment",
        "react/lib/ReactContext",
        "react/addons",
        "jsdom"
    ],
    plugins: [
        new webpack.LoaderOptionsPlugin({
            debug: true
        })
    ]
};
