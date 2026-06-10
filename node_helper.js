var NodeHelper = require("node_helper");
const fetch = require("node-fetch");
const getData = async (self) => {
  try {
    const response = await fetch(
      `https://mycyride.com/api/rtpi?path=${encodeURIComponent(
        `stops/rtpi/${self.STOP_ID}/arrivals`
      )}`
    );
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return {
        error: true,
        message: "CyRide returned a non-JSON response"
      };
    }
    const arrivals = await response.json();
    return arrivals;
  } catch (e) {
    console.error(e);
    return null;
  }
};
module.exports = NodeHelper.create({
  start: function () {
    console.log("Starting module: " + this.name);
    setInterval(async () => {
      if (this.STOP_ID && this.CUSTOMER_ID) {
        const upcomingStopsData = await getData(this);
        this.sendSocketNotification("MMM-CYRIDE-STOPS_DATA", upcomingStopsData);
      }
    }, 1 * 60 * 1000); // gets data from cyride every one minute
  },
  socketNotificationReceived: async function (notification, payload) {
    console.log("MMM-CyRide helper received notification:", notification, payload);
    
    if (notification !== "MMM-CYRIDE-SET_CYRIDE_CONFIG") return;
    this.STOP_ID = payload.stopID;
    this.CUSTOMER_ID = payload.customerID;
    const upcomingStopsData = await getData(this); // get data on initial load
    // console.log("MMM-CyRide sending payload:", upcomingStopsData); debug log to see raw payload from node_helper before sending to main module
    this.sendSocketNotification("MMM-CYRIDE-STOPS_DATA", upcomingStopsData);
  }
});
