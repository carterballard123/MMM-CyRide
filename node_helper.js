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
    if (!response.ok) {
      return {
        error: true,
        message: `CyRide request failed with status ${response.status}`
      };
    }

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
    this.expressApp.get("/MMM-CyRide/arrivals", async (req, res) => {
      const stopID = req.query.stopID;
      const customerID = req.query.customerID;

      if (!stopID || !customerID) {
        res.status(400).json({
          error: true,
          message: "Missing CyRide stopID or customerID"
        });
        return;
      }

      // The browser calls this local route; the helper still owns the external
      // CyRide API request so the frontend never talks to MyCyRide directly.
      const upcomingStopsData = await getData({
        STOP_ID: stopID,
        CUSTOMER_ID: customerID
      });

      if (!upcomingStopsData) {
        res.status(502).json({
          error: true,
          message: "Unable to load CyRide arrivals"
        });
        return;
      }

      res.json(upcomingStopsData);
    });
  }
});
