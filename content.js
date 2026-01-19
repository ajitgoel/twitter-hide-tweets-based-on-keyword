let settings = {
    twitter_hideImages: false,
    twitter_hideVideos: false,
    twitter_keywords: [],
    youtube_hideThumbnails: false,
    youtube_hideVideos: false,
    youtube_keywords: [],
    grayscale: false
};

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
    // Apply grayscale filter to body (Global)
    if (settings.grayscale) {
        document.body.style.filter = 'grayscale(100%)';
    } else {
        document.body.style.filter = '';
    }

    if (isTwitter) {
        const tweets = document.querySelectorAll('article[data-testid="tweet"]');
        tweets.forEach(tweet => filterTwitterContent(tweet));
    } else if (isYouTube) {
        filterYouTubeContent();
    }
}

// --- Twitter Logic ---
function filterTwitterContent(tweet) {
    if (settings.twitter_keywords && settings.twitter_keywords.length > 0) {
        const tweetText = tweet.innerText.toLowerCase();
        const shouldHide = settings.twitter_keywords.some(keyword => tweetText.includes(keyword.toLowerCase()));
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
    // 1. Hide Thumbnails
    if (settings.youtube_hideThumbnails) {
        const thumbnails = document.querySelectorAll('ytd-thumbnail, yt-image, .ytp-videowall-still-image');
        thumbnails.forEach(thumb => {
            thumb.style.visibility = 'hidden';
        });
    } else {
        const thumbnails = document.querySelectorAll('ytd-thumbnail, yt-image, .ytp-videowall-still-image');
        thumbnails.forEach(thumb => {
            thumb.style.visibility = 'visible';
        });
    }

    // 2. Hide Video Player
    if (settings.youtube_hideVideos) {
        const players = document.querySelectorAll('ytd-player, #player-container, .html5-video-player');
        players.forEach(player => {
            player.style.visibility = 'hidden';
        });
    } else {
        const players = document.querySelectorAll('ytd-player, #player-container, .html5-video-player');
        players.forEach(player => {
            player.style.visibility = 'visible';
        });
    }

    // 3. Keyword Filtering (Videos in feed/sidebar)
    if (settings.youtube_keywords && settings.youtube_keywords.length > 0) {
        const videoItems = document.querySelectorAll('ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer');
        videoItems.forEach(item => {
            const titleElement = item.querySelector('#video-title');
            if (titleElement) {
                const titleText = titleElement.innerText.toLowerCase();
                const shouldHide = settings.youtube_keywords.some(keyword => titleText.includes(keyword.toLowerCase()));
                if (shouldHide) {
                    item.style.display = 'none';
                } else {
                    item.style.display = '';
                }
            }
        });
    }
}

// --- Combined Observer ---
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
        // Debounce or just apply filters on any mutation for YT
        applyFilters();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

loadSettings();
