let settings = {
    hideImages: false,
    hideVideos: false,
    keywords: []
};

// Load settings from storage
function loadSettings() {
    chrome.storage.sync.get({
        hideImages: false,
        hideVideos: false,
        keywords: []
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
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    tweets.forEach(tweet => {
        filterTweet(tweet);
    });
}

function filterTweet(tweet) {
    // 1. Keyword Filtering
    if (settings.keywords && settings.keywords.length > 0) {
        const tweetText = tweet.innerText.toLowerCase();
        const shouldHide = settings.keywords.some(keyword => tweetText.includes(keyword.toLowerCase()));
        if (shouldHide) {
            tweet.style.display = 'none';
            return; // Already hidden, no need to check media
        } else {
            tweet.style.display = ''; // Reset display if it was hidden before
        }
    }

    // 2. Media Filtering
    if (settings.hideImages || settings.hideVideos) {
        // Select both images and videos/gifs containers
        const mediaContainers = tweet.querySelectorAll('[data-testid="tweetPhoto"], [data-testid="videoPlayer"], [data-testid="videoComponent"]');

        mediaContainers.forEach(container => {
            const isPhoto = container.getAttribute('data-testid') === 'tweetPhoto';
            const isVideo = container.getAttribute('data-testid') === 'videoPlayer' || container.getAttribute('data-testid') === 'videoComponent';

            if ((settings.hideImages && isPhoto) || (settings.hideVideos && isVideo)) {
                container.style.visibility = 'hidden';
                container.style.height = '0';
                container.style.margin = '0';
                container.style.padding = '0';
            } else {
                container.style.visibility = 'visible';
                container.style.height = '';
                container.style.margin = '';
                container.style.padding = '';
            }
        });
    }
}

// Observe for new tweets
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // Find tweets within the added node
                const tweets = node.querySelectorAll('article[data-testid="tweet"]');
                tweets.forEach(tweet => filterTweet(tweet));

                // Also check if the node itself is a tweet
                if (node.hasAttribute && node.getAttribute('data-testid') === 'tweet') {
                    filterTweet(node);
                }
            }
        });
    });
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Initial load
loadSettings();
