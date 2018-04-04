"use strict";
const webpack = require("webpack");
const webpackConfig = require("./webpack.config");
const merge = require("webpack-merge");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const widgetNames = [ "LineChart", "AreaChart", "PieChart", "ColumnChart", "BarChart",
    "TimeSeries", "HeatMap", "BubbleChart" ];

const webpackConfigRelease = webpackConfig.map(config => merge(config, {
    devtool: false,
    plugins: [ new UglifyJsPlugin({
        parallel: true,
        uglifyOptions: {
            cache: true,
            exclude: /.*\.min\.js$/
        }
    }) ]
}));

module.exports = function(grunt) {
    const pkg = grunt.file.readJSON("package.json");
    const packageNameCharts = pkg.widgetName[0];
    const packageNameAnyChart = pkg.widgetName[1];
    grunt.initConfig({

        watch: {
            updateWidgetFiles: {
                files: [ "./src/**/*", "src/**/*" ],
                tasks: [ "webpack:develop", "file_append", "compress", "copy" ],
                options: {
                    debounceDelay: 250
                }
            }
        },

        compress: {
            dist: {
                options: {
                    archive: `./dist/${pkg.version}/${packageNameCharts}.mpk`,
                    mode: "zip"
                },
                files: [ {
                    expand: true,
                    date: new Date(),
                    store: false,
                    cwd: "./dist/tmp/src",
                    src: [ "**/*" ]
                } ]
            },
            any: {
                options: {
                    archive: `./dist/${pkg.version}/${packageNameAnyChart}.mpk`,
                    mode: "zip"
                },
                files: [ {
                    expand: true,
                    date: new Date(),
                    store: false,
                    cwd: `./dist/tmp/${packageNameAnyChart}`,
                    src: [ "**/*" ]
                } ]
            }
        },

        copy: {
            distDeployment: {
                files: [
                    {
                        dest: "./dist/MxTestProject/deployment/web/widgets",
                        cwd: "./dist/tmp/src/",
                        src: [ "**/*" ],
                        expand: true
                    },
                    {
                        dest: "./dist/MxTestProject/deployment/web/widgets",
                        cwd: `./dist/tmp/${packageNameAnyChart}/`,
                        src: [ "**/*" ],
                        expand: true
                    }
                ]
            },
            mpk: {
                files: [
                    {
                        dest: "./dist/MxTestProject/widgets",
                        cwd: `./dist/${pkg.version}/`,
                        src: [ "*.mpk" ],
                        expand: true
                    }
                ]
            }
        },

        file_append: {
            addSourceURL: {
                files: widgetNames.map(widgetName => {
                    return {
                        append: `\n\n//# sourceURL=${widgetName}.webmodeler.js\n`,
                        input: `dist/tmp/src/${widgetName}/${widgetName}.webmodeler.js`
                    };
                })
            },
            addSourceUrlAnyChart: { files: [ {
                append: `\n\n//# sourceURL=AnyChart.webmodeler.js\n`,
                input: `dist/tmp/${packageNameAnyChart}/${packageNameAnyChart}/${packageNameAnyChart}.webmodeler.js`
            } ] }
        },

        webpack: {
            develop: webpackConfig,
            release: webpackConfigRelease
        },

        clean: {
            build: [
                `./dist/${pkg.version}/${packageNameCharts}/*`,
                `./dist/${pkg.version}/${packageNameAnyChart}/*`,
                "./dist/tmp/**/*",
                "./dist/tsc/**/*",
                "./dist/testresults/**/*",
                `./dist/MxTestProject/deployment/web/widgets/${packageNameCharts}/*`,
                `./dist/MxTestProject/widgets/${packageNameCharts}.mpk`,
                `./dist/MxTestProject/deployment/web/widgets/${packageNameAnyChart}/*`,
                `./dist/MxTestProject/widgets/${packageNameAnyChart}.mpk`
            ]
        },

        checkDependencies: {
            this: {}
        }
    });

    grunt.loadNpmTasks("grunt-check-dependencies");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-file-append");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-webpack");

    grunt.registerTask("default", [ "clean build", "watch" ]);
    grunt.registerTask(
        "clean build",
        "Compiles all the assets and copies the files to the dist directory.",
        [ "checkDependencies", "clean:build", "webpack:develop", "file_append", "compress", "copy:mpk" ]
    );
    grunt.registerTask(
        "release",
        "Compiles all the assets and copies the files to the dist directory. Minified without source mapping",
        [ "checkDependencies", "clean:build", "webpack:release", "file_append", "compress", "copy:mpk" ]
    );
    grunt.registerTask("build", [ "clean build" ]);
};
