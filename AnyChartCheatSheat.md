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
``` json
[ {
  "x": [ 1, 2, 3 ],
  "y": [ 1, 2, 3 ],
  "text": [ "A", "B", "C" ],
  "textposition": "top center",
  "mode": "marker+text"
} ]
```

### Heatmaps
``` json
[ {
  "z": [ [ 1, 2 ], [ 3, 4 ] ],
  "type": "heatmap"
} ]
```

### Bar Chart
``` json
[ {
  "x": [ 1, 2 ],
  "y": [ 1, 2 ],
  "type": "bar",
  "orientation": "h"
} ]
```

### Column Chart
``` json
[ {
  "x": [ 1, 2 ],
  "y": [ 1, 2 ],
  "type": "bar"
} ]
```

### Pie Chart
``` json
[{
  "values": [ 10, 20, 30 ],
  "labels": [ "Uganda", "Netherlands", "US" ],
  "type": "pie"
}]
```

### Doughnut Chart
``` json
[{
  "values": [ 10, 20, 30 ],
  "labels": [ "Uganda", "Netherlands", "US" ],
  "hole": 0.4,
  "type": "pie"
}]
```

### Area Plots
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
?????
``` json
[ {
  "x": [ 1, 2, 3, 4, 5 ],
  "type": "histogram"
} ]
```

### Box Plots
``` json
[ {
  "x": [ 1, 2, 3, 4, 5 ],
  "type": "box"
} ]
```

### 2D Histogram
``` json
[ {
  "x": [ 1, 2, 3, 4, 5 ],
  "y": [ 1, 2, 3, 4, 5 ],
  "type": "histogram2d"
} ]
```

## Maps

### Bubble Map
????
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
????
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
????
``` json
[ {
  "colorscale": "Viridis",
  "z": [ [3, 5, 7, 9], [21, 13, 8, 5 ] ] 
} ]
```

### 3D Line Plots
???
``` json
[ {
  "x": [ 9, 8, 5, 1 ],
  "y": [ 1, 2, 4, 8 ],
  "z": [ 11, 8, 15, 3 ],
  "mode": "lines",
} ]
```

### 3D Scatter Plots
???
``` json
[ {
  "x": [ 9, 8, 5, 1 ],
  "y": [ 1, 2, 4, 8 ],
  "z": [ 11, 8, 15, 3 ],
  "mode": "markers",
} ]
```
