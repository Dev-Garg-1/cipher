// const VIDEO_API = `${import.meta.env.VITE_BACKENDURL}/api/check-video-frame`;

// Convert canvas frame to base64
function getFrameBase64(video) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg");
}

// Analyze video frames
async function analyzeVideoFrame(video) {
  if (video.paused || video.ended || video.readyState < 2) return;

  const frame = getFrameBase64(video);

  try {
    const res = await fetch(VIDEO_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: frame }),
    });

    const data = await res.json();
    if (data.offensive) {
      video.style.filter = "blur(15px)";
      // Optional: video.pause();
    } else {
      video.style.filter = "none";
    }
  } catch (err) {
    console.error("Video API error:", err);
  }
}

// Start scanning all videos
function monitorVideos() {
  const videos = document.querySelectorAll("video");
  videos.forEach((video) => {
    setInterval(() => analyzeVideoFrame(video), 3000); // every 3s
  });
}

// Run on load
monitorVideos();

// Observe for dynamically added videos
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.tagName === "VIDEO" || node.querySelector?.("video")) {
        monitorVideos();
      }
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });
