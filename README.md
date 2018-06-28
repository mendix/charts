[![Build Status](https://travis-ci.org/mendixlabs/charts.svg?branch=master)](https://travis-ci.org/mendixlabs/charts)
[![Dependency Status](https://david-dm.org/mendixlabs/charts.svg)](https://david-dm.org/mendixlabs/charts)
[![Dev Dependency Status](https://david-dm.org/mendixlabs/charts.svg#info=devDependencies)](https://david-dm.org/mendixlabs/charts#info=devDependencies)
[![codecov](https://codecov.io/gh/mendixlabs/charts/branch/master/graph/badge.svg)](https://codecov.io/gh/mendixlabs/charts)
![badge](https://img.shields.io/badge/mendix-7.7.1-green.svg)

# Charts
Plot and compare your data across different charts.

### Available charts
* Column Chart
* Line Chart
* Pie Chart
* Area Chart
* Bar Chart
* Time Series Chart
* Heat Map
* Bubble Chart

## Dependencies
* Mendix 7.11.0

## Development test projects
[https://charts102.mxapps.io](https://charts102.mxapps.io)

## Basic configuration

### Line chart
A line (scatter) chart should have one or more series, each displaying commonly grouped data points.

![LineChartProperties](/assets/LineChart_ChartProperties.png)

A serie's data can be retrieved from the database, by a microflow, or from REST endpoint.
Below are the properties for configuring series data:

![LineChartProperties](/assets/SerieDataSource.png)

* Place the widget in data form within the context of the entity
* Select the series either static or dynamic
* Select an entity for the chart values
* Select the data source 
* Optional change the XPath constraint if the data source selected is Database
* Select a micro that returns serie values if the data source selected is Microflow.
* Enter the REST URL if the data source selected REST endpoint. For more details: [REST endpoint](/RESTEndpoint.md)

Dynamic series retrieves all the chart series in one configuration. Select the series as dynamic and add configurations for them under `Dynamic Series` tab.

![LineChartProperties](/assets/DynamicSeries.png)

NB: The line chart's x-axis provides support for dates and thus the line chart can be configured as a time series.

### Area chart
The area chart has data properties identical to those of the line chart.

### Column chart
The column chart has data properties identical to those of the line chart but for one distinction: no support for Date data type

### Bar chart
The bar chart configuration is identical to that of the column chart.

### Pie chart
Unlike the chart types above, the pie chart requires no series.
Below are the properties for configuring pie chart data:

* `Entity`[required] - The entity from which the data values will be retrieved.
* `Name attribute`[required] - The attribute that contains the data point captions.
* `Value attribute`[required] - The attribute that contains the data point values.
* `Color attribute`[required] - The attribute that contains the data point colors.
* `Sort attribute` - The attribute to use for sorting the x-axis data.

### Time series chart
The time series chart is a specialised version of the line chart, focusing on the X-axis dates. It therefore has data properties identical to those of the line chart.

### Heat map
The heat map should be configured with a required horizontal, vertical and data attributes.

The sample domain model could be either of the two below.

![Heat Map Sample Domain Model](/assets/heatmap_sample_domain_model.png)

### Bubble chart
The bubble chart has data properties identical to those of the line chart but for one distinction: `Bubble size data attribute` [required] - The attribute that contains and determines the size of the bubble.

## Advanced configuration
The charts in this widget are based on the [https://github.com/mendixlabs/charts/issues](Plotly) library.
As such, the widget provides support for advanced users to extend or overwrite the basic settings by adding the chart properties as JSON.

To enable this feature, go to the "mode" option in the "Advanced" tab.
For the line & column charts, each series has its own advanced tab for its own specialised configurations.

Below are the available advanced options and their usage:

### Layout options (all charts)
Layout options control the general appearance of the chart. Common options include; title, showlegend, xaxis, yaxis etc
```json
{
  "showlegend": true,
  "legend": {
    "orientation": "h",
    "y": "auto"
  }
}
```
### Configurations options (all charts)
Configurations options control the appearance of the chart beyond the layout options. Common options include; displayModeBar, doubleClick etc
```json
{
  "displayModeBar": true,
  "doubleClick": true,
  "displaylogo": false
}
```
For more details: [Developer cheat sheet](/AdvancedCheatSheet.md)

### Data options (pie chart)
On the pie chart, the data options control the appearance of the pie circle beyond the general layout options. Options include hole, name, marker e.t.c
``` json
{
  "hole": 0.5
}
```
For more details: [Developer cheat sheet](/AdvancedCheatSheet.md)

### Series options (line & column charts)
The series options control the appearance of a specific series on the line or column chart. Options include line color, line shape e.t.c

Full Plotly API reference: [https://plot.ly/javascript/reference/](https://plot.ly/javascript/reference/)

### Theme based advanced configuration
The settings above can also be added in a global context via the theme folder of your mendix project root directory.

To the theme folder, add a `.json` file named `com.mendix.charts`. The JSON should be in the following format:

``` json
{
  "layout": {
    // Add shared layout options here (for all charts)
  },
  "configuration": {
    // Add shared configuration options here (for all charts)
  },
  "charts": {
    "LineChart": {
      "layout": {
        // Add line chart only layout options here
      },
      "data": {
        // Add line chart only data options here
      },
      "configuration": {
          // Add line chart only configuration options here
      }
    },
    "AreaChart": {
      // Same arrangement as the line chart
    },
    "BubbleChart": {
      // Same arrangement as the line chart
    },
    "TimeSeries": {
      // Same arrangement as the line chart
    },
    "ColumnChart": {
      // Same arrangement as the line chart
    },
    "BarChart": {
      // Same arrangement as the line chart
    },
    "PieChart": {
      // Same arrangement as the line chart
    },
    "HeatMap": {
      // Same arrangement as the line chart
    }
  }
}
```

Please use with caution, as the configs set up here shall be applied to every instance of the charts in your application.  
Only the advanced configurations set up in the widget itself have a higher precendence.

## Issues, suggestions and feature requests
We are actively maintaining this widget, please report any issues or suggestion for improvement at [https://github.com/mendixlabs/charts/issues](https://github.com/mendixlabs/charts/issues)

## Development
See [here](/Development.md)
