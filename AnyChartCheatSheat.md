## Basic Charts

### Line Plots
![LineChartProperties](/assets/cheatsheet/LineChart.png)
``` json
[
  {
    "x": [ 1, 2 ],
    "y": [ 1, 2 ],
    "type": "scatter"
  },
  {
    "x": [ 3, 4 ],
    "y": [ 9, 14 ],
    "type": "scatter"
  }
]
```

![BubbleChartProperties](/assets/cheatsheet/BubbleChart.png)
### Bubble Charts
``` json
[ {
  "x": [ 1, 2, 3 ],
  "y": [ 1, 2, 3 ],
  "marker": {
    "color": [ "red", "blue", "green" ],
    "size": [ 20, 50, 80 ]
  },
  "mode": "markers"
} ]
```

### Scatter Plots
![ScatterPlotProperties](/assets/cheatsheet/ScatterPlot.png)
``` json
[ {
  "x": [ 1, 2, 3 ],
  "y": [ 1, 2, 3 ],
  "text": [ "A", "B", "C" ],
  "textposition": "top center",
  "mode": "marker+text"
} ]
```

### Heatmap
![HeatMapProperties](/assets/cheatsheet/HeatMap1.png)
``` json
[ {
  "z": [ [ 1, 2 ], [ 3, 4 ] ],
  "type": "heatmap"
} ]
```

### Bar Chart
![BarChartProperties](/assets/cheatsheet/BarChart.png)
``` json
[ {
  "x": [ 1, 2 ],
  "y": [ 1, 2 ],
  "type": "bar",
  "orientation": "h"
} ]
```

### Column Chart
![ColumnChartProperties](/assets/cheatsheet/ColumnChart.png)
``` json
[ {
  "x": [ 1, 2 ],
  "y": [ 1, 2 ],
  "type": "bar"
} ]
```

### Pie Chart
![PieChartProperties](/assets/cheatsheet/PieChart.png)
``` json
[ {
  "values": [ 10, 20, 30 ],
  "labels": [ "Uganda", "Netherlands", "US" ],
  "type": "pie"
} ]
```

### Doughnut Chart
![DoughNutChartProperties](/assets/cheatsheet/DoughNutChart.png)
```json
[ {
  "values": [ 10, 20, 30 ],
  "labels": [ "Uganda", "Netherlands", "US" ],
  "hole": 0.4,
  "type": "pie"
} ]
```

### Area Plots
![AreaChartProperties](/assets/cheatsheet/AreaChart.png)
``` json
[ {
  "x": [ 1, 2, 3 ],
  "y": [ 1, 2, 3 ],
  "mode": "scatter",
  "fill": "tonexty"
} ]
```

## Statistical Charts

### Histograms
![HistogramProperties](/assets/cheatsheet/Histogram.png)
``` json
[ {
  "x": [ 40, 15, 5, 50, 25 ],
  "type": "histogram"
} ]
```

### Box Plots
![BoxPlotProperties](/assets/cheatsheet/BoxPlot.png)
``` json
[ {
  "x": [ 1, 2, 3, 4, 5 ],
  "type": "box"
} ]
```

### 2D Histogram
![2DHistogramProperties](/assets/cheatsheet/2DHistogram.png)
``` json
[ {
  "x": [ 1, 2, 3, 4, 5 ],
  "y": [ 1, 2, 3, 4, 5 ],
  "type": "histogram2d"
} ]
```

## Maps

### Bubble Map
![BubbleMapProperties](/assets/cheatsheet/BubbleMap.png)
``` json
[ {
  "lon": [ 100, 400 ],
  "lat": [ 0, 0 ],
  "type": "scattergeo",
  "marker": {
    "color": [ "red", "blue" ],
    "size": [ 20, 50 ]
  },
  "mode": "marker"
} ]
```

### Choropleth Map
![ChoroplethMapProperties](/assets/cheatsheet/ChoroplethMap.png)  
Data
``` json
[ {
  "locations": ["AZ", "CA", "VT"],
  "locationmode": "USA-states",
  "z": [10, 20, 40],
  "type": "scattergeo"
} ]
```
Layout 
``` json
{ 
  "geo": { 
    "scope": "usa" 
  }
}
```

### Scatter Map
![ScatterMapProperties](/assets/cheatsheet/ScatterMap.png)
``` json
[ {
  "lon": [ 42, 39 ],
  "lat": [ 12, 22 ],
  "type": "scattergeo",
  "text": [ "Rome", "Greece" ],
  "mode": "marker"
} ]
```
## 3D Charts

### 3D Surface Plots
![3DSurfacePlotProperties](/assets/cheatsheet/3DSurfacePlot.png)
``` json
[ {
  "colorscale": "Viridis",
  "z": [ [3, 5, 7, 9], [ 21, 13, 8, 5 ] ],
  "type": "surface"
} ]
```

### 3D Line Plots
![3DLineChartProperties](/assets/cheatsheet/3DLineChart.png)
``` json
[ {
  "x": [ 9, 8, 5, 1 ],
  "y": [ 1, 2, 4, 8 ],
  "z": [ 11, 8, 15, 3 ],
  "mode": "lines",
  "type": "scatter3d"
} ]
```

### 3D Scatter Plots
![3DScatterPlotProperties](/assets/cheatsheet/3DScatterPlot.png)
``` json
[ {
  "x": [ "9", "8", "5", "1" ],
  "y": [ "1", "2", "4", "8" ], 
  "z": [ "11", "8", "15", "3" ],
  "mode": "markers",
  "type": "scatter3d"
} ]
```

## Other Charts

### Contour chart
![ContourProperties](/assets/cheatsheet/Contour.png)
``` json
[ {
  "z": [ [ 2, 2, 4, 11 ], [ 5, 14, 8, 11 ] ],
  "type": "contour"
} ]
```

### Time series
![TimeSeriesProperties](/assets/cheatsheet/TimeSeries.png)
``` json
[ {
  "type": "scatter",
  "mode": "lines",
  "x": ["2018-09-04", "2018-10-04", "2018-11-04", "2018-12-04", "2018-12-04"],
  "y": [ 5, 2, 7, 10 ]
} ]
```

### Group by chart
![GroupByChartProperties](/assets/cheatsheet/GroupByChart.png)
``` json
[ {
    "type": "scatter",
    "x": [ "Arthur","Jolly","Daphine","Arthur","Jolly","Daphine" ],
    "y": [ 1, 6, 2, 5, 8, 1 ],
    "mode": "markers"
} ]
```

### Symmetric error bar
![ErrorBarProperties](/assets/cheatsheet/ErrorBar.png)
``` json
[ {
  "x": [ 0, 1, 2 ],
  "y": [ 6, 10, 2 ],
  "error_y": {
    "type": "data",
    "array": [ 4, 2, 3 ]
  },
  "type": "scatter"
} ]
```
