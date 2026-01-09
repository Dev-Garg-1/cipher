console.log("CipherGuard background service worker loaded");

/* ================= CONFIG ================= */

// 🔴 IMPORTANT: hardcode backend URL (manifest cannot store custom keys)
const BACKEND_URL = "https://1184a9b4b00e.ngrok-free.app";

/* ================= INCognito MONITOR ================= */

function monitorIncognitoPermission() {
  setInterval(() => {
    chrome.extension.isAllowedIncognitoAccess(isAllowed => {
      if (!isAllowed) {
        alertIncognitoOpen("unknown");
      }
    });
  }, 60000); // every 1 minute
}

async function alertIncognitoOpen(url) {
  const { token } = await chrome.storage.local.get("token");
  if (!token) return;

  try {
    await fetch(`${BACKEND_URL}/api/monitor/incognito-alert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        incognitoDetected: true,
        url,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error("Incognito alert failed", err);
  }
}

/* ================= ACTIVE TAB MONITOR ================= */

async function updateActiveTabToBackend() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab?.url?.startsWith("http")) return;

  const { token } = await chrome.storage.local.get("token");
  if (!token) return;

  const domain = new URL(tab.url).hostname;

  try {
    await fetch(`${BACKEND_URL}/api/monitor/monitor-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ domain }),
    });
  } catch (err) {
    console.error("Active tab update failed", err);
  }
}

/* ================= BLOCKED SITE CHECK ================= */

async function checkUrlWithBackend(domain) {
  const { token } = await chrome.storage.local.get("token");
  if (!token) return { blocked: false };

  try {
    const res = await fetch(`${BACKEND_URL}/api/monitor/check-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url: domain }),
    });

    if (!res.ok) return { blocked: false };
    return await res.json(); // { blocked: true/false }
  } catch (err) {
    console.error("URL check failed", err);
    return { blocked: false };
  }
}

async function handleTab(tabId, url) {
  try {
    const domain = new URL(url).hostname;
    const { blocked } = await checkUrlWithBackend(domain);

    if (blocked) {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () =>
          alert("This website is restricted by parental control."),
      });

      chrome.tabs.remove(tabId);
    }
  } catch {}
}

/* ================= TAB LISTENERS (MV3 SAFE) ================= */

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url?.startsWith("http")) {
    handleTab(tabId, changeInfo.url);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  if (tab.url?.startsWith("http")) {
    handleTab(tabId, tab.url);
  }
});

/* ================= START SERVICES ================= */

monitorIncognitoPermission();

setInterval(updateActiveTabToBackend, 60000); // every 1 minute
