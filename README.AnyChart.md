# Any Charts
With the AnyChart it is possible to build all the chart types that are possible with Plotly.js

## Dependencies
* Mendix 7.11.0

## Demo projects
[https://charts102.mxapps.io](https://charts102.mxapps.io)

## Configuration
The Any Charts can be configured with a JSON `Data` array and `Layout` object configuration. The configuration can be set statically, via the `Source attribute` or with the `Sample data`. The data of the attribute will be merged into the static settings and will overwrite the properties. The `Sample data` is for demo purpose during run time when there is no `Source attribute` selected or when rendering sample data in the webmodeler preview.

### Use building blocks
1. Download the building blocks module from the app store (link) into your project
1. Create a `Map` entity
1. Create page with a Data view and use the `Map` entity
1. Add the required building block into the Data view
1. Run the project to preview the chart

### Start from scratch
1. Select one of the charts sample for the [Any Chart cheat sheet](/AnyChartCheatSheet.md). For example the line chart: `[ { "x": [ 1, 2 ], "y": [ 1, 2 ], "type": "scatter" } ]`
1. Copy the data in the tab `Data`, field `Static`
1. Run the project, to validate the chart renders correctly
1. Split the data into static and dynamic parts that are going to be generated from the domain model. Static : `[ "type": "scatter" } ]` and Sample data `[ { "x": [ 1, 2 ], "y": [ 1, 2 ] } ]`
1. Run the project to preview the chart

### Generating data and layout
1. Add a `Data` attribute to the map entity
1. In the widget set the Data `Source attribute`
1. Create a `JSON Structure` and use the `Sample data` as the snippet
1. Create an `Export Mapping` with the `JSON Structure`
1. Create a microflow that retrieves the data and use the `Export Mapping` to generate a `String Variable`. Store the value in the object attribute that is select as `Source attribute`

If need be the layout can also be generated in the same way as the data. In most  cases a `Static` layout will suffice.

### Runtime editor playground
Editing the JSON configuration in the modeler could be cumbersome. With the live preview editor developers can directly see the output of there changes. 

The editor is only a playground and no settings are stored. All changes you make in the runtime preview, you have to apply to your data model too.

1. Enable the `Mode` `Development`
1. Run the project, and open the chart page
1. Click the 'Toggle Editor' button and fine tune your settings
 The editor is only a playground and no settings are stored. Copy the required setting back into the modeler.
1. Select the `Data` or `Layout` from the dropdown menu
1. Edit Static or data setting till
1. Copy the new settings and apply them in the modeler
1. Re-run the project to confirm the change are applied

The [cheat sheet](/AdvancedCheatSheet.md) gives you a quick help. 

The full reference is found here: [https://plot.ly/javascript/reference/](https://plot.ly/javascript/reference/).