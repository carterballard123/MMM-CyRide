# MMM-CyRide

A [Magic Mirror](https://github.com/MichMich/MagicMirror) module to show upcoming CyRide routes near your location. CyRide is the public bus system in Ames, IA home of Iowa State University. Go Cyclones!

> **Modernized fork:** This version restores live CyRide arrival support using the current MyCyRide RTPI API. Older versions of this module used an endpoint that now returns the MyCyRide web app HTML instead of arrival JSON.

## Installation

To install MMM-CyRide, open the modules folder of your `MagicMirror` installation. Run the following commands:

- `git clone https://github.com/carterballard123/MMM-CyRide.git`
- `cd MMM-CyRide`
- `npm install`

This module uses `node-fetch@2` in `node_helper.js` to request CyRide arrival data.

To finish adding the module, follow the configuration settings below.

## Configuration

Add the following code to your Magic Mirror's `config.js` file's `modules` array.

```
{
  module: "MMM-CyRide",
  position: "top_left", // customize to the position you want
  config: {
    stopID: "ID OF STOP TO MONITOR",
    customerID: "187"
  }
}
```

### Configuration Options

| Option | Default | Description |
| --- | --- | --- |
| `stopID` | `"5108903"` | CyRide RTPI stop number to monitor. |
| `customerID` | `"187"` | MyCyRide customer ID. Kept configurable for compatibility with the MyCyRide API. |

### Find your Stop ID
To find your stop ID, visit [mycyride.com/arrivals](https://mycyride.com/arrivals). Choose a route that passes your stop, then choose the stop from the list. The stop ID is listed in bold after choosing a route and stop. In the image below, the stop ID is 2520.

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

The frontend calls that local route, groups the returned flat arrival list by route, converts `secondsToArrival` into minutes, and renders the next two arrivals per route.

Important implementation detail: the module stores arrival state in `this.cyRideRoutes`, not `this.data`. MagicMirror uses `this.data` internally for module metadata such as position, so overwriting it can break rendering.
