// const API_URL = "https://your-backend.com/api/check-url";
// const INCOGNITO_ALERT_URL = import.meta.env.VITE_BACKENDURL ;
// const ACTIVE_TAB_UPDATE_URL = `${import.meta.env.VITE_BACKENDURL}/api/monitor/active-tab`; // Backend endpoint to receive active tab data
const manifest = chrome.runtime.getManifest();
const BACKEND_URL = manifest.backend_url;
// console.log("Background worker loaded");

let currentTabId = null;
let currentUrl = null;
let intervalId = null;


// Monitor incognito window access permissions
function monitorIncognitoPermission() {
  // console.log('Monitoring Incognito Permission');

  setInterval(() => {
    chrome.extension.isAllowedIncognitoAccess((isAllowed) => {
      if (!isAllowed) {
        console.log("Incognito window detected without permission");
        alertIncognitoOpen("unknown"); // Send generic alert if incognito detected
      }
    });
  }, 600); // Check in one minute 
}
// Send alert if incognito is being used without permission
async function alertIncognitoOpen(url) {
  console.log("Incognito tab detected without permission. Sending alert to backend:", url);

  chrome.storage.local.get("token", async ({ token }) => {
    if (!token) {
      console.warn("No JWT token found.");
      return;
    }

    try {
      await fetch(`${BACKEND_URL}/api/monitor/incognito-alert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          incognitoDetected: true,
          url: url,
          timestamp: new Date().toISOString(),
        }),
      });
      console.log("Incognito alert sent successfully.");
    } catch (error) {
      console.error("Failed to send incognito alert:", error);
    }
  });
}

// Send the active tab information to the backend
async function updateActiveTabToBackend() {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTab = tabs[0];
console.log("request headed ")
    if (activeTab && activeTab.url) {
      const currentTabUrl = new URL(activeTab.url).hostname;
      console.log("Sending active tab data to backend:", currentTabUrl);

      chrome.storage.local.get("token", async ({ token }) => {
        if (!token) {
          console.warn("No JWT token found.");
          return;
        }

        try {
          await fetch(`${BACKEND_URL}/api/monitor/monitor-url`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              domain: currentTabUrl,
            }),
          });
          console.log("Active tab data sent successfully.");
        } catch (error) {
          console.error("Failed to send active tab data:", error);
        }
      });
    }
  });
}
// 
// Check if the URL is blocked or exceeds time limits
// async function checkUrlStatus(url) {
//   const data = { blocked: false, timeLimitExceeded: false };

//   // Check if the URL is blocked or exceeds time limits
//   if (url === 'codeforces.com') {
//     data.blocked = true;
//   }

//   if (data.blocked || data.timeLimitExceeded) {
//     chrome.tabs.query({}, (tabs) => {
//       tabs.forEach(tab => {
//         if (tab.url.includes(url)) {
//           chrome.scripting.executeScript({
//             target: { tabId: tab.id },
//             func: function () {
//               alert("This site is restricted!");
//             }
//           }).then(() => {
//             chrome.tabs.remove(tab.id);
//           });
//         }
//       });
//     });
//   }
// }

// Start tracking the URL on a set interval
// function startTracking(tabId, url) {
//   clearInterval(intervalId); // Clear any existing interval
//   currentTabId = tabId;
//   currentUrl = url;

//   intervalId = setInterval(() => {
//     checkUrlStatus(currentUrl);
//   }, 5000); // Check every 5 seconds
// }

// Monitor active tab and handle URL checks
// chrome.tabs.onActivated.addListener(async (activeInfo) => {
//   console.log("Tab activated", activeInfo.tabId);
//   const tab = await chrome.tabs.get(activeInfo.tabId);
//   if (tab.url && tab.url.startsWith("http")) {
//     if (tab.incognito) {
//       chrome.extension.isAllowedIncognitoAccess((isAllowed) => {
//         if (!isAllowed) {
//           alertIncognitoOpen(new URL(tab.url).hostname);
//         } else {
//           startTracking(tab.id, new URL(tab.url).hostname);
//         }
//       });
//     } else {
//       startTracking(tab.id, new URL(tab.url).hostname);
//     }
//   }
// });

// Monitor when a tab's URL is updated
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   console.log("Tab updated", changeInfo.url);

//   if (tab.active && changeInfo.url && changeInfo.url.startsWith("http")) {
//     if (tab.incognito) {
//       chrome.extension.isAllowedIncognitoAccess((isAllowed) => {
//         console.log("Is allowed incognito access?", isAllowed);
//         if (!isAllowed) {
//           alertIncognitoOpen(new URL(changeInfo.url).hostname);
//         } else {
//           startTracking(tab.id, new URL(changeInfo.url).hostname);
//         }
//       });
//     } else {
//       startTracking(tab.id, new URL(changeInfo.url).hostname);
//     }
//   }
// });
async function checkUrlWithBackend(url) {
  const token = await chrome.storage.local.get("token").then(res => res.token);
  if (!token) return { blocked: false };

  try {
    const res = await fetch(`${BACKEND_URL}/api/monitor/check-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return { blocked: false };
    return await res.json();  // Expected: { blocked: true/false }
  } catch {
    return { blocked: false };
  }
}

async function handleTabUrl(tabId, url) {
  const domain = new URL(url).hostname;
  const { blocked } = await checkUrlWithBackend(domain);

  if (blocked) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => alert("This site is restricted!")
    });
    chrome.tabs.remove(tabId);
  }
}

// Listen for tab updates or activation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.startsWith("http")) {
    handleTabUrl(tabId, changeInfo.url);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url && tab.url.startsWith("http")) {
    handleTabUrl(tab.id, tab.url);
  }
});


// Start monitoring for incognito access
monitorIncognitoPermission();

// Send active tab data to the backend every 60 seconds
setInterval(() => {
  updateActiveTabToBackend();
}, 60000); // Update backend every 1 minute
