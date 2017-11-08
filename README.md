# Charts
Plot and compare your data across different charts.

### Available charts
* `Column Chart`
* `Bar Chart`
* `Line Chart`
* `Area Chart`
* `Pie Chart`

## Dependencies
* Mendix 7.6.0

## Demo projects
[https://charts102.mxapps.io](https://charts102.mxapps.io)

## Basic configuration

### Line chart
A line (scatter) chart should have one or more series, each displaying commonly grouped data points.
![LineChartProperties](/assets/LineChart_ChartProperties.png)

Data can be retrieved either from the database, or from a microflow.
Below are the properties for configuring series data:

* `name`[required] - Caption for series, shown on hover & on the legend.
* `Entity`[required] - Entity containing the series data points.
* `X-axis data attribute`[required] - The attribute that contains the data point X value.
* `Y-axis data attribute`[required] - The attribute that contains the data point Y value.
* `X-axis sort attribute` - The attribute to use for sorting the x-axis data.

### Area chart
The area chart has data properties identical to those of the line chart.

### Bar chart
The bar chart has data properties identical to those of the line chart.

### Column chart
The bar chart has data properties identical to those of the bar chart.

### Pie chart
Unlike the chart types above, the pie chart requires no series.
Below are the properties for configuring pie chart data:

* `Entity`[required] - The entity from which the data values will be retrieved.
* `Name attribute`[required] - The attribute that contains the data point captions.
* `Value attribute`[required] - The attribute that contains the data point values.
* `Color attribute`[required] - The attribute that contains the data point colors.
* `Sort attribute` - The attribute to use for sorting the x-axis data.

## Advanced configuration
The charts in this widget are based on the [https://github.com/mendixlabs/charts/issues](Plotly) library.
As such, the widget provides support for advanced users to extend or overwrite the basic settings by adding the chart properties as JSON.

Below are the available advanced options and their usage:

### Layout options (all charts)
Layout options control the general appearance of the chart. Common options include; title, showlegend, xaxis, yaxis etc

    {
        "title": "My Chart"
        "showlegend": true
    }
    
### Data options (pie chart)
On the pie chart, the data options control the appearance of the pie circle beyond the general layout options. Options include hole, name, marker etc

    {
        "name": "May Pie',
        "hole": 0.4
        "hoverinfo": "label+percent+name",
        "textinfo": "none"
    }

## Issues, suggestions and feature requests
We are actively maintaining this widget, please report any issues or suggestion for improvement at [https://github.com/mendixlabs/charts/issues](https://github.com/mendixlabs/charts/issues)

## Development
Prerequisite: Install git, node package manager, webpack CLI, grunt CLI, Karma CLI

To contribute, fork and clone.

    git clone https://github.com/mendixlabs/charts

The code is in typescript. Use a typescript IDE of your choice, like Visual Studio Code or WebStorm.

To set up the development environment, run:

    npm install

Create a folder named dist in the project root.

Create a Mendix test project in the dist folder and rename its root folder to `dist/MxTestProject`.

To automatically compile, bundle and push code changes to the running test project, run:

    grunt

To run the project unit tests with code coverage, results can be found at dist/testresults/coverage/index.html, run:

    npm test

or run the test continuously during development:

    karma start
