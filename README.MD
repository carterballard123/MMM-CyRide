# MMM-CyRide

A [MagicMirror2](https://github.com/MichMich/MagicMirror) module for live CyRide bus arrivals in Ames, Iowa. CyRide is the public bus system serving Ames and Iowa State University.

> **Modernized fork:** This version restores live CyRide arrival support using the current MyCyRide RTPI API. Older versions of this module used an endpoint that now returns the MyCyRide web app HTML instead of arrival JSON.

## Features

- Live CyRide arrival times from the current MyCyRide RTPI API
- Labeled single-stop and multi-stop configurations
- Configurable refresh and display rotation intervals
- Route filtering with `showOnlyRoutes` and `hideRoutes`
- Configurable arrivals per route
- Two route paging modes for compact or balanced multi-stop displays

## Screenshots

### Single Stop

![Single stop MMM-CyRide display](screenshots/single-stop.png)

### Compact Multi-Stop Display

![Compact multi-stop MMM-CyRide display](screenshots/compact-multi-stop.png)

### Route Filtered Display

![Route filtered MMM-CyRide display](screenshots/route-filtered.png)

### Balanced Per-Stop Paging

![Balanced per-stop paging MMM-CyRide display](screenshots/per-stop-paging.png)

## Installation

Open the `modules` folder of your MagicMirror installation and run:

```bash
git clone https://github.com/carterballard123/MMM-CyRide.git
cd MMM-CyRide
npm install
```

This module uses `node-fetch@2` in `node_helper.js` to request CyRide arrival data.

## Configuration

Add the module to the `modules` array in your MagicMirror `config/config.js` file.

```js
{
  module: "MMM-CyRide",
  position: "top_left",
  config: {
    stops: [
      { stopID: "2501", label: "Home" },
      { stopID: "2520", label: "Campus" }
    ],
    customerID: "187"
  }
}
```

For a single stop, the older `stopID` config style is still supported:

```js
{
  module: "MMM-CyRide",
  position: "top_left",
  config: {
    stopID: "2501",
    stopLabel: "Home",
    customerID: "187"
  }
}
```

### Configuration Options

| Option | Default | Description |
| --- | --- | --- |
| `stops` | `undefined` | Preferred multi-stop config. Each stop should include `stopID` and can include a display `label`. |
| `stopID` | `"5108903"` | Legacy single-stop CyRide RTPI stop number. Used when `stops` is not configured. |
| `stopLabel` | `"Stop {stopID}"` | Optional label for the legacy single-stop config. |
| `customerID` | `"187"` | MyCyRide customer ID. Kept configurable for compatibility with the MyCyRide API. |
| `refreshInterval` | `60000` | Milliseconds between requests for fresh CyRide data. |
| `rotationInterval` | `5000` | Milliseconds each page of routes stays visible before rotating. |
| `maxArrivalsPerRoute` | `2` | Number of arrival times to show under each route. |
| `maxRoutesPerPage` | `2` | In `"combined"` page mode, number of total route blocks to show before rotating. |
| `routePageMode` | `"combined"` | Controls route paging. Use `"combined"` to page all stops together or `"perStop"` to show routes from each stop on the same page. |
| `maxRoutesPerStopPerPage` | `1` | In `"perStop"` mode, number of route blocks to show for each stop before rotating. |
| `showOnlyRoutes` | `[]` | Show only routes using case-insensitive partial matches against the displayed route name. |
| `hideRoutes` | `[]` | Hide routes using case-insensitive partial matches against the displayed route name. |

## Example Configs

### Single Stop

Use this when you only care about one stop.

```js
{
  module: "MMM-CyRide",
  position: "top_left",
  config: {
    stopID: "2501",
    stopLabel: "Home",
    customerID: "187"
  }
}
```

### Compact Multi-Stop Display

Use this when you want several stops on screen but only the next arrival for each route.

```js
{
  module: "MMM-CyRide",
  position: "top_right",
  config: {
    stops: [
      { stopID: "2501", label: "Kildee Hall" },
      { stopID: "2520", label: "Bessey Hall" }
    ],
    customerID: "187",
    maxArrivalsPerRoute: 1,
    maxRoutesPerPage: 4,
    rotationInterval: 10000
  }
}
```

### Focus On Specific Routes

Use this when a stop has many routes but you only want to see matching routes. Route filters are case-insensitive and can match part of the displayed route name.

```js
{
  module: "MMM-CyRide",
  position: "top_right",
  config: {
    stops: [
      { stopID: "2501", label: "Kildee Hall" },
      { stopID: "2520", label: "Bessey Hall" }
    ],
    customerID: "187",
    showOnlyRoutes: ["green"],
    maxArrivalsPerRoute: 1,
    maxRoutesPerPage: 6
  }
}
```

### Balanced Multi-Stop Paging

Use this when you want each page to show routes from each configured stop instead of paging through one combined route list.

```js
{
  module: "MMM-CyRide",
  position: "top_right",
  config: {
    stops: [
      { stopID: "2501", label: "Kildee Hall" },
      { stopID: "2520", label: "Bessey Hall" }
    ],
    customerID: "187",
    routePageMode: "perStop",
    maxRoutesPerStopPerPage: 1,
    maxArrivalsPerRoute: 1,
    rotationInterval: 8000
  }
}
```

## Route Paging

By default, `routePageMode` is `"combined"`. This treats every stop and route pair as one combined list, then uses `maxRoutesPerPage` to decide how many route blocks appear at once.

```js
config: {
  stops: [
    { stopID: "2501", label: "Kildee Hall" },
    { stopID: "2520", label: "Bessey Hall" }
  ],
  routePageMode: "combined",
  maxRoutesPerPage: 2
}
```

If one stop has several routes, `"combined"` mode may show multiple routes from that same stop before rotating to routes from another stop.

Use `"perStop"` mode when you want each page to include routes from each configured stop:

```js
config: {
  stops: [
    { stopID: "2501", label: "Kildee Hall" },
    { stopID: "2520", label: "Bessey Hall" }
  ],
  routePageMode: "perStop",
  maxRoutesPerStopPerPage: 1
}
```

With this setup, each page shows up to one route from Kildee Hall and one route from Bessey Hall before rotating.

## Route Filtering

Use `showOnlyRoutes` to display only matching routes:

```js
config: {
  stops: [
    { stopID: "2501", label: "Home" }
  ],
  showOnlyRoutes: ["green"]
}
```

Use `hideRoutes` to remove matching routes from the display:

```js
config: {
  stops: [
    { stopID: "2501", label: "Home" }
  ],
  hideRoutes: ["green"]
}
```

Filters are case-insensitive and can match part of the displayed route name. For example, `"green"` matches `2 Green West`.

Use more specific filters when needed:

```js
hideRoutes: ["2 Green West"]
```

Avoid overly broad filters like `"2"` unless you intentionally want to match any route name containing `2`, such as `12 Lilac` or `21 Cardinal`.

## Find Your Stop ID

To find your stop ID, visit [mycyride.com/arrivals](https://mycyride.com/arrivals). Choose a route that passes your stop, then choose the stop from the list. The stop ID is listed in bold after choosing a route and stop. In the image below, the stop ID is 2520.

![CyRide route finder website image](EstimatedArrivalTimes.png)

## What Changed From The Original Module

This fork keeps the original module name, MagicMirror structure, compact route display, single-stop config compatibility, and route color style where practical. The main changes are focused on restoring compatibility with the current MyCyRide data source and adding configuration options for modern use.

The original module requested arrival data from:

```text
https://mycyride.com/Stop/{stopID}/Arrivals?customerID={customerID}
```

That endpoint now returns the MyCyRide web app HTML instead of the JSON shape the module expected. This fork now uses the current MyCyRide RTPI API path through `node_helper.js`:

```text
https://mycyride.com/api/rtpi?path=stops/rtpi/{stopID}/arrivals
```

This fork also adds:

- A local MagicMirror helper route at `/MMM-CyRide/arrivals`
- Support for labeled multiple stops
- Configurable refresh, rotation, paging, and route filtering
- `node-fetch@2` as an explicit npm dependency
- Safer frontend state storage using `this.cyRideStops`

Important implementation detail: the module stores arrival state in `this.cyRideStops`, not `this.data`. MagicMirror uses `this.data` internally for module metadata such as position, so overwriting it can break rendering.

## Contributing

PRs welcome.

To develop locally, clone your fork into a MagicMirror `modules` directory, run `npm install`, and start MagicMirror from the main MagicMirror folder. `node_helper.js` logs will appear in the terminal running MagicMirror.
