import { albums } from './albums.js';

let isUpdating = false;

async function fetchCoverArt(artist, title) {
  try {
    const headers = {
      'User-Agent': 'AlbumOfTheDayExtension/1.0 (youralbumbuddy@gmail.com)',
    };
    const query = encodeURIComponent(`release:"${title}" AND artist:"${artist}"`);
    const musicBrainzUrl = `https://musicbrainz.org/ws/2/release?query=${query}&fmt=json`;
    
    const mbResponse = await fetch(musicBrainzUrl, { headers });
    if (!mbResponse.ok) throw new Error('Falha na busca ao MusicBrainz');

    const mbData = await mbResponse.json();
    const releaseId = mbData.releases?.[0]?.id;
    
    if (!releaseId) return null;

    const coverArtUrl = `https://coverartarchive.org/release/${releaseId}`;
    const caResponse = await fetch(coverArtUrl, { headers });
    if (!caResponse.ok) return null;

    const caData = await caResponse.json();

    return caData.images?.[0]?.thumbnails.large?.replace(/^http:/, 'https:') ?? null;

  } catch (error) {
    console.error('Capa do álbum não encontrada.', error.message);
    return null;
  }
}

async function updateDailyAlbum() {
  if (isUpdating) {
    console.log('Atualização já em progresso, ignorando nova chamada.');
    return;
  }
  
  isUpdating = true;

  try {
    const album = albums[Math.floor(Math.random() * albums.length)];
    
    const coverUrl = await fetchCoverArt(album.artist, album.title);
    
    const dailyAlbum = { ...album, coverUrl };
    const today = new Date().toISOString().split('T')[0];

    await chrome.storage.local.set({ dailyAlbum, lastUpdateDate: today });
    console.log('Álbum do dia atualizado.', dailyAlbum);
  
  } catch (error) {
    console.error("Ocorreu um erro ao atualizar o álbum:", error);
  } finally {
    isUpdating = false;
  }
}

function scheduleNextUpdate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  chrome.alarms.create('dailyAlbumUpdate', { when: tomorrow.getTime() });
  console.log(`Próxima atualização agendada para: ${tomorrow.toLocaleString()}`);
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Buscando o primeiro álbum.');
  updateDailyAlbum();
  scheduleNextUpdate();
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'dailyAlbumUpdate') {
    console.log('Atualizando o álbum do dia.');
    updateDailyAlbum();
    scheduleNextUpdate();
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'forceUpdate') {
    console.log('Forçando a atualização do álbum.');
    updateDailyAlbum();
    return true;
  }
});