Module.register("MMM-CyRide", {
  defaults: { stopID: "5108903", customerID: "187" },
  start: function () {
    this.page = 0;
    this.error = "Frontend HTTP build started";
    this.debugTicks = 0;

    // Fetch through the local MagicMirror helper route. This keeps the CyRide
    // API call in node_helper.js but avoids the broken helper-to-frontend socket path.
    this.loadCyRideData = async () => {
      try {
        this.data = null;
        this.error = "Calling local CyRide route";
        this.updateDom();

        const params = new URLSearchParams({
          stopID: this.config.stopID,
          customerID: this.config.customerID
        });

        const response = await fetch(`/MMM-CyRide/arrivals?${params}`);
        const payload = await response.json();

        // Temporary HTTP checkpoint: proves the browser frontend can call the
        // local helper route before we debug parsing/rendering again.
        this.data = null;
        this.error = `HTTP route returned ${
          Array.isArray(payload) ? payload.length : "non-array"
        } arrivals`;
        this.updateDom();
        return;

        this.handleCyRidePayload(payload);
      } catch (e) {
        this.data = null;
        this.error = `Unable to load CyRide arrivals: ${e.message}`;
        this.updateDom();
      }
    };

    setInterval(() => {
      this.loadCyRideData();
    }, 1 * 60 * 1000);

    setInterval(() => {
      this.debugTicks += 1;
      this.data = null;
      this.error = `Frontend timer tick ${this.debugTicks}`;
      this.updateDom(1000);
    }, 5000); // cycle displayed data every 5 seconds
  },
  notificationReceived: function (notification) {
    if (notification === "DOM_OBJECTS_CREATED") {
      this.loadCyRideData();
    }
  },
  getDom: function () {
    var wrapper = document.createElement("div");
    wrapper.style = "text-align:left;max-width:350px;";

    if (this.error) {
      wrapper.innerHTML = this.error;
      return wrapper;
    }

    if (!Array.isArray(this.data)) {
      wrapper.innerHTML = "Waiting for CyRide data... frontend debug build";
      return wrapper;
    }

    const title = document.createElement("h6");
    title.innerHTML = "CYRIDE | UPCOMING STOPS";
    title.style = "margin:0px;";
    wrapper.appendChild(title);

    this.data.map((route, i) => {
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
    if (this.page === 1) this.page = 0;
    else if (this.page === 0) this.page = 1;
    return wrapper;
  },
  handleCyRidePayload: function (payload) {
    let stage = "checking payload";

    try {
      if (payload && payload.error) {
        this.data = null;
        this.error = payload.message;
        this.updateDom();
        return;
      }

      if (!Array.isArray(payload)) {
        this.data = null;
        this.error = "CyRide payload was not an array";
        this.updateDom();
        return;
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
      // Keep the next two arrivals per route, matching the module's original behavior.
      this.data = groupedRoutes.map((route) => ({
        routeName: route.routeName,
        color: route.color,
        stops: Array.isArray(route.stops) ? route.stops.slice(0, 2) : []
      }));

      this.error = null;
      this.updateDom();
      return;
    } catch (e) {
      this.data = null;
      this.error = `CyRide frontend error at ${stage}: ${e.message}`;
      this.updateDom();
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
