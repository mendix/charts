const webpack = require("webpack");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const widgetName = require("./package").widgetName;

const widgetConfig = {
    entry: {
        ColumnChart: "./src/ColumnChart/components/ColumnChartContainer.ts",
        BarChart: "./src/BarChart/components/BarChartContainer.ts",
        LineChart: "./src/LineChart/components/LineChartContainer.ts",
        AreaChart: "./src/AreaChart/components/AreaChartContainer.ts",
        PieChart: "./src/PieChart/components/PieChartContainer.ts"
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
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader"
            },
            {
                test: /\.css$/, loader: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader"
                })
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader!sass-loader"
                })
            }
        ]
    },
    externals: [ "react", "react-dom",
        function(context, request, callback) {
            if (/PlotlyCustom$/.test(request)) {
                return callback(null, "widgets/com/mendix/widget/custom/charts/PlotlyCustom.js");
            }
            callback();
        }
    ],
    plugins: [
        new CopyWebpackPlugin([
            { from: "src/**/*.js", to: "../" },
            { from: "src/**/*.xml", to: "../" }
        ], {
            copyUnmodified: true
        }),
        new ExtractTextPlugin({ filename: `./com/mendix/widget/custom/[name]/ui/[name].css` }),
        new webpack.LoaderOptionsPlugin({
            debug: true
        }),
        new webpack.SourceMapDevToolPlugin({
            filename: "./com/mendix/widget/custom/[name]/[name].js.map"
        })
    ]
};

const plotlyCustomConfig = {
    entry: "./src/PlotlyCustom.ts",
    output: {
        path: path.resolve(__dirname, "dist/tmp/src"),
        filename: `com/mendix/widget/custom/${widgetName.toLowerCase()}/PlotlyCustom.js`,
        libraryTarget: "amd",
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({ debug: true }),
        new webpack.SourceMapDevToolPlugin({
            filename: `./com/mendix/widget/custom/${widgetName.toLowerCase()}/PlotlyCustom.js.map`
        })
    ]
};

const previewConfig = {
    entry: {
        ColumnChart: "./src/ColumnChart/ColumnChart.webmodeler.ts",
        BarChart: "./src/BarChart/BarChart.webmodeler.ts",
        LineChart: "./src/LineChart/LineChart.webmodeler.ts",
        AreaChart: "./src/AreaChart/AreaChart.webmodeler.ts",
        PieChart: "./src/PieChart/PieChart.webmodeler.ts"
    },
    output: {
        path: path.resolve(__dirname, "dist/tmp"),
        filename: "src/[name]/[name].webmodeler.js",
        libraryTarget: "commonjs"
    },
    resolve: {
        extensions: [ ".ts", ".js" ]
    },
    module: {
        rules: [
            { test: /\.ts$/, loader: "ts-loader", options: {
                compilerOptions: {
                    "module": "CommonJS",
                }
            }},
            { test: /\.css$/, use: "raw-loader" },
            { test: /\.scss$/, use: [
                { loader: "raw-loader" },
                { loader: "sass-loader" }
            ] }
        ]
    },
    externals: [ "react", "react-dom" ],
    plugins: [ new webpack.SourceMapDevToolPlugin({
        filename: "./src/[name]/[name].webmodeler.js.map",
    }) ]
};

module.exports = [ widgetConfig, plotlyCustomConfig, previewConfig ];
