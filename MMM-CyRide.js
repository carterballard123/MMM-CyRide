Module.register("MMM-CyRide", {
  defaults: { stopID: "5108903", customerID: "187" },
  start: function () {
    this.page = 0;
    this.error = null;
    setTimeout(() => {
      this.sendSocketNotification("MMM-CYRIDE-SET_CYRIDE_CONFIG", this.config);
    }, 1000);
    setInterval(() => {
      this.updateDom(1000);
    }, 5000); // cycle displayed data every 5 seconds
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
  socketNotificationReceived: function (notification, payload) {
    if (notification !== "MMM-CYRIDE-STOPS_DATA") return;

    // Temporary checkpoint: shows that the browser-side handler started while
    // still allowing the parser below to continue running.
    this.error = "Reached CyRide handler before parser";
    this.updateDom();

    console.log(
      "MMM-CyRide received payload:",
      Array.isArray(payload),
      payload && payload.length
    );

    if (payload && payload.error) {
      this.data = null;
      this.error = payload.message;
      this.updateDom();
      return;
    }
    if (!payload) {
      this.data = null;
      this.error = "Unable to load CyRide arrivals";
      this.updateDom();
      return;
    }

    // Temporary checkpoint: confirms payload passed the early error/null checks.
    this.error = "Reached parser try block";
    this.updateDom();

    try {
      const arrivalsByRoute = {};

      // Temporary checkpoint: confirms execution entered the parser body.
      this.error = "Inside parser try block";
      this.updateDom();

      // The current CyRide API returns a flat list of arrivals, so group them by
      // route before passing the data to the existing display code.
      let validArrivals = 0;
      payload.forEach((arrival) => {
        const routeName = arrival.route && arrival.route.name;
        if (!routeName || typeof arrival.secondsToArrival !== "number") return;
        validArrivals += 1;

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

      // Temporary checkpoint: confirms the grouping loop processed arrivals.
      this.error = `Grouped ${validArrivals} valid arrivals into ${
        Object.keys(arrivalsByRoute).length
      } routes`;
      this.updateDom();

      const groupedRoutes = Object.values(arrivalsByRoute);

      // Temporary checkpoint: confirms the grouped route object became an array.
      this.error = `Object.values produced ${groupedRoutes.length} routes`;
      this.updateDom();

      // Keep the next two arrivals per route, matching the module's original behavior.
      this.data = groupedRoutes.map((route) => {
        route.stops = route.stops.slice(0, 2);
        return route;
      });

      // Temporary checkpoint: confirms this.data has the route array shape
      // expected by getDom before we allow the normal renderer to run.
      this.error = `Data array ready: ${Array.isArray(this.data)} with ${
        this.data.length
      } routes`;
      this.updateDom();
      return;

      // Temporary parser checkpoint: confirms the API payload was converted
      // into route groups before we debug the final rendering step.
      this.error = `Parsed ${this.data.length} CyRide routes`;
      this.updateDom();
      return;
    } catch (e) {
      this.data = null;
      this.error = `CyRide parser error: ${e.message}`;
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
