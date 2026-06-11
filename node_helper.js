var NodeHelper = require("node_helper");
const fetch = require("node-fetch");
const getData = async (self) => {
  try {
    console.log("MMM-CyRide fetching arrivals for stop:", self.STOP_ID);
    const response = await fetch(
      `https://mycyride.com/api/rtpi?path=${encodeURIComponent(
        `stops/rtpi/${self.STOP_ID}/arrivals`
      )}`
    );
    console.log(
      "MMM-CyRide fetch status:",
      response.status,
      response.headers.get("content-type")
    );
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return {
        error: true,
        message: "CyRide returned a non-JSON response"
      };
    }
    const arrivals = await response.json();
    return arrivals.map((arrival) => ({
      route: {
        name: arrival.route && arrival.route.name,
        color: arrival.route && arrival.route.color
      },
      secondsToArrival: arrival.secondsToArrival,
      schedulePrediction: arrival.schedulePrediction
    }));
  } catch (e) {
    console.error("MMM-CyRide fetch failed:", e);
    return null;
  }
};
module.exports = NodeHelper.create({
  start: function () {
    console.log("Starting module: " + this.name);
    setInterval(async () => {
      if (this.STOP_ID && this.CUSTOMER_ID) {
        const upcomingStopsData = await getData(this);
console.log(
  "MMM-CyRide interval sending payload:",
  Array.isArray(upcomingStopsData),
  upcomingStopsData && upcomingStopsData.length
);
this.sendSocketNotification("MMM-CYRIDE-STOPS_DATA", upcomingStopsData);
      }
    }, 1 * 60 * 1000); // gets data from cyride every one minute
  },
  socketNotificationReceived: async function (notification, payload) {
    console.log(
      "MMM-CyRide helper received notification:",
      notification,
      payload
    );

    if (notification !== "MMM-CYRIDE-SET_CYRIDE_CONFIG") return;
    this.STOP_ID = payload.stopID;
    this.CUSTOMER_ID = payload.customerID;
    const upcomingStopsData = await getData(this); // get data on initial load
    console.log(
      "MMM-CyRide sending payload:",
      Array.isArray(upcomingStopsData),
      upcomingStopsData && upcomingStopsData.length
    );
    this.sendSocketNotification("MMM-CYRIDE-STOPS_DATA", upcomingStopsData);
  }
});
