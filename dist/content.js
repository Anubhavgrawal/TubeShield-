//add remove ads
let lastAdState = false;
let adInterval = null;
let isAdPlaying = false;

function handleAds() {
  const player = document.querySelector(".html5-video-player");
  const video = document.querySelector("video");

  if (!player || !video) return;

  const adShowing = player.classList.contains("ad-showing");

  //  Ad detected
  if (adShowing) {
    // Ensure video is READY before skipping
    const isReady = video.readyState >= 2 && isFinite(video.duration);

    if (isReady) {
      // Skip safely
      video.currentTime = video.duration - 0.1;
      video.play().catch(() => {});

      if (!isAdPlaying) {
        isAdPlaying = true;
      }
    }
  }

  //  Ad finished
  if (!adShowing && isAdPlaying) {
    isAdPlaying = false;
  }

  //  SAFE cleanup (do NOT remove core player elements)
  document.querySelectorAll(
    ".ytp-ad-overlay-container, #player-ads"
  ).forEach(el => el.remove());

   //  Remove video overlay ads
  document.querySelectorAll(
    ".ytp-ad-overlay-container, #player-ads, .ytp-ad-overlay-container ,.ytp-ad-overlay-slot ,.ytp-ad-text-overlay ,.ytp-ad-image-overlay"
  ).forEach(el => el.remove());

  //  Remove homepage / feed ads
  document.querySelectorAll(
    "ytd-promoted-video-renderer, ytd-display-ad-renderer, ytd-ad-slot-renderer"
  ).forEach(el => el.remove());

  //  Remove sponsored shelves (optional but powerful)
  document.querySelectorAll(
    "ytd-rich-section-renderer"
  ).forEach(el => {
    if (el.innerText.toLowerCase().includes("sponsored")) {
      el.remove();
    }
  });
}

function startAdBlocker() {
  if (adInterval) return;

  adInterval = setInterval(handleAds, 300); // fast check
}

function stopAdBlocker() {
  if (adInterval) {
    clearInterval(adInterval);
    adInterval = null;
  }
}

function skipVideoAds() {
  const player = document.querySelector(".html5-video-player");
  const video = document.querySelector("video");

  if (!player || !video) return;

  const isAdPlaying = player.classList.contains("ad-showing");

  // Only act when state changes
  if (isAdPlaying && !lastAdState) {
    try {
      const duration = video.duration;
      if (isFinite(duration)) {
        video.currentTime = duration;
      }
    } catch (err) {
      console.error("Error skipping ad:", err);
    }
  }


  lastAdState = isAdPlaying;
}

// Function to remove banner, overlay, and sidebar ads
function removeAdElements() {
  const adSelectors = [
    ".ytp-ad-player-overlay",     // overlay text
    ".ytp-ad-overlay-container",  // banner ads inside video
    ".ytp-ad-module",             // whole ad module
    "#player-ads",                // ads near player
    "#masthead-ad",               // top masthead ad
    "#watch7-sidebar-ads",        // sidebar ads
    "ytd-promoted-video-renderer" // promoted videos in sidebar/feed
  ];

  adSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.remove();
    });
  });
}


// Check if shorts should be hidden or blocked when script loads
const applyShortsSettings = () => {
  const hideShorts = JSON.parse(localStorage.getItem("shortsHidden") || "false");
  const blockShorts = JSON.parse(localStorage.getItem("shortsBlocked") || "false");

  if (hideShorts) {
    hideShortsSection();
  }

  if (blockShorts) {
    blockShortsFunction();
  }
 
};

// Hide Shorts Section
const hideShortsSection = () => {
  const hide = () => {
    const shelves = document.querySelectorAll("ytd-rich-shelf-renderer[is-shorts]");
    shelves.forEach((shelf) => {
      shelf.style.display = "none";
    });
  };

  hide();
  setInterval(hide, 1000); // Keep hiding newly loaded shorts
};

// Block Shorts Navigation
const blockShortsFunction = () => {
  const block = () => {
    document.querySelectorAll('a[href*="/shorts/"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "https://www.youtube.com/";
      });
    });

    if (window.location.href.includes("/shorts/")) {
      window.location.href = "https://www.youtube.com/";
    }
  };

  block();
  setInterval(block, 1000); // Keep blocking new links
};

// Listen to popup messages
chrome.runtime.onMessage.addListener((request) => {
 
  if (request.action === "TOGGLE_REMOVE_ADS") {
      if (request.enabled) {
        startAdBlocker();
      } else {
        stopAdBlocker();
      }
  }
  
  if (request.action === "toggleHideShorts") {
    localStorage.setItem("shortsHidden", JSON.stringify(request.value));
    if (request.value) {
      hideShortsSection();
    } else {
      window.location.reload();
    }
  }

  if (request.action === "toggleBlockShorts") {
    localStorage.setItem("shortsBlocked", JSON.stringify(request.value));
    if (request.value) {
      blockShortsFunction();
    } else {
      window.location.reload();
    }
  }
});

chrome.storage.sync.get(["removeAdsEnabled"], (data) => {
  if (data.removeAdsEnabled) {
    startAdBlocker();
  }
});
// Run on load
applyShortsSettings();
