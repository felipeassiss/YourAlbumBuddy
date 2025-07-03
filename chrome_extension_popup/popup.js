const appContainer = document.getElementById('app-container');

function render(album) {
  const { artist, title, coverUrl } = album;
  const coverSrc = coverUrl ? `${coverUrl}?t=${new Date().getTime()}` : 'icon.png';

  const query = encodeURIComponent(`${artist} ${title}`);
  const youtubeQuery = encodeURIComponent(`${artist} ${title} full album`);
  const spotifyLink = `https://open.spotify.com/search/${query}`;
  const youtubeLink = `https://www.youtube.com/results?search_query=${youtubeQuery}`;
  const appleMusicLink = `https://music.apple.com/search?term=${query}`;

  const contentHTML = `
    <div class="album-presentation">
      <img src="${coverSrc}" class="album-cover" alt="Capa do ${title}">
      <div class="album-details">
        <h2 class="album-title">${title}</h2>
        <h3 class="album-artist">${artist}</h3>
      </div>
    </div>
    <div class="links-section">
      <p class="listen-on">Ouvir em:</p>
      <div class="streaming-links">
        <a href="${spotifyLink}" target="_blank" title="Ouvir no Spotify"><img src="icons/spotify.png" alt="Spotify"></a>
        <a href="${youtubeLink}" target="_blank" title="Ouvir no YouTube"><img src="icons/youtube.png" alt="YouTube"></a>
        <a href="${appleMusicLink}" target="_blank" title="Ouvir na Apple Music"><img src="icons/apple-music.png" alt="Apple Music"></a>
      </div>
    </div>
  `;
  appContainer.innerHTML = contentHTML;
}

function renderLoading() {
  appContainer.innerHTML = `<p class="loading-text">Buscando álbum de hoje...</p>`;
}

async function main() {
  const result = await chrome.storage.local.get(['dailyAlbum', 'lastUpdateDate']);
  const today = new Date().toISOString().split('T')[0];

  if (result.dailyAlbum && result.lastUpdateDate === today) {
    render(result.dailyAlbum);
  } else {
    renderLoading();
    chrome.runtime.sendMessage({ action: "forceUpdate" });
  }
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.dailyAlbum) {
    render(changes.dailyAlbum.newValue);
  }
});

main();