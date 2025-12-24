import Child from "../models/child.js";
import { v4 as uuidv4 } from "uuid";
import Parent from '../models/parent.js'; 
import { generateToken } from "../utillity/jwt.js";
// import Child from '../models/Child.js';

// Create a new child for the parent
 export const createChild = async (req, res) => {
  const {  name ,email } = req.body;
  const parentEmail=req.user.email;
  // console.log(req.user)
  // console.log(req.body)
  try {
    // Find the parent by ID (assuming parent ID is available in the `req.parent` from middleware)
    const parent = await Parent.findOne({email :req.user.email});
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    // Create a new child instance
    const newChild = new Child({
      name, 
      email,
      parent: parent._id, // link the child to the parent
      extensionToken: uuidv4()
    });

    // Save the new child to the database
    await newChild.save();

    // Add this new child to the parent's children list
    parent.children.push(newChild._id);
    await parent.save();
    const token=generateToken(newChild.email)

    res.status(201).json({
      message: "Child created successfully",
      token: token,
    });
  } catch (err) {
    console.log(err.message)
    res.status(500).json({ message: err.message });
  }
};

// Get all children for logged-in parent
export const getChildren = async (req, res) => {
  try {
    const children = await Child.find({ parent: req.user.id });
    res.status(200).json(children);
  } catch (err) {
    res.status(500).json({ message: "Error fetching children", error: err.message });
  }
};

export const getWebUsageStats = async (req, res) => {
  try {
    // console.log(req.params)
    const { email } = req.params;
    const child = await Child.findOne({ email });
    if (!child) return res.status(404).json({ message: "Child not found" });

    const today = new Date().toISOString().split("T")[0];
    let totalSeconds = 0;

    child.monitoredUrls.forEach((url) => {
      const time = url.dailyTimeSpent.get(today) || 0;
      totalSeconds += time;
    });

    const hours = Math.floor(totalSeconds /(60*60));
    const minutes =  Math.floor(totalSeconds /(60))%60;
    const totalTime = `${hours}h ${minutes}m`;

    res.json({ totalTime });
  } catch (err) {
    console.error("Web usage error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
export const getAlerts = async (req, res) => {
  try {
    const { email } = req.params;
    const child = await Child.findOne({ email });
    if (!child) return res.status(404).json({ message: "Child not found" });

    res.json({ alerts: child.incognitoAlerts  });
  } catch (err) {
    console.error("Alerts fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
export const getBlockedStats = async (req, res) => {
  try {
    const { email } = req.params;
    const child = await Child.findOne({ email });
    if (!child) return res.status(404).json({ message: "Child not found" });

    res.json({ count: child.blockedUrls.length });
  } catch (err) {
    console.error("Blocked content fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
export const getWebUsageStatsFull = async (req, res) => {
  try {
    const { email } = req.params;
    const child = await Child.findOne({ email });
    if (!child) return res.status(404).json({ message: "Child not found" });

    const today = new Date().toISOString().split("T")[0];
    const webUsage = [];
    let totalSeconds = 0;

    child.monitoredUrls.forEach((urlObj) => {
      const time = urlObj.dailyTimeSpent.get(today) || 0;
      totalSeconds += time;

      webUsage.push({
        domain: urlObj.domain,
        minutes: time,
        category : urlObj.category,
        lastUpdated: urlObj.lastUpdated
      });
    });

    const hours = Math.floor(totalSeconds / 60*60);
    const minutes = Math.floor(totalSeconds / 60);

    res.json({
      totalTime: `${hours}h ${minutes}m`,
      usageDetails: webUsage
    });
  } catch (err) {
    console.error("Web usage error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// Get detailed incognito alerts
export const getAlertsFull = async (req, res) => {
  try {
    const { email } = req.params;
    const child = await Child.findOne({ email });
    if (!child) return res.status(404).json({ message: "Child not found" });

    const alerts = child.incognitoAlerts.map(alert => ({
      message: alert.message,
      timestamp: alert.timestamp
    }));

    res.json({ alerts });
  } catch (err) {
    console.error("Alerts fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const clearAlerts = async (req, res) => {
  try {
    const { email } = req.params;
    console.log("delete hiited")
    const child = await Child.findOne({ email });
    if (!child) return res.status(404).json({ message: "Child not found" });

    child.incognitoAlerts = []; // clear alerts
    await child.save();

    res.json({ message: "Alerts cleared" });
  } catch (err) {
    console.error("Clear alerts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get detailed blocked URLs
export const getBlockedStatsFull = async (req, res) => {
  try {
    const { email } = req.params;
    const child = await Child.findOne({ email });
    if (!child) return res.status(404).json({ message: "Child not found" });

    const blocked = child.blockedUrls.map(url => ({
      domain: url,
    }));

    res.json({ totalBlocked: blocked.length, blockedList: blocked });
  } catch (err) {
    console.error("Blocked content fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
export const getSearchActivities = async (req, res) => {
  try {
    const { timeFrame } = req.body;
    const { childEmail } = req.body;
    console.log("filtered hitted ")
    // console.log(timeFrame)
    // console.log(childEmail)


    if (!childEmail) return res.status(400).json({ message: "Child email is required" });

    const child = await Child.findOne({ email: childEmail });
    if (!child) return res.status(404).json({ message: "Child not found" });

    const dateLimit = (() => {
      const now = new Date();
      switch (timeFrame) {
        case "today": now.setHours(0, 0, 0, 0); return now;
        case "yesterday": now.setDate(now.getDate() - 1); now.setHours(0, 0, 0, 0); return now;
        case "week": now.setDate(now.getDate() - 7); return now;
        case "month": now.setDate(now.getDate() - 30); return now;
        default: return new Date(0);
      }
    })();
 console.log(timeFrame, child.monitoredUrls)
    const searches = (child.monitoredUrls || []).filter(search =>
    {  
      console.log(search.lastUpdated , dateLimit)
     return  new Date(search.lastUpdated) >= dateLimit
    }
    ).map(search => ({
      type: "search",
      content: search.domain,
      timestamp: search.lastUpdated,
    }));

    searches.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ activities: searches });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
