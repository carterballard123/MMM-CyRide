var NodeHelper = require("node_helper");
const fetch = require("node-fetch");
const getData = async (self) => {
  try {
    const response = await fetch(
      `https://mycyride.com/Stop/${self.STOP_ID}/Arrivals?customerID=${self.CUSTOMER_ID}`
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
    if (notification !== "MMM-CYRIDE-SET_CYRIDE_CONFIG") return;
    this.STOP_ID = payload.stopID;
    this.CUSTOMER_ID = payload.customerID;
    const upcomingStopsData = await getData(this); // get data on initial load
    this.sendSocketNotification("MMM-CYRIDE-STOPS_DATA", upcomingStopsData);
  }
});
