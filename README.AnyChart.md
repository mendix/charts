# Any Charts
With the AnyChart it is possible to build all the chart types that are possible with Plotly.js

## Dependencies
* Mendix 7.11.0

## Demo projects
[https://charts102.mxapps.io](https://charts102.mxapps.io)

## Configuration
The Any Charts can be configured with a JSON `Data` array and `Layout` object configuration. The configuration can be set statically, via the `Source attribute` or with the `Sample data`. The data of the attribute will be merged into the static settings and will overwrite the properties. The `Sample data` is for demo purpose in the run time when there is no `Source attribute` selected or when rendering sample data in the webmodeler preview.

### Use building blocks
 1) Download the building blocks from the app store (link)
 2) Add the required building block on a page
 3) Run de new to preview the chart
 4) Create a JSON export the generates the data in the same structure `Sample data`
 5 ) Create a microflow to generate the data and store it in the `Source attribute`

Enable the `Mode` `Development` and fine tune the settings during runtime. Cheat sheet (link) gives you a quick help and the full reference is found here: (link)

### Start from scratch
 1) Select one of the charts sample for the Any Chart cheat sheets. For example the line chart: `[ { "x": [ 1, 2 ], "y": [ 1, 2 ], "type": "scatter" } ]`
 2) Copy the data in the tab `Data`, `Static`
 3) Enable the the `Mode` `Development` 
 4) Run the project, to validate the chart renders correctly
 5) Click the 'Editor' button and fine tunes your settings. The editor is only a playground and no settings are stored. Copy the required setting back into the modeler.
 6) Split the data a static part and a dynamic part that is going to be generated from the domain model. Static : `[ "type": "scatter" } ]` and sample data `[ { "x": [ 1, 2 ], "y": [ 1, 2 ] } ]`
 7) Create a microflow the generates the dynamic a JSON string with the same structure as the `Sample data`. Store the JSON in a attribute. The attribute should be selected in `Attribute Source`
