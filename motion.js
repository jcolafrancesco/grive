(() => {
  'use strict';

  const video = document.querySelector('#signal-video');
  const button = document.querySelector('#motion-toggle');
  const label = button.querySelector('.motion-label');
  const atmosphere = document.querySelector('.atmosphere');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const portraitViewport = window.matchMedia('(max-aspect-ratio: 1/1)');
  const connection = navigator.connection;
  let wantsPlayback = !reducedMotion.matches && !connection?.saveData;
  let failed = false;
  let playRequest = 0;

  const selectedSource = () => portraitViewport.matches ? video.dataset.srcPortrait : video.dataset.src;
  const updatePoster = () => {
    video.poster = portraitViewport.matches ? video.dataset.posterPortrait : video.dataset.poster;
  };

  video.muted = true;
  updatePoster();
  button.hidden = false;

  const updateControl = () => {
    const playing = !video.paused;
    button.classList.toggle('is-playing', playing);
    button.setAttribute('aria-label', playing ? 'Pause background video' : 'Play background video');
    label.textContent = playing ? 'Pause' : 'Play';
  };

  const play = async () => {
    if (failed || document.hidden) return;
    const request = ++playRequest;
    if (!video.getAttribute('src')) video.src = selectedSource();
    try {
      await video.play();
    } catch {
      // An old play request can reject after rotating or pausing the video.
      if (request !== playRequest) return;
      // Autoplay may be blocked, including by a phone's low-power mode.
      // Leave the still image and offer explicit playback instead.
      if (!document.hidden) wantsPlayback = false;
      updateControl();
    }
  };

  const pause = () => {
    playRequest++;
    video.pause();
  };

  video.addEventListener('playing', () => {
    atmosphere.classList.add('video-ready');
    updateControl();
  });
  video.addEventListener('play', updateControl);
  video.addEventListener('pause', updateControl);
  video.addEventListener('error', () => {
    playRequest++;
    failed = true;
    wantsPlayback = false;
    atmosphere.classList.remove('video-ready');
    button.hidden = true;
  });

  button.addEventListener('click', () => {
    wantsPlayback = video.paused;
    if (wantsPlayback) play();
    else pause();
  });

  portraitViewport.addEventListener('change', () => {
    const hadSource = Boolean(video.getAttribute('src'));
    pause();
    atmosphere.classList.remove('video-ready');
    video.removeAttribute('src');
    updatePoster();
    // Abort the previous download and release the previous video decoder.
    // With no src or source children, load() cannot fetch the other video.
    if (hadSource) video.load();
    failed = false;
    button.hidden = false;
    updateControl();
    if (wantsPlayback) play();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else if (wantsPlayback) play();
  });

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      wantsPlayback = false;
      pause();
    }
  });

  connection?.addEventListener?.('change', () => {
    if (connection.saveData) {
      wantsPlayback = false;
      pause();
    }
  });

  if (wantsPlayback) play();
})();
