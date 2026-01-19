// Tab switching logic
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(target).classList.add('active');
    });
  });
}

// Saves options to chrome.storage
function save_options() {
  const settings = {
    // Twitter
    twitter_hideImages: document.getElementById('twitter_hideImages').checked,
    twitter_hideVideos: document.getElementById('twitter_hideVideos').checked,
    twitter_keywords: document.getElementById('twitter_keywords').value.split(',').map(k => k.trim()).filter(k => k !== ""),

    // YouTube
    youtube_hideThumbnails: document.getElementById('youtube_hideThumbnails').checked,
    youtube_hideVideos: document.getElementById('youtube_hideVideos').checked,
    youtube_keywords: document.getElementById('youtube_keywords').value.split(',').map(k => k.trim()).filter(k => k !== ""),

    // General
    grayscale: document.getElementById('grayscale').checked
  };

  chrome.storage.sync.set(settings, function () {
    const status = document.getElementById('status');
    status.textContent = 'Settings saved successfully!';
    setTimeout(function () {
      status.textContent = '';
    }, 2000);
  });
}

// Restores settings from chrome.storage
function restore_options() {
  chrome.storage.sync.get({
    twitter_hideImages: false,
    twitter_hideVideos: false,
    twitter_keywords: [],
    youtube_hideThumbnails: false,
    youtube_hideVideos: false,
    youtube_keywords: [],
    grayscale: false
  }, function (items) {
    // Twitter
    document.getElementById('twitter_hideImages').checked = items.twitter_hideImages;
    document.getElementById('twitter_hideVideos').checked = items.twitter_hideVideos;
    document.getElementById('twitter_keywords').value = items.twitter_keywords.join(', ');

    // YouTube
    document.getElementById('youtube_hideThumbnails').checked = items.youtube_hideThumbnails;
    document.getElementById('youtube_hideVideos').checked = items.youtube_hideVideos;
    document.getElementById('youtube_keywords').value = items.youtube_keywords.join(', ');

    // General
    document.getElementById('grayscale').checked = items.grayscale;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  restore_options();
});

document.getElementById('save').addEventListener('click', save_options);
