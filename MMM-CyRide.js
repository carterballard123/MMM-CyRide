Module.register("MMM-CyRide", {
  defaults: {
    // stopID/stopLabel keep the original single-stop config style working.
    // New configs should prefer the stops array below.
    stopID: "5108903",
    customerID: "187",
    rotationInterval: 5000,
    maxArrivalsPerRoute: 2
  },
  start: function () {
    this.page = 0;
    this.cyRideStops = null;
    this.error = null;
    this.isLoadingCyRideData = false;

    // Fetch through the local MagicMirror helper route so node_helper.js owns
    // the external CyRide API request.
    this.loadCyRideData = async () => {
      if (this.isLoadingCyRideData) return;
      this.isLoadingCyRideData = true;

      try {
        if (!Array.isArray(this.cyRideStops)) {
          this.error = "Loading CyRide arrivals...";
          this.updateDom();
        }

        const stops = this.getConfiguredStops();
        const stopResults = await Promise.all(
          stops.map(async (stop) => {
            const params = new URLSearchParams({
              stopID: stop.stopID,
              customerID: this.config.customerID
            });

            const response = await fetch(`/MMM-CyRide/arrivals?${params}`);
            if (!response.ok) {
              throw new Error(`local route returned ${response.status}`);
            }

            const payload = await response.json();
            return {
              label: stop.label,
              stopID: stop.stopID,
              routes: this.parseCyRidePayload(payload)
            };
          })
        );

        this.cyRideStops = stopResults;
        this.error = null;
        this.updateDom();
      } catch (e) {
        if (!Array.isArray(this.cyRideStops)) this.cyRideStops = null;
        this.error = Array.isArray(this.cyRideStops)
          ? null
          : `Unable to load CyRide arrivals: ${e.message}`;
        this.updateDom();
      } finally {
        this.isLoadingCyRideData = false;
      }
    };

    setTimeout(() => {
      this.loadCyRideData();
    }, 1000);

    setInterval(() => {
      this.loadCyRideData();
    }, 1 * 60 * 1000);

    setInterval(() => {
      if (Array.isArray(this.cyRideStops)) this.updateDom(1000);
    }, this.config.rotationInterval); // cycle displayed data at the configured pace
  },
  getConfiguredStops: function () {
    // Modernized config: allow several labeled stops instead of only one stopID.
    if (Array.isArray(this.config.stops) && this.config.stops.length > 0) {
      return this.config.stops
        .filter((stop) => stop && stop.stopID)
        .map((stop) => ({
          stopID: String(stop.stopID),
          label: stop.label || `Stop ${stop.stopID}`
        }));
    }

    return [
      {
        stopID: String(this.config.stopID),
        label: this.config.stopLabel || `Stop ${this.config.stopID}`
      }
    ];
  },
  getDom: function () {
    var wrapper = document.createElement("div");
    wrapper.style = "text-align:left;max-width:350px;";

    if (this.error) {
      wrapper.innerHTML = this.error;
      return wrapper;
    }

    if (!Array.isArray(this.cyRideStops)) {
      wrapper.innerHTML = "Waiting for CyRide data...";
      return wrapper;
    }

    const title = document.createElement("h6");
    title.innerHTML = "CYRIDE | UPCOMING STOPS";
    title.style = "margin:0px;";
    wrapper.appendChild(title);

    this.cyRideStops.forEach((stopGroup) => {
      const stopHeader = document.createElement("h5");
      stopHeader.innerHTML = stopGroup.label;
      stopHeader.style = "margin:8px 0px 2px 0px;";
      wrapper.appendChild(stopHeader);

      stopGroup.routes.forEach((route, i) => {
        if (i % 2 !== this.page) return;
        let upcomingStops = [];
        route.stops.forEach((s) => {
          if (s.Minutes >= 0 && s.Minutes < 60) upcomingStops.push(s); // don't show stops with negative time or longer than an hour away
        });
        if (upcomingStops.length === 0) return;
        const container = document.createElement("div");
        const header = document.createElement("h5");
        header.style = "margin:0px;";
        const detailsContainer = document.createElement("div");
        const divider = document.createElement("hr");
        divider.style = "margin-top:0px;margin-bottom:5px;";

        upcomingStops.forEach((stop) => {
          if (stop.Time <= 0 || stop.Time > 60) return;
          const timeDetails = document.createElement("p");
          timeDetails.style = "font-size:20px;margin:0px;line-height:normal;";
          timeDetails.innerHTML = `${stop.Time} min${
            stop.Time === 1 ? "" : "s"
          } | ${stop.ArriveTime}${stop.IsLastStop ? " - LAST STOP" : ""}`;
          detailsContainer.appendChild(timeDetails);
        });

        let color = route.color || getColor(route.routeName);
        const box = document.createElement("div");
        box.style = `height:20px;width:20px;background-color:${color};display:inline-block;`;

        header.innerHTML = route.routeName;
        header.style =
          "display:inline-block;margin-left:12px;margin-top:0px;margin-bottom:0px;text-overflow:ellipsis;white-space:nowrap;width:270px;overflow:hidden;vertical-align:bottom";
        container.appendChild(box);
        container.appendChild(header);
        container.appendChild(divider);
        container.appendChild(detailsContainer);
        wrapper.appendChild(container);
      });
    });
    if (this.page === 1) this.page = 0;
    else if (this.page === 0) this.page = 1;
    return wrapper;
  },
  parseCyRidePayload: function (payload) {
    let stage = "checking payload";

    try {
      if (payload && payload.error) {
        throw new Error(payload.message);
      }

      if (!Array.isArray(payload)) {
        throw new Error("CyRide payload was not an array");
      }

      stage = "grouping arrivals";
      const arrivalsByRoute = {};

      // The current CyRide API returns a flat list of arrivals, so group them by
      // route before passing the data to the existing display code.
      payload.forEach((arrival) => {
        const routeName = arrival.route && arrival.route.name;
        if (!routeName || typeof arrival.secondsToArrival !== "number") return;

        const minutes = Math.max(1, Math.ceil(arrival.secondsToArrival / 60));

        // Create one display group per route the first time we see that route.
        if (!arrivalsByRoute[routeName]) {
          arrivalsByRoute[routeName] = {
            routeName: routeName,
            color: arrival.route.color,
            stops: []
          };
        }

        arrivalsByRoute[routeName].stops.push({
          Time: minutes,
          Minutes: minutes,
          ArriveTime: arrival.schedulePrediction ? "scheduled" : "live",
          IsLastStop: false
        });
      });

      stage = "building route list";
      const groupedRoutes = Object.values(arrivalsByRoute);

      stage = "saving parsed data";
      const maxArrivalsPerRoute = Number(this.config.maxArrivalsPerRoute) || 2;

      // Original behavior showed two arrivals per route. This is now
      // configurable so users can shrink or expand the display.
      return groupedRoutes.map((route) => ({
        routeName: route.routeName,
        color: route.color,
        stops: Array.isArray(route.stops)
          ? route.stops.slice(0, maxArrivalsPerRoute)
          : []
      }));
    } catch (e) {
      throw new Error(`CyRide frontend error at ${stage}: ${e.message}`);
    }
  }
});
const getColor = (routeName) => {
  // get color of route based on route number
  let color;
  switch (routeName.split(" ")[0]) {
    case "1":
      color = "red";
      break;
    case "2":
      color = "green";
      break;
    case "3":
      color = "blue";
      break;
    case "5":
      color = "yellow";
      break;
    case "6":
      color = "brown";
      break;
    case "7":
      color = "#8B008B"; // purple
      break;
    case "9":
      color = "#DDA0DD"; // plum
      break;
    case "11":
      color = "#7d161a"; // cherry
      break;
    case "12":
      color = "#C8A2C8"; // lilac
      break;
    case "14":
      color = "#FFE4C4"; // peach
      break;
    case "21":
      color = "#C8102E"; // ISU CARDINAL -- GO CLONES!!
      break;
    case "23":
      color = "orange";
      break;
    case "25":
      color = "#F1BE48"; // ISU GOLD -- GO CLONES!!
      break;
    default:
      color = "black"; // show nothing
  }
  return color;
};
