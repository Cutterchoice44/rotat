(function () {
  const API_KEY = "pk_0b8abc6f834b444f949f727e88a728e0";
  const STATION_ID = "cutters-choice-radio";
  const BASE_URL = "https://api.radiocult.fm/api";

  async function fetchSchedule(startDate, endDate) {
    const url = `${BASE_URL}/station/${STATION_ID}/schedule?startDate=${startDate}&endDate=${endDate}`;
    const res = await fetch(url, {
      headers: { 'x-api-key': API_KEY }
    });
    const data = await res.json();
    return data.schedules || [];
  }

  async function fetchArtists() {
    const url = `${BASE_URL}/station/${STATION_ID}/artists`;
    const res = await fetch(url, {
      headers: { 'x-api-key': API_KEY }
    });
    const data = await res.json();
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
    artEl.src = images[0]; // show first image immediately

    setInterval(() => {
      i = (i + 1) % images.length;
      artEl.src = images[i];
    }, 20000);
  }

  async function startRotation() {
    // always run rotation, regardless of "archive" text
    const now = new Date();
    const eightDaysLater = new Date(now);
    eightDaysLater.setDate(now.getDate() + 8);

    const schedules = await fetchSchedule(now.toISOString(), eightDaysLater.toISOString());
    const artists   = await fetchArtists();
    const validIds  = getUpcomingArtistIds(schedules);
    const filtered  = filterArtistsWithArtwork(artists, validIds);
    const artworkUrls = filtered.map(a => a.logo['512x512'] || a.logo.default);

    if (artworkUrls.length) {
      rotateArtwork(artworkUrls);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    startRotation();
  });
})();
