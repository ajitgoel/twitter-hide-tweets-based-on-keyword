// Saves options to chrome.storage
function save_options() {
  const hideImages = document.getElementById('hideImages').checked;
  const hideVideos = document.getElementById('hideVideos').checked;
  const grayscale = document.getElementById('grayscale').checked;
  const keywords = document.getElementById('keywords').value.split(',').map(k => k.trim()).filter(k => k !== "");

  chrome.storage.sync.set({
    hideImages: hideImages,
    hideVideos: hideVideos,
    grayscale: grayscale,
    keywords: keywords
  }, function () {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Settings saved.';
    setTimeout(function () {
      status.textContent = '';
    }, 1000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    hideImages: false,
    hideVideos: false,
    grayscale: false,
    keywords: []
  }, function (items) {
    document.getElementById('hideImages').checked = items.hideImages;
    document.getElementById('hideVideos').checked = items.hideVideos;
    document.getElementById('grayscale').checked = items.grayscale;
    document.getElementById('keywords').value = items.keywords.join(', ');
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
