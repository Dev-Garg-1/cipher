console.log("CipherGuard video script loaded");

/* ================= CONFIG ================= */

const VIDEO_API = "https://051a2f2d8c10.ngrok-free.app /check-video-frame";

const SCAN_INTERVAL = 3000; // 3 seconds
const monitoredVideos = new WeakSet();

/* ================= FRAME CAPTURE ================= */

function getFrameBase64(video) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg");
}

/* ================= ANALYSIS ================= */

async function analyzeVideoFrame(video) {
  if (
    video.paused ||
    video.ended ||
    video.readyState < 2 ||
    video.videoWidth === 0
  ) {
    return;
  }

  try {
    const frame = getFrameBase64(video);

    const res = await fetch(VIDEO_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: frame }),
    });

    const data = await res.json();

    if (data?.offensive === true) {
      video.classList.add("blurred-safe");
    } else {
      video.classList.remove("blurred-safe");
    }
  } catch (err) {
    console.error("CipherGuard video scan failed:", err);
  }
}

/* ================= MONITOR ================= */

function monitorVideo(video) {
  if (monitoredVideos.has(video)) return;
  monitoredVideos.add(video);

  const interval = setInterval(() => analyzeVideoFrame(video), SCAN_INTERVAL);

  video.addEventListener("ended", () => clearInterval(interval));
  video.addEventListener("pause", () => clearInterval(interval));
}

/* ================= INIT ================= */

function scanVideos(root = document) {
  root.querySelectorAll("video").forEach(monitorVideo);
}

scanVideos();

/* ================= OBSERVER ================= */

const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        if (node.tagName === "VIDEO") {
          monitorVideo(node);
        } else {
          scanVideos(node);
        }
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
