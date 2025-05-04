(function () {
  console.log('🔥 slideshow.js loaded');
  const API_KEY = "pk_0b8abc6f834b444f949f727e88a728e0";
  const STATION_ID = "cutters-choice-radio";
  const BASE_URL = "https://api.radiocult.fm/api";

  async function fetchSchedule(startDate, endDate) {
    console.log(`→ fetchSchedule(${startDate}, ${endDate})`);
    const url = `${BASE_URL}/station/${STATION_ID}/schedule?startDate=${startDate}&endDate=${endDate}`;
    const res = await fetch(url, { headers: { 'x-api-key': API_KEY } });
    const data = await res.json();
    console.log('   schedule response', data.schedules);
    return data.schedules || [];
  }

  async function fetchArtists() {
    console.log('→ fetchArtists()');
    const url = `${BASE_URL}/station/${STATION_ID}/artists`;
    const res = await fetch(url, { headers: { 'x-api-key': API_KEY } });
    const data = await res.json();
    console.log('   artists response', data.artists && data.artists.length);
    return data.artists || [];
  }

  function getUpcomingArtistIds(schedule) {
    const ids = new Set();
    schedule.forEach(event => {
      (event.artistIds || []).forEach(id => ids.add(id));
    });
    return ids;
  }

  function filterArtistsWithArtwork(artists, validIds) {
    return artists.filter(artist =>
      validIds.has(artist.id) &&
      artist.logo &&
      (artist.logo['512x512'] || artist.logo.default)
    );
  }

  function rotateArtwork(images) {
    const artEl = document.getElementById("now-art");
    let i = 0;
    if (!artEl || images.length === 0) return;
    artEl.src = images[0];
    setInterval(() => {
      i = (i + 1) % images.length;
      artEl.src = images[i];
    }, 20000);
  }

  async function maybeStartRotation() {
    const archiveText = document.getElementById("now-archive")?.textContent.toLowerCase() || "";
    console.log('↪️ archiveText:', archiveText);
    const isArchive = archiveText.includes("archive") || archiveText.includes("now playing");
    console.log('   isArchive?', isArchive);
    if (!isArchive) return;

    const now = new Date();
    const eightDaysLater = new Date(now);
    eightDaysLater.setDate(now.getDate() + 8);

    const schedules = await fetchSchedule(now.toISOString(), eightDaysLater.toISOString());
    const artists   = await fetchArtists();
    const validIds  = getUpcomingArtistIds(schedules);
    const filtered  = filterArtistsWithArtwork(artists, validIds);
    const artworkUrls = filtered.map(a => a.logo['512x512'] || a.logo.default);
    console.log('   filtered artwork URLs:', artworkUrls);

    if (artworkUrls.length) rotateArtwork(artworkUrls);
  }

  document.addEventListener("DOMContentLoaded", () => {
    console.log('DOMContentLoaded fired');
    const archiveEl = document.getElementById("now-archive");
    if (!archiveEl) {
      console.warn("❌ #now-archive not found");
      return;
    }
    maybeStartRotation();
    const observer = new MutationObserver(() => maybeStartRotation());
    observer.observe(archiveEl, { childList: true, subtree: true, characterData: true });
  });
})();
