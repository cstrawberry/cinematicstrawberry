(() => {
    const trigger = document.querySelector('.pu-video-trigger');
    const banner = document.querySelector('.pu-video-banner');
    const lightbox = document.getElementById('puVideoLightbox');

    if (!trigger || !banner || !lightbox) {
        return;
    }

    const audio = lightbox.querySelector('.pu-video-audio');
    const closeButton = lightbox.querySelector('.pu-video-close');
    const playerFrame = lightbox.querySelector('.pu-video-frame');
    const screen = lightbox.querySelector('.pu-video-screen');
    const playButton = lightbox.querySelector('[data-pu-play]');
    const replayButton = lightbox.querySelector('[data-pu-replay]');
    const progress = lightbox.querySelector('[data-pu-progress]');
    const timeLabel = lightbox.querySelector('[data-pu-time]');
    const captionsToggle = lightbox.querySelector('[data-pu-captions]');
    const muteButton = lightbox.querySelector('[data-pu-mute]');
    const fullscreenButton = lightbox.querySelector('[data-pu-fullscreen]');
    const volume = lightbox.querySelector('[data-pu-volume]');
    const caption = lightbox.querySelector('.pu-video-caption');
    const endedPanel = lightbox.querySelector('.pu-video-ended');

    if (!audio || !closeButton || !playerFrame || !screen || !playButton || !replayButton || !progress || !timeLabel || !captionsToggle || !muteButton || !volume || !caption || !endedPanel) {
        return;
    }

    const audioSrc = lightbox.dataset.audioSrc;
    const subtitlesSrc = lightbox.dataset.subtitlesSrc;
    const cosmicSrc = lightbox.dataset.cosmicSrc;
    const playerCssHref = lightbox.dataset.playerCss;
    const endLogoSrc = lightbox.dataset.endLogoSrc || '../../images/logo-transparent.png';
    const endFadeStart = 517;
    const visualDuration = 525;
    let playerCssRequested = false;
    let cues = [];
    let subtitlePromise;
    let cueIndex = -1;
    let isSeeking = false;
    let fallbackDuration = 0;
    let endFadeLayer;
    let endFadeLogo;
    let visualExtensionTime = 0;
    let visualExtensionFrame = 0;
    let endFadeFrame = 0;
    let visualExtensionBaseTime = 0;
    let visualExtensionStartedAt = 0;
    let isVisualExtensionPlaying = false;
    const initialVolume = Number(volume.value) || 0.8;
    audio.volume = Math.max(0, Math.min(initialVolume, 1));
    volume.value = String(audio.volume);
    let lastVolume = audio.volume || 0.8;
    let fullscreenControlsTimer = 0;
    let fallbackFullscreenActive = false;
    let theaterSettleTimer = 0;
    let inlinePlayerReady = false;
    let audioReady = false;
    let cosmicScriptRequested = false;
    let visualImage = null;
    let desktopFullscreenVisualImage = null;
    let desktopFullscreenVisualSrc = "";
    let desktopFullscreenVisualLoaded = false;
    let desktopFullscreenVisualLoading = false;

    audio.preload = 'none';

    const getBestBannerSource = (image) => {
        if (image == null) {
            return String();
        }

        return image.currentSrc || image.src || image.getAttribute('src') || image.dataset.fullSrc || String();
    };

    const setScreenFallbackImage = (src) => {
        if (src === String()) {
            return;
        }

        screen.style.backgroundImage = 'url(' + encodeURI(String(src)) + ')';
        screen.style.backgroundSize = 'cover';
        screen.style.backgroundPosition = 'center center';
        screen.style.backgroundColor = '#000';
    };

    const forceInlineRepaint = () => {
        void screen.offsetHeight;
    };

    const ensureAudioReady = () => {
        if (audioReady || !audioSrc) {
            return;
        }

        audioReady = true;
        audio.preload = 'auto';
        audio.src = audioSrc;
        audio.load();
    };

    const loadPlayerCss = () => {
        const existingLink = document.querySelector('link[data-pu-player-css]');

        if (existingLink) {
            if (existingLink.rel !== 'stylesheet') {
                existingLink.onload = null;
                existingLink.rel = 'stylesheet';
            }
            return;
        }

        if (playerCssRequested || !playerCssHref) {
            return;
        }

        playerCssRequested = true;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = playerCssHref;
        link.dataset.puPlayerCss = 'true';
        document.head.appendChild(link);
    };

    const getVisualAttributes = (image) => ({
        src: image.getAttribute('src') || '',
        srcset: image.getAttribute('srcset') || '',
        sizes: image.getAttribute('sizes') || '',
    });

    const applyVisualAttributes = (image, attributes) => {
        if (!image || !attributes) {
            return;
        }

        if (attributes.srcset) {
            image.setAttribute('srcset', attributes.srcset);
        } else {
            image.removeAttribute('srcset');
        }

        if (attributes.sizes) {
            image.setAttribute('sizes', attributes.sizes);
        } else {
            image.removeAttribute('sizes');
        }

        if (attributes.src) {
            image.setAttribute('src', attributes.src);
        }
    };

    const loadCosmicScript = () => {
        if (cosmicScriptRequested || !cosmicSrc) {
            return;
        }

        cosmicScriptRequested = true;
        const script = document.createElement('script');
        script.src = cosmicSrc;
        script.defer = true;
        document.body.appendChild(script);
    };

    const ensureEndFadeLayer = () => {
        if (endFadeLayer) {
            return;
        }

        endFadeLayer = document.createElement('div');
        endFadeLayer.className = 'pu-video-end-fade';
        endFadeLayer.setAttribute('aria-hidden', 'true');

        endFadeLogo = document.createElement('img');
        endFadeLogo.className = 'pu-video-end-logo';
        endFadeLogo.alt = '';
        endFadeLogo.width = 64;
        endFadeLogo.height = 64;
        endFadeLogo.decoding = 'async';

        endFadeLayer.appendChild(endFadeLogo);
        screen.appendChild(endFadeLayer);
    };

    const ensureEndFadeLogoLoaded = () => {
        if (!endFadeLogo || endFadeLogo.getAttribute('src')) {
            return;
        }

        endFadeLogo.src = endLogoSrc;
    };

    const updateEndFade = function (time) {
        ensureEndFadeLayer();

        const fadeProgress = Math.max(0, Math.min(1, (time - endFadeStart) / (visualDuration - endFadeStart)));
        const smoothBlackProgress = fadeProgress * fadeProgress * (3 - (2 * fadeProgress));
        const logoFadeStart = endFadeStart + 1;
        const logoProgress = Math.max(0, Math.min(1, (time - logoFadeStart) / (visualDuration - logoFadeStart)));
        const smoothLogoProgress = logoProgress * logoProgress * (3 - (2 * logoProgress));
        const visualOpacity = 1 - smoothBlackProgress;
        audio.dataset.puVisualTime = String(time);
        audio.dataset.puVisualActive = isVisualExtensionPlaying ? 'true' : 'false';
        playerFrame.style.setProperty('--pu-end-visual-opacity', String(visualOpacity));

        if (time >= endFadeStart - 2) {
            ensureEndFadeLogoLoaded();
        }

        endFadeLayer.style.opacity = String(smoothBlackProgress);
        endFadeLogo.style.opacity = String(smoothLogoProgress);
        endFadeLayer.classList.toggle('is-visible', Boolean(fadeProgress));
    };

    const getAudioDuration = () => {
        return Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    };

    const cancelVisualExtensionFrame = function () {
        if (visualExtensionFrame) {
            window.cancelAnimationFrame(visualExtensionFrame);
            visualExtensionFrame = 0;
        }
    };

    const cancelEndFadeFrame = function () {
        if (endFadeFrame) {
            window.cancelAnimationFrame(endFadeFrame);
            endFadeFrame = 0;
        }
    };

    const frameEndFade = function () {
        if (audio.paused) {
            endFadeFrame = 0;
            return;
        }

        if (audio.ended) {
            endFadeFrame = 0;
            return;
        }

        if (isVisualExtensionPlaying) {
            endFadeFrame = 0;
            return;
        }

        const currentTime = audio.currentTime || 0;
        visualExtensionTime = currentTime;
        updateEndFade(currentTime);
        updateCaption();
        updateProgress();

        if (Math.min(currentTime, visualDuration) !== visualDuration) {
            endFadeFrame = window.requestAnimationFrame(frameEndFade);
            return;
        }

        endFadeFrame = 0;
    };

    const startEndFadeFrame = function () {
        if (endFadeFrame) {
            return;
        }

        if (audio.paused) {
            return;
        }

        if (audio.ended) {
            return;
        }

        if (isVisualExtensionPlaying) {
            return;
        }

        const currentTime = audio.currentTime || 0;

        if (Math.max(currentTime, endFadeStart - 0.25) !== currentTime) {
            return;
        }

        endFadeFrame = window.requestAnimationFrame(frameEndFade);
    };

    const getPlaybackTime = function () {
        const audioTime = audio.currentTime || 0;

        if (isVisualExtensionPlaying) {
            return visualExtensionTime;
        }

        if (audio.ended && visualExtensionTime > audioTime) {
            return visualExtensionTime;
        }

        return audioTime || visualExtensionTime || 0;
    };
    const isPlaybackActive = () => {
        return isVisualExtensionPlaying || (!audio.paused && !audio.ended);
    };

    const setupInlineBannerPlayer = () => {
        loadPlayerCss();

        if (inlinePlayerReady) {
            return;
        }

        const sourceImage = trigger.querySelector('img');
        const playIndicator = trigger.querySelector('.pu-video-play-indicator');

        banner.classList.add('pu-video-inline-player');
        playerFrame.classList.add('pu-video-inline-frame');
        screen.classList.add('pu-video-inline-screen');
        screen.setAttribute('role', 'button');
        screen.setAttribute('tabindex', '0');
        screen.setAttribute('aria-label', 'Play or pause Predictive Universe audio');

        if (sourceImage && screen.querySelector('.pu-video-banner-visual') === null) {
            const fallbackVisualSrc = getBestBannerSource(sourceImage);
            const visual = sourceImage;
            visual.className = 'pu-video-banner-visual';
            visual.alt = '';
            visual.decoding = 'async';
            visual.removeAttribute('srcset');
            visual.removeAttribute('sizes');

            if (fallbackVisualSrc) {
                visual.src = fallbackVisualSrc;
                setScreenFallbackImage(fallbackVisualSrc);
            }

            visual.setAttribute('aria-hidden', 'true');
            visual.setAttribute('role', 'presentation');
            visualImage = visual;
            desktopFullscreenVisualSrc = sourceImage.dataset.fullSrc || sourceImage.dataset.desktopFullscreenSrc || '';
            screen.prepend(visual);

            if (desktopFullscreenVisualSrc) {
                desktopFullscreenVisualImage = document.createElement('img');
                desktopFullscreenVisualImage.className = 'pu-video-banner-visual pu-video-banner-visual-fullscreen';
                desktopFullscreenVisualImage.alt = '';
                desktopFullscreenVisualImage.width = 2752;
                desktopFullscreenVisualImage.height = 1536;
                desktopFullscreenVisualImage.decoding = 'async';
                desktopFullscreenVisualImage.hidden = true;
                desktopFullscreenVisualImage.setAttribute('aria-hidden', 'true');
                desktopFullscreenVisualImage.setAttribute('role', 'presentation');
                visual.insertAdjacentElement('afterend', desktopFullscreenVisualImage);
            }
        }

        if (playIndicator) {
            playIndicator.classList.add('pu-video-inline-start');
            screen.appendChild(playIndicator);
        }

        ensureEndFadeLayer();
        updateEndFade(0);

        banner.replaceChildren(playerFrame);
        banner.appendChild(audio);
        forceInlineRepaint();
        lightbox.hidden = true;
        lightbox.setAttribute('aria-hidden', 'true');
        inlinePlayerReady = true;
        document.dispatchEvent(new CustomEvent('pu:inline-ready'));
    };

    trigger.addEventListener('pointerenter', () => {
        setupInlineBannerPlayer();
        ensureAudioReady();
        loadPlayerCss();
        preloadDesktopFullscreenVisual();
    }, { once: true, passive: true });
    trigger.addEventListener('focus', () => {
        setupInlineBannerPlayer();
        ensureAudioReady();
        loadPlayerCss();
        preloadDesktopFullscreenVisual();
    }, { once: true });

    const parseTime = (value) => {
        const match = value.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);

        if (!match) {
            return 0;
        }

        return (Number(match[1]) * 3600) + (Number(match[2]) * 60) + Number(match[3]) + (Number(match[4]) / 1000);
    };

    const cleanCaptionText = (value) => {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = value.replace(/<[^>]*>/g, '');
        return textarea.value.replace(/\s+/g, ' ').trim();
    };

    const preventCaptionOrphan = (value) => {
        const words = value.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);

        if (words.length < 2) {
            return value;
        }

        if (words.length === 2) {
            return words[0] + '\u00A0' + words[1];
        }

        return words.slice(0, -2).join(' ') + ' ' + words[words.length - 2] + '\u00A0' + words[words.length - 1];
    };

    const parseSrt = (raw) => {
        const blocks = raw.replace(/^\uFEFF/, '').replace(/\r/g, '').trim().split(/\n{2,}/);
        const parsed = [];

        blocks.forEach((block) => {
            const lines = block.split('\n');
            const timeLineIndex = lines.findIndex((line) => line.includes('-->'));

            if (timeLineIndex === -1) {
                return;
            }

            const timing = lines[timeLineIndex].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);

            if (!timing) {
                return;
            }

            const text = cleanCaptionText(lines.slice(timeLineIndex + 1).join('\n'));

            if (!text) {
                return;
            }

            parsed.push({
                start: parseTime(timing[1]),
                end: parseTime(timing[2]),
                text,
            });
        });

        if (!parsed.length) {
            return [];
        }

        const offset = parsed[0].start;

        return parsed.map((cue) => ({
            start: Math.max(0, cue.start - offset),
            end: Math.max(0, cue.end - offset),
            text: cue.text,
        }));
    };

    const loadSubtitles = () => {
        if (subtitlePromise) {
            return subtitlePromise;
        }

        subtitlePromise = fetch(subtitlesSrc)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Unable to load subtitles: ${response.status}`);
                }

                return response.text();
            })
            .then((text) => {
                cues = parseSrt(text);
                fallbackDuration = cues.length ? cues[cues.length - 1].end : 0;
                updateCaption();
            })
            .catch(() => {
                cues = [];
                caption.textContent = 'Subtitles unavailable.';
            });

        return subtitlePromise;
    };

    const formatTime = (seconds) => {
        if (!Number.isFinite(seconds) || seconds < 0) {
            return '0:00';
        }

        const total = Math.floor(seconds);
        const minutes = Math.floor(total / 60);
        const remainingSeconds = String(total % 60).padStart(2, '0');

        return `${minutes}:${remainingSeconds}`;
    };

    const getDuration = () => {
        return Math.max(getAudioDuration(), fallbackDuration, visualDuration);
    };

    const getCueIndex = (time) => {
        if (!cues.length) {
            return -1;
        }

        if (cueIndex >= 0 && cues[cueIndex] && time >= cues[cueIndex].start && time < cues[cueIndex].end) {
            return cueIndex;
        }

        return cues.findIndex((cue) => time >= cue.start && time < cue.end);
    };

    const updateCaption = () => {
        if (captionsToggle.getAttribute('aria-pressed') === 'false') {
            caption.classList.add('is-hidden');
            return;
        }

        caption.classList.remove('is-hidden');
        const nextCueIndex = getCueIndex(getPlaybackTime());
        cueIndex = nextCueIndex;
        caption.textContent = nextCueIndex >= 0 ? preventCaptionOrphan(cues[nextCueIndex].text) : '';
    };

    const updateProgress = () => {
        const duration = getDuration();
        const currentTime = getPlaybackTime();

        if (!isSeeking && duration > 0) {
            progress.value = Math.round((currentTime / duration) * Number(progress.max));
        }

        timeLabel.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    };

    const syncTheaterState = (isPlaying) => {
        if (theaterSettleTimer) {
            window.clearTimeout(theaterSettleTimer);
            theaterSettleTimer = 0;
        }

        if (isPlaying) {
            document.body.classList.add('pu-theater-active', 'pu-theater-settle');
            return;
        }

        document.body.classList.remove('pu-theater-active');

        if (!document.body.classList.contains('pu-theater-settle')) {
            return;
        }

        theaterSettleTimer = window.setTimeout(() => {
            document.body.classList.remove('pu-theater-settle');
            theaterSettleTimer = 0;
        }, 2300);
    };

    const updatePlayButton = () => {
        const isPlaying = isPlaybackActive();
        playerFrame.classList.toggle('is-playing', isPlaying);
        banner.classList.toggle('is-playing', isPlaying);
        playButton.classList.toggle('is-playing', isPlaying);
        syncTheaterState(isPlaying);
        playButton.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
        playButton.title = isPlaying ? 'Pause' : 'Play';
    };

    const updateCaptionsButton = () => {
        const captionsOn = captionsToggle.getAttribute('aria-pressed') !== 'false';
        captionsToggle.classList.toggle('is-active', captionsOn);
        captionsToggle.setAttribute('aria-label', captionsOn ? 'Hide subtitles' : 'Show subtitles');
        captionsToggle.title = captionsOn ? 'Hide subtitles' : 'Show subtitles';
    };

    const updateMuteButton = () => {
        const isMuted = audio.muted || audio.volume === 0;
        muteButton.classList.toggle('is-muted', isMuted);
        muteButton.setAttribute('aria-label', isMuted ? 'Unmute' : 'Mute');
        muteButton.title = isMuted ? 'Unmute' : 'Mute';
    };

    const updateFullscreenButton = () => {
        if (!fullscreenButton) {
            return;
        }

        const fullscreen = isPlayerFullscreen();
        fullscreenButton.classList.toggle('is-fullscreen', fullscreen);
        fullscreenButton.setAttribute('aria-label', fullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
        fullscreenButton.title = fullscreen ? 'Exit fullscreen' : 'Fullscreen';
    };

    const getFullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;

    const isNativePlayerFullscreen = () => getFullscreenElement() === playerFrame;

    const isPlayerFullscreen = () => isNativePlayerFullscreen() || fallbackFullscreenActive;

    const setFallbackFullscreen = (active) => {
        fallbackFullscreenActive = active;
        document.body.classList.toggle('pu-video-fallback-fullscreen', active);
        playerFrame.classList.toggle('is-fallback-fullscreen', active);
        playerFrame.classList.toggle('is-fullscreen-mode', isPlayerFullscreen());
        updateFullscreenButton();
        updateFullscreenVisual();
        showFullscreenControls();
    };

    const enterFallbackFullscreen = () => {
        setFallbackFullscreen(true);
    };

    const exitFallbackFullscreen = () => {
        setFallbackFullscreen(false);
    };

    const requestPlayerFullscreen = () => {
        const requestFullscreen = playerFrame.requestFullscreen || playerFrame.webkitRequestFullscreen;

        if (requestFullscreen) {
            const result = requestFullscreen.call(playerFrame);

            if (result && typeof result.catch === 'function') {
                result.catch(enterFallbackFullscreen);
            }

            return;
        }

        enterFallbackFullscreen();
    };

    const exitPlayerFullscreen = () => {
        if (fallbackFullscreenActive) {
            exitFallbackFullscreen();
            return;
        }

        const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;

        if (isNativePlayerFullscreen() && exitFullscreen) {
            exitFullscreen.call(document);
        }
    };

    const toggleFullscreen = () => {
        if (isPlayerFullscreen()) {
            exitPlayerFullscreen();
        } else {
            requestPlayerFullscreen();
        }

        showFullscreenControls();
    };

    const clearFullscreenControlsTimer = () => {
        if (fullscreenControlsTimer) {
            window.clearTimeout(fullscreenControlsTimer);
            fullscreenControlsTimer = 0;
        }
    };

    const isMobileViewport = () => {
        if (!window.matchMedia) {
            return window.innerWidth <= 720;
        }

        return window.matchMedia('(max-width: 720px), (pointer: coarse) and (max-width: 1024px), (pointer: coarse) and (max-height: 720px)').matches;
    };

    const isLandscapeViewport = () => window.innerWidth > window.innerHeight;

    const shouldKeepControlsVisible = () => isMobileViewport() && (!isPlayerFullscreen() || !isLandscapeViewport());

    const isDesktopFullscreenVisualMode = () => {
        return Boolean(visualImage && desktopFullscreenVisualSrc && playerFrame.classList.contains('is-started'));
    };

    const notifyVisualResolutionChange = () => {
        document.dispatchEvent(new CustomEvent('pu:visual-resolution-change'));
    };

    const applyNormalVisual = () => {
        if (desktopFullscreenVisualImage) {
            desktopFullscreenVisualImage.hidden = true;
        }

        if (!playerFrame.classList.contains('is-using-desktop-fullscreen-visual')) {
            return;
        }

        playerFrame.classList.remove('is-using-desktop-fullscreen-visual');
        notifyVisualResolutionChange();
    };

    const applyDesktopFullscreenVisual = () => {
        if (!desktopFullscreenVisualImage || !desktopFullscreenVisualLoaded) {
            return;
        }

        desktopFullscreenVisualImage.hidden = false;

        if (playerFrame.classList.contains('is-using-desktop-fullscreen-visual')) {
            return;
        }

        playerFrame.classList.add('is-using-desktop-fullscreen-visual');
        notifyVisualResolutionChange();
    };

    const preloadDesktopFullscreenVisual = () => {
        if (!desktopFullscreenVisualImage || !desktopFullscreenVisualSrc || desktopFullscreenVisualLoaded || desktopFullscreenVisualLoading) {
            return;
        }

        desktopFullscreenVisualLoading = true;
        const markLoaded = () => {
            desktopFullscreenVisualLoaded = true;
            desktopFullscreenVisualLoading = false;
            updateFullscreenVisual();
        };
        const markFailed = () => {
            desktopFullscreenVisualLoading = false;
        };

        desktopFullscreenVisualImage.onload = () => {
            if (desktopFullscreenVisualImage.decode) {
                desktopFullscreenVisualImage.decode().then(markLoaded).catch(markLoaded);
            } else {
                markLoaded();
            }
        };
        desktopFullscreenVisualImage.onerror = markFailed;
        desktopFullscreenVisualImage.src = desktopFullscreenVisualSrc;
    };

    const updateFullscreenVisual = () => {
        if (isDesktopFullscreenVisualMode()) {
            if (desktopFullscreenVisualLoaded) {
                applyDesktopFullscreenVisual();
            } else {
                preloadDesktopFullscreenVisual();
            }

            return;
        }

        applyNormalVisual();
    };

    const showFullscreenControls = () => {
        playerFrame.classList.remove('is-controls-hidden');
        clearFullscreenControlsTimer();

        if (!playerFrame.classList.contains('is-started') || !endedPanel.hidden || !isPlaybackActive()) {
            return;
        }

        if (shouldKeepControlsVisible()) {
            return;
        }

        fullscreenControlsTimer = window.setTimeout(() => {
            if (shouldKeepControlsVisible()) {
                fullscreenControlsTimer = 0;
                return;
            }

            if (playerFrame.classList.contains('is-started') && endedPanel.hidden && isPlaybackActive()) {
                playerFrame.classList.add('is-controls-hidden');
            }

            fullscreenControlsTimer = 0;
        }, 2400);
    };

    const hideEndedPanel = () => {
        endedPanel.hidden = true;
    };

    const finishVisualExtension = () => {
        cancelVisualExtensionFrame();
        isVisualExtensionPlaying = false;
        visualExtensionTime = visualDuration;
        updateEndFade(visualExtensionTime);
        updateCaption();
        updateProgress();
        updatePlayButton();
    };

    const startVisualExtension = (startTime = endFadeStart) => {
        cancelVisualExtensionFrame();
        cancelEndFadeFrame();
        visualExtensionTime = Math.max(endFadeStart, Math.min(startTime, visualDuration));
        visualExtensionBaseTime = visualExtensionTime;
        visualExtensionStartedAt = performance.now();
        isVisualExtensionPlaying = true;
        updatePlayButton();
        updateEndFade(visualExtensionTime);

        const frameVisualExtension = () => {
            if (!isVisualExtensionPlaying) {
                return;
            }

            const elapsed = (performance.now() - visualExtensionStartedAt) / 1000;
            visualExtensionTime = Math.min(visualDuration, visualExtensionBaseTime + elapsed);
            updateEndFade(visualExtensionTime);
            updateCaption();
            updateProgress();

            if (visualExtensionTime >= visualDuration) {
                finishVisualExtension();
                return;
            }

            visualExtensionFrame = window.requestAnimationFrame(frameVisualExtension);
        };

        visualExtensionFrame = window.requestAnimationFrame(frameVisualExtension);
    };

    const pauseVisualExtension = () => {
        if (!isVisualExtensionPlaying) {
            return;
        }

        cancelVisualExtensionFrame();
        isVisualExtensionPlaying = false;
        updateEndFade(visualExtensionTime);
        updatePlayButton();
        showFullscreenControls();
    };

    const resetVisualExtension = () => {
        cancelVisualExtensionFrame();
        cancelEndFadeFrame();
        isVisualExtensionPlaying = false;
        visualExtensionTime = 0;
        updateEndFade(0);
    };


    const activateInlinePlayer = () => {
        setupInlineBannerPlayer();
        banner.classList.add('is-started');
        playerFrame.classList.add('is-started');
        forceInlineRepaint();
        preloadDesktopFullscreenVisual();
        loadCosmicScript();
        loadSubtitles();
    };

    const playAudio = () => {
        activateInlinePlayer();
        hideEndedPanel();

        if (audio.ended || visualExtensionTime >= visualDuration) {
            audio.currentTime = 0;
            resetVisualExtension();
        }

        ensureAudioReady();
        audio.play().catch(() => {
            updatePlayButton();
        });
    };

    const togglePlayback = () => {
        if (isVisualExtensionPlaying) {
            pauseVisualExtension();
            return;
        }

        if (audio.ended && visualExtensionTime >= endFadeStart && visualExtensionTime < visualDuration) {
            startVisualExtension(visualExtensionTime);
            return;
        }

        if (audio.paused || audio.ended) {
            playAudio();
        } else {
            audio.pause();
        }
    };

    const openPlayer = () => {
        activateInlinePlayer();

        if (isMobileViewport()) {
            playButton.blur();
        } else {
            playButton.focus();
        }

        playAudio();
    };

    const closePlayer = () => {
        audio.pause();

        if (isPlayerFullscreen()) {
            exitPlayerFullscreen();
        }

        clearFullscreenControlsTimer();
        playerFrame.classList.remove('is-controls-hidden');
    };


    trigger.addEventListener('click', openPlayer);
    closeButton.addEventListener('click', closePlayer);
    playButton.addEventListener('click', togglePlayback);

    if (fullscreenButton) {
        fullscreenButton.addEventListener('click', toggleFullscreen);
    }

    screen.addEventListener('click', (event) => {
        if (!endedPanel.hidden && endedPanel.contains(event.target)) {
            return;
        }

        togglePlayback();
        showFullscreenControls();
    });

    screen.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        event.preventDefault();
        togglePlayback();
        showFullscreenControls();
    });

    replayButton.addEventListener('click', () => {
        hideEndedPanel();
        audio.currentTime = 0;
        playAudio();
    });

    captionsToggle.addEventListener('click', () => {
        const captionsOn = captionsToggle.getAttribute('aria-pressed') !== 'true';
        captionsToggle.setAttribute('aria-pressed', String(captionsOn));
        updateCaptionsButton();
        updateCaption();
    });

    muteButton.addEventListener('click', () => {
        if (audio.muted || audio.volume === 0) {
            const restoredVolume = lastVolume > 0 ? lastVolume : 1;
            audio.volume = restoredVolume;
            volume.value = String(restoredVolume);
            audio.muted = false;
        } else {
            lastVolume = audio.volume || lastVolume || 1;
            audio.muted = true;
        }

        updateMuteButton();
    });

    volume.addEventListener('input', () => {
        const nextVolume = Number(volume.value);
        audio.volume = nextVolume;

        if (nextVolume > 0) {
            lastVolume = nextVolume;
            audio.muted = false;
        } else {
            audio.muted = true;
        }

        updateMuteButton();
    });


    const fullscreenActivityEvents = ['mousemove', 'mousedown', 'touchstart'];
    fullscreenActivityEvents.forEach((eventName) => {
        playerFrame.addEventListener(eventName, showFullscreenControls, { passive: true });
    });

    progress.addEventListener('input', () => {
        const duration = getDuration();

        if (duration <= 0) {
            return;
        }

        isSeeking = true;
        audio.dataset.puSeeking = 'true';
        pauseVisualExtension();
        const targetTime = (Number(progress.value) / Number(progress.max)) * duration;
        const audioDuration = getAudioDuration();
        visualExtensionTime = targetTime;

        if (audioDuration > 0 && targetTime > audioDuration) {
            audio.currentTime = audioDuration;
        } else {
            audio.currentTime = Math.max(0, targetTime);
        }

        updateEndFade(targetTime);
        updateCaption();
        updateProgress();
        startEndFadeFrame();

        // Notify cosmic banner of timeupdate immediately to render dragged frame in WebGL
        audio.dispatchEvent(new Event('timeupdate'));
    });

    progress.addEventListener('change', () => {
        isSeeking = false;
        audio.dataset.puSeeking = 'false';
        updateProgress();
    });

    audio.addEventListener('play', function () {
        updatePlayButton();
        showFullscreenControls();
        startEndFadeFrame();
    });
    audio.addEventListener('pause', function () {
        cancelEndFadeFrame();
        updatePlayButton();

        if (audio.ended === false) {
            showFullscreenControls();
        }
    });

    const handleFullscreenChange = () => {
        const fullscreen = isPlayerFullscreen();
        playerFrame.classList.toggle('is-fullscreen-mode', fullscreen);
        updateFullscreenButton();
        updateFullscreenVisual();

        if (fullscreen) {
            showFullscreenControls();
        } else {
            clearFullscreenControlsTimer();
            playerFrame.classList.remove('is-controls-hidden');
        }
    };

    const handleViewportChange = () => {
        if (!playerFrame.classList.contains('is-started')) {
            return;
        }

        playerFrame.classList.toggle('is-fullscreen-mode', isPlayerFullscreen());
        updateFullscreenVisual();
        showFullscreenControls();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', handleViewportChange, { passive: true });
    window.addEventListener('orientationchange', handleViewportChange, { passive: true });

    audio.addEventListener('loadedmetadata', updateProgress);
    audio.addEventListener('volumechange', updateMuteButton);
    audio.addEventListener('timeupdate', function () {
        if (isSeeking) {
            return;
        }
        const currentTime = audio.currentTime || 0;
        visualExtensionTime = currentTime;
        updateEndFade(currentTime);
        updateCaption();
        updateProgress();
        startEndFadeFrame();
    });

    audio.addEventListener('ended', function () {
        cancelEndFadeFrame();
        const endedAt = Math.max(audio.currentTime || 0, endFadeStart);

        if (endedAt < visualDuration) {
            startVisualExtension(endedAt);
            return;
        }

        finishVisualExtension();
    });

    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) {
            closePlayer();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (!playerFrame.classList.contains('is-started')) {
            return;
        }

        showFullscreenControls();

        const activeElement = document.activeElement;
        const isTyping = activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName);

        if (event.key === 'Escape') {
            if (isPlayerFullscreen()) {
                exitPlayerFullscreen();
                showFullscreenControls();
            } else {
                closePlayer();
            }
        } else if (event.key === ' ' && !isTyping) {
            event.preventDefault();
            togglePlayback();
        }
    });

    document.addEventListener('pu:play-requested', openPlayer);

    updatePlayButton();
    updateCaptionsButton();
    updateMuteButton();
    updateFullscreenButton();
    updateProgress();
})();
