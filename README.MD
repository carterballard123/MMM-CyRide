# MMM-CyRide

A [Magic Mirror](https://github.com/MichMich/MagicMirror) module to show upcoming CyRide routes near your location. CyRide is the public bussing system in Ames, IA home of Iowa State University. Go Cyclones!

## Installation

To install MMM-CyRide, open the modules folder of your `MagicMirror` installation. Run the following commands:

- `git clone https://github.com/patrickdemers6/MMM-CyRide.git`
- `cd MMM-CyRide`
- `npm install`

This module uses `node-fetch@2` in `node_helper.js` to request CyRide arrival data.

To finish adding the module, follow the configuration settings below.

## Configuration

Add the following code to your Magic Mirror's `config.js` file's `modules` array.

```js
{
  module: "MMM-CyRide",
  position: "top_left", // customize to the position you want
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
| `rotationInterval` | `5000` | Milliseconds each page of routes stays visible before rotating. |
| `maxArrivalsPerRoute` | `2` | Number of arrival times to show under each route. |

### Find your Stop ID
To find your stop's ID, use this website [on this website](https://mycyride.com/arrivals). Choose a route that passes the relevant stop, then choose your stop from the list of stops. The stop ID is listed in bold after choosing a route and stop. In the image below, the stop ID is 2520.

![CyRide Route Finder Website Image](EstimatedArrivalTimes.png)

## Contributing
PRs welcome!

To develop on your local machine, install this module like normal (you may like to clone your own fork's code). Then, start your magic mirror install by running `npm start &`. This will show node_helper output in the terminal. Then, access your magic mirror and make the magic happen!

### Upcoming Features

- [ ] Don't paginate when only one or two routes
- [ ] Allow monitoring multiple stops

## Modernization Notes

This fork updates the original module to work with the current MyCyRide site.

The original module requested:

```text
https://mycyride.com/Stop/{stopID}/Arrivals?customerID={customerID}
```

That endpoint now returns the MyCyRide web app HTML instead of the JSON shape the module expected. The current implementation uses the newer RTPI API path through `node_helper.js`:

```text
https://mycyride.com/api/rtpi?path=stops/rtpi/{stopID}/arrivals
```

The helper exposes a local MagicMirror route:

```text
/MMM-CyRide/arrivals?stopID={stopID}&customerID={customerID}
```

The frontend calls that local route once for each configured stop, groups each returned flat arrival list by route, converts `secondsToArrival` into minutes, and renders the configured number of arrivals per route under each stop label.

Important implementation detail: the module stores arrival state in `this.cyRideStops`, not `this.data`. MagicMirror uses `this.data` internally for module metadata such as position, so overwriting it can break rendering.
