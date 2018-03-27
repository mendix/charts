# Any chart cheat sheet
A cheat sheet with snippets of JSON objects for easy and quick configuration of any chart.

## 3D chart
``` json
[ {
  "x": [ "9", "8", "5", "1" ],
  "y": [ "1", "2", "4", "8" ], 
  "z": [ "11", "8", "15", "3" ],
  "mode": "markers",
  "type": "scatter3d"
} ]
```

## Contour chart
``` json
[ {
  "z": [ [ 2, 2, 4, 11 ], [ 5, 14, 8, 11 ] ],
  "type": "contour"
} ]
```

## Pie chart
``` json
[ {
  "values": [ 5, 1, 11, 8 ],
  "labels": [ "Thailand", "Brazil", "Cameroon", "Vietnam"],
  "type": "pie"
} ]
```

## Heat map
``` json
[ {
  "z": [ [ 5, 2, 3 ], [ 2, 5, 6 ], [ 3, 6, 5 ] ],
  "type": "heatmap"
} ]
```

## Time series
``` json
[ {
  "type": "scatter",
  "mode": "lines",
  "x": [ 1, 2, 3, 4 ],
  "y": [ 5, 2, 7, 10 ]
} ]
```

## Bubble chart
``` json
[ {
  "x": [ 1, 2, 3, 1 ],
  "y": [ 10, 11, 12, 13 ],
  "mode": "markers"
} ]
```

## Group by chart
``` json
[ {
    "type": "scatter",
    "x": [ "Arthur","Jolly","Daphine","Arthur","Jolly","Daphine" ],
    "y": [ 1, 6, 2, 5, 8, 1 ],
    "mode": "markers"
} ]
```

## Symmetric error bar
``` json
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
``` json
[ {
  "x": [ 10, 40, 15, 12, 50, 30 ],
  "type": "histogram"
 }]
```

## Bar chart
``` json
[ {
  "x": [ 1, 2, 3 ],
  "y": [ 25, 12, 20 ],
  "type": "bar"
} ]
```
