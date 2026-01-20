const isTwitter = window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com');
const isYouTube = window.location.hostname.includes('youtube.com');

// Load settings from storage
function loadSettings() {
    chrome.storage.sync.get({
        twitter_hideImages: false,
        twitter_hideVideos: false,
        twitter_keywords: [],
        youtube_hideThumbnails: false,
        youtube_hideVideos: false,
        youtube_keywords: [],
        grayscale: false
    }, function (items) {
        settings = items;
        applyFilters();
    });
}

// Watch for changes in settings
chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        settings[key] = newValue;
    }
    applyFilters();
});

function applyFilters() {
    // Apply grayscale filter (Global)
    applyGrayscaleStyle(settings.grayscale);

    if (isTwitter) {
        const tweets = document.querySelectorAll('article[data-testid="tweet"]');
        tweets.forEach(tweet => filterTwitterContent(tweet));
    } else if (isYouTube) {
        applyYouTubeStyles();
        filterYouTubeContent();
    }
}

function applyYouTubeStyles() {
    let styleEl = document.getElementById('content-filter-youtube-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'content-filter-youtube-styles';
        document.documentElement.appendChild(styleEl);
    }

    let css = '';

    // 1. Hide Thumbnails - Nuclear approach targeting all images in video containers
    if (settings.youtube_hideThumbnails) {
        css += `
            ytd-thumbnail img, 
            yt-image img, 
            .ytp-videowall-still-image, 
            #thumbnail img, 
            .ytd-moving-thumbnail-renderer img,
            ytd-playlist-video-thumbnail-renderer img,
            .yt-core-image--loaded,
            #avatar.ytd-video-owner-renderer img,
            .yt-img-shadow img,
            ytd-rich-grid-media #thumbnail,
            ytd-grid-video-renderer #thumbnail {
                visibility: hidden !important;
                display: none !important;
                background-color: #000 !important;
            }
        `;
    }

    // 2. Hide Video Player
    if (settings.youtube_hideVideos) {
        css += `
            ytd-player, 
            #player-container, 
            .html5-video-player, 
            video, 
            .html5-main-video,
            #ytd-player,
            .ytd-video-preview {
                visibility: hidden !important;
                background-color: #000 !important;
            }
        `;
    }

    styleEl.textContent = css;
}

function applyGrayscaleStyle(enabled) {
    let styleEl = document.getElementById('content-filter-grayscale-v2');
    if (enabled) {
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'content-filter-grayscale-v2';
            styleEl.textContent = `
                html { 
                    filter: grayscale(100%) !important; 
                }
            `;
            document.documentElement.appendChild(styleEl);
        }
    } else {
        if (styleEl) {
            styleEl.remove();
        }
    }
}

// --- Twitter Logic ---
function filterTwitterContent(tweet) {
    if (settings.twitter_keywords && settings.twitter_keywords.length > 0) {
        const tweetText = tweet.innerText.toLowerCase();
        // Case-insensitive check: compare toLowerCase to toLowerCase
        const shouldHide = settings.twitter_keywords.some(keyword => {
            if (!keyword) return false;
            return tweetText.includes(keyword.toLowerCase());
        });

        if (shouldHide) {
            tweet.style.display = 'none';
            return;
        } else {
            tweet.style.display = '';
        }
    }

    if (settings.twitter_hideImages || settings.twitter_hideVideos) {
        const mediaContainers = tweet.querySelectorAll('[data-testid="tweetPhoto"], [data-testid="videoPlayer"], [data-testid="videoComponent"]');
        mediaContainers.forEach(container => {
            const isPhoto = container.getAttribute('data-testid') === 'tweetPhoto';
            const isVideo = container.getAttribute('data-testid') === 'videoPlayer' || container.getAttribute('data-testid') === 'videoComponent';

            if ((settings.twitter_hideImages && isPhoto) || (settings.twitter_hideVideos && isVideo)) {
                container.style.visibility = 'hidden';
                container.style.height = '0';
            } else {
                container.style.visibility = 'visible';
                container.style.height = '';
            }
        });
    }
}

// --- YouTube Logic ---
function filterYouTubeContent() {
    // Keyword Filtering - Search broader containers for titles
    if (settings.youtube_keywords && settings.youtube_keywords.length > 0) {
        // Target all common video item containers
        const videoItems = document.querySelectorAll(`
            ytd-video-renderer, 
            ytd-rich-item-renderer, 
            ytd-compact-video-renderer, 
            ytd-grid-video-renderer, 
            ytd-playlist-renderer, 
            ytd-notification-renderer,
            ytd-rich-grid-media,
            ytd-video-renderer
        `);

        videoItems.forEach(item => {
            // Find anything that looks like a title
            const titleElement = item.querySelector('#video-title, #video-title-link, .title, #video-title-container, h3');
            if (titleElement) {
                const titleText = titleElement.innerText.toLowerCase();
                // Case-insensitive check
                const shouldHide = settings.youtube_keywords.some(keyword => {
                    if (!keyword) return false;
                    return titleText.includes(keyword.toLowerCase());
                });

                if (shouldHide) {
                    item.style.setProperty('display', 'none', 'important');
                } else {
                    item.style.display = '';
                }
            }
        });
    }
}

// --- Combined Observer ---
let filterTimeout;
const observer = new MutationObserver((mutations) => {
    if (isTwitter) {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const tweets = node.querySelectorAll('article[data-testid="tweet"]');
                    tweets.forEach(tweet => filterTwitterContent(tweet));
                    if (node.hasAttribute && node.getAttribute('data-testid') === 'tweet') {
                        filterTwitterContent(node);
                    }
                }
            });
        });
    } else if (isYouTube) {
        // More reactive timeout for YouTube
        if (filterTimeout) clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
            applyYouTubeStyles();
            filterYouTubeContent();
        }, 150);
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Initial load
loadSettings();
