# Advanced configuration settings
A detailed description of the JSON properties that can be applied to the charts widget. 

## Layout (all charts)
Layout controls the general appearance of the chart. The chart is customized by adding JSON properties to the layout.
Below is a basic configuration.

    {
        "autosize": true,
        "separators": ".,"
    }

### Legend
The legend properties below can be added to the basic layout configuration to apply custom style to it. Below is are legend properties.

    {
        "showlegend": true,
        "legend": {
            "bgcolor": "#fff",
            "bordercolor": "#444",
            "borderwidth": 0,
            "font":{
                "family": "Open Sans, verdana, arial, sans-serif",
                "size": 12,
                "color": "black"
            },
            "orientation": "v",
            "traceorder": "normal",
            "tracegroupgap": 10,
            "x": -0.1,
            "xanchor": "right"
        }
    }

### Axis
The axis properties usually apply to charts with two or more axes. They can be configured as: 

    {
        "xaxis": {
            "gridcolor": "#eaeaea",
            "title": "X-axis",
            "showgrid": true,
            "fixedrange": true
        },
        "yaxis": {
            "rangemode": "tozero",
            "zeroline": true,
            "zerolinecolor": "#eaeaea",
            "gridcolor": "#eaeaea",
            "title": "Y-axis",
            "showgrid": true,
            "fixedrange": true
        }
    }

### Title
The title appears above the chart. It can be configured as: 

    {
        "title": "CHART TITLE",
        "titlefont": {
            "family": "Droid Sans, Droid Serif, sans-serif",
            "size": 20,
            "color": "black"   
        }
    }

### Color

    {
        "paper_bgcolor": "#FFF"
    }

### Margins

    {
        "margin": {
            "l": 70,
            "r": 60,
            "b": 60,
            "t": 60,
            "pad": 10,
            "autoexpand": true
        }
    }

### Tool tip

    {
        "hovermode": "text",
        "hovertext": "text",
        "hoverinfo": "all",
        "textposition":"inside",
        "hoverlabel": {
            "bgcolor": "#888",
            "bordercolor": "#888",
            "font": {
                "color": "white"
            }
        }
    }

### Fonts

    {
        "font": {
            "family": "Open Sans, sans-serif",
            "size": 12,
            "color": "black"
        }
    }

## Data Properties
### column chart
    {
        "name": "Series",
        "type": "bar",
        "hoverinfo": "y",
        "orientation": "v"
    }

