# Any chart cheat sheet
A cheat sheet with snippets of JSON objects for easy and quick configuration of any chart.

## 3D chart
```JSON
[
  {
    "x": [ "9", "8", "5", "1" ],
    "y": [ "1", "2", "4", "8" ], 
    "z": [ "11", "8", "15", "3" ],
    "mode": "markers",
    "type": "scatter3d"
  }
]
```

## Contour chart
```JSON
[
  {
    "z": [ [ 2, 2, 4, 11 ] [ 5, 14, 8, 11 ] ],
    "type": "contour"
  }
]
```

## Multiple Y Axes
```JSON
[
  {
    "x": [ 1, 2, 3 ],
    "y": [ 4, 5, 6 ]
  },
  {
    "x": [ 2, 3, 4 ],
    "y": [ 40, 50, 60 ],
    "yaxis": "y2"
  }
]
```

## Pie chart
```JSON
[
  {
  "values": [ 5, 1, 11, 8 ],
  "labels": [ "Thailand", "Brazil", "Cameroon", "Vietnam"],
  "type": "pie"
  }
]
```

## Heat map
```JSON
[
 {
    "z": [ [ 5, 2, 3 ], [ 2, 5, 6 ], [ 3, 6, 5 ] ],
    "type": "heatmap"
  }
]
```

## Time series
```JSON
[
  {
    "type": "scatter",
    "mode": "lines",
    "x": [ 1, 2, 3, 4 ],
    "y": [ 5, 2, 7, 10 ]
  }
]
```

## Bubble chart
```JSON
[
  {
    "x": [ 1, 2, 3, 1 ],
    "y": [ 10, 11, 12, 13 ],
    "mode": "markers"
  }
]
```

## Group by chart
```JSON
[ 
  {
    "type": "scatter",
    "x": [ "Arthur","Jolly","Daphine","Arthur","Jolly","Daphine" ],
    "y": [ 1, 6, 2, 5, 8, 1 ],
    "mode": "markers"
  }
]
```

## Symmetric error bar
```JSON
[
  {
    "x": [ 0, 1, 2 ],
    "y": [ 6, 10, 2 ],
    "error_y": {
      "type": "data",
      "array": [ 4, 2, 3 ]
    },
    "type": "scatter"
  }
]
```
## Histogram
```JSON
[
  {
    "x": [ 10, 40, 15, 12, 50, 30 ],
    "type": "histogram"
 }
]
```

## Multiple X axes
```JSON
[
  {
    "y": [ 1, 2, 3, 4 ],
    "x": [ 40, 50, 60, 75 ],
    "type": "scatter" 
  },
  {
    "y": [ 2, 3, 5, 4 ],
    "x": [ 4, 5, 7, 8 ],
  "xaxis": "x2",
  "type": "scatter"
  }
]
```

## Bar chart
```JSON
[
  {
    "x": [ 1, 2, 3 ],
    "y": [ 25, 12, 20 ],
    "type": "bar"
  }
]
```
