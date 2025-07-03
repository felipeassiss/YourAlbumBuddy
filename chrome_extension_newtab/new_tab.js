const appContainer = document.getElementById('app-container');
const welcomeMessageEl = document.getElementById('welcome-message');
const dateTimeEl = document.getElementById('date-time');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

function updateWelcomeInfo() {
  const now = new Date();
  const hours = now.getHours();

  let greeting;
  if (hours < 12) {
    greeting = 'Bom dia!';
  } else if (hours < 18) {
    greeting = 'Boa tarde!';
  } else {
    greeting = 'Boa noite!';
  }
  
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

  welcomeMessageEl.textContent = greeting;
  dateTimeEl.textContent = `${userTimezone.replace('_', ' ')} • ${now.toLocaleDateString('pt-BR', dateOptions)} • ${now.toLocaleTimeString('pt-BR', timeOptions)}`;
}

function handleSearch(event) {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (query) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.location.href = searchUrl;
  }
}

function renderAlbum(album) {
  const { artist, title, coverUrl } = album;
  const coverSrc = coverUrl ? coverUrl : chrome.runtime.getURL('icon.png');

  const query = encodeURIComponent(`${artist} ${title}`);
  const youtubeQuery = encodeURIComponent(`${artist} ${title} full album`);
  const spotifyLink = `https://open.spotify.com/search/${query}`;
  const youtubeLink = `https://www.youtube.com/results?search_query=${youtubeQuery}`;
  const appleMusicLink = `https://music.apple.com/search?term=${query}`;

  const contentHTML = `
    <div class="album-presentation">
      <img src="${coverSrc}" class="album-cover" alt="Capa do ${title}">
      <div class="album-details">
        <div>
            <h2 class="album-title">${title}</h2>
            <h3 class="album-artist">${artist}</h3>
        </div>
        <div class="links-section">
            <p class="listen-on">Ouvir em:</p>
            <div class="streaming-links">
                <a href="${spotifyLink}" target="_blank" title="Buscar no Spotify"><img src="${chrome.runtime.getURL('icons/spotify.png')}" alt="Spotify"></a>
                <a href="${youtubeLink}" target="_blank" title="Buscar no YouTube"><img src="${chrome.runtime.getURL('icons/youtube.png')}" alt="YouTube"></a>
                <a href="${appleMusicLink}" target="_blank" title="Buscar na Apple Music"><img src="${chrome.runtime.getURL('icons/apple-music.png')}" alt="Apple Music"></a>
            </div>
        </div>
      </div>
    </div>
  `;
  appContainer.innerHTML = contentHTML;
}

function renderLoading() {
  appContainer.innerHTML = `<p class="loading-text">Buscando álbum de hoje...</p>`;
}

async function initializeNewTab() {
  updateWelcomeInfo();
  setInterval(updateWelcomeInfo, 1000);

  searchForm.addEventListener('submit', handleSearch);

  const result = await chrome.storage.local.get(['dailyAlbum', 'lastUpdateDate']);
  const today = new Date().toISOString().split('T')[0];

  if (result.dailyAlbum && result.lastUpdateDate === today) {
    renderAlbum(result.dailyAlbum);
  } else {
    renderLoading();
    chrome.runtime.sendMessage({ action: "forceUpdate" });
  }
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.dailyAlbum) {
    renderAlbum(changes.dailyAlbum.newValue);
  }
});

initializeNewTab();