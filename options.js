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
    const twitterHideImages = document.getElementById('twitter_hideImages');
    const twitterHideVideos = document.getElementById('twitter_hideVideos');
    const twitterKeywords = document.getElementById('twitter_keywords');
    if (twitterHideImages) twitterHideImages.checked = items.twitter_hideImages;
    if (twitterHideVideos) twitterHideVideos.checked = items.twitter_hideVideos;
    if (twitterKeywords) twitterKeywords.value = items.twitter_keywords.join(', ');

    // YouTube
    const youtubeHideThumbnails = document.getElementById('youtube_hideThumbnails');
    const youtubeHideVideos = document.getElementById('youtube_hideVideos');
    const youtubeKeywords = document.getElementById('youtube_keywords');
    if (youtubeHideThumbnails) youtubeHideThumbnails.checked = items.youtube_hideThumbnails;
    if (youtubeHideVideos) youtubeHideVideos.checked = items.youtube_hideVideos;
    if (youtubeKeywords) youtubeKeywords.value = items.youtube_keywords.join(', ');

    // General
    const grayscale = document.getElementById('grayscale');
    if (grayscale) grayscale.checked = items.grayscale;
  });
}

// Export settings to a JSON file
function export_settings() {
  chrome.storage.sync.get(null, function (items) {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-filter-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    const status = document.getElementById('status');
    status.textContent = 'Settings exported!';
    setTimeout(() => status.textContent = '', 2000);
  });
}

// Import settings from a JSON file
function import_settings(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const settings = JSON.parse(e.target.result);
      chrome.storage.sync.set(settings, function () {
        restore_options();
        const status = document.getElementById('status');
        status.textContent = 'Settings imported successfully!';
        setTimeout(() => status.textContent = '', 2000);
      });
    } catch (err) {
      alert('Error parsing settings file. Please make sure it is a valid JSON file.');
    }
  };
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  restore_options();
});

const saveBtn = document.getElementById('save');
if (saveBtn) saveBtn.addEventListener('click', save_options);

const exportBtn = document.getElementById('export');
if (exportBtn) exportBtn.addEventListener('click', export_settings);

const importTrigger = document.getElementById('import-trigger');
const importFile = document.getElementById('import-file');
if (importTrigger && importFile) {
  importTrigger.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', import_settings);
}
