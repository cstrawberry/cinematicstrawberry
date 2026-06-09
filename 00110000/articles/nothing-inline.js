(function () {
    var trigger = document.querySelector('.slide-deck-trigger');
    var lightbox = document.getElementById('slideDeckLightbox');

    if (!trigger || !lightbox) {
        return;
    }

    var slideCount = 20;
    var slides = Array.from({ length: slideCount }, function (_, index) {
        return 'images/slideshow/nothing/nothing_slide_' + String(index + 1).padStart(2, '0') + '-desktop.jpg';
    });
    var image = lightbox.querySelector('.slide-deck-image');
    var closeButton = lightbox.querySelector('.slide-deck-close');
    var previousButton = lightbox.querySelector('.slide-deck-prev');
    var nextButton = lightbox.querySelector('.slide-deck-next');
    var counter = lightbox.querySelector('.slide-deck-counter');
    var preloadedSlides = new Set();
    var preloadImages = [];
    var currentSlide = 0;
    var backgroundPreloadStarted = false;
    var backgroundPreloadIndex = 0;
    var touchStartX = 0;
    var touchStartY = 0;
    var touchActive = false;
    var swipeThreshold = 44;
    var swipeRatio = 1.35;

    var preloadSlide = function (index) {
        var normalizedIndex = (index + slideCount) % slideCount;

        if (preloadedSlides.has(normalizedIndex)) {
            return;
        }

        preloadedSlides.add(normalizedIndex);
        var nextImage = new Image();
        nextImage.decoding = 'async';
        if ('fetchPriority' in nextImage) {
            nextImage.fetchPriority = 'low';
        }
        nextImage.src = slides[normalizedIndex];
        preloadImages.push(nextImage);
    };

    var queueBackgroundPreload = function () {
        if (backgroundPreloadIndex >= slideCount) {
            return;
        }

        var run = function () {
            preloadSlide(backgroundPreloadIndex);
            backgroundPreloadIndex += 1;
            window.setTimeout(queueBackgroundPreload, 700);
        };

        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(run, { timeout: 1500 });
        } else {
            window.setTimeout(run, 400);
        }
    };

    var startBackgroundPreload = function () {
        if (backgroundPreloadStarted) {
            return;
        }

        backgroundPreloadStarted = true;
        queueBackgroundPreload();
    };

    var showSlide = function (index) {
        currentSlide = (index + slideCount) % slideCount;
        preloadedSlides.add(currentSlide);
        image.src = slides[currentSlide];
        image.alt = 'Why Is There Something Rather Than Nothing slide ' + (currentSlide + 1) + ' of ' + slideCount;
        counter.textContent = (currentSlide + 1) + ' / ' + slideCount;
        preloadSlide((currentSlide + 1) % slideCount);
    };

    var closeLightbox = function () {
        lightbox.hidden = true;
        document.body.classList.remove('image-lightbox-open');
        image.removeAttribute('src');
        trigger.focus();
    };

    trigger.addEventListener('click', function () {
        showSlide(0);
        startBackgroundPreload();
        lightbox.hidden = false;
        document.body.classList.add('image-lightbox-open');
        nextButton.focus();
    });

    closeButton.addEventListener('click', closeLightbox);
    previousButton.addEventListener('click', function () { showSlide(currentSlide - 1); });
    nextButton.addEventListener('click', function () { showSlide(currentSlide + 1); });

    lightbox.addEventListener('touchstart', function (event) {
        if (lightbox.hidden || event.touches.length !== 1) {
            touchActive = false;
            return;
        }

        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        touchActive = true;
    }, { passive: true });

    lightbox.addEventListener('touchend', function (event) {
        if (!touchActive || lightbox.hidden || event.changedTouches.length !== 1) {
            touchActive = false;
            return;
        }

        var deltaX = event.changedTouches[0].clientX - touchStartX;
        var deltaY = event.changedTouches[0].clientY - touchStartY;
        touchActive = false;

        if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) < Math.abs(deltaY) * swipeRatio) {
            return;
        }

        showSlide(deltaX > 0 ? currentSlide - 1 : currentSlide + 1);
    }, { passive: true });

    lightbox.addEventListener('touchcancel', function () {
        touchActive = false;
    }, { passive: true });

    lightbox.addEventListener('click', function (event) {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', function (event) {
        if (lightbox.hidden) {
            return;
        }

        if (event.key === 'Escape') {
            closeLightbox();
        } else if (event.key === 'ArrowLeft') {
            showSlide(currentSlide - 1);
        } else if (event.key === 'ArrowRight') {
            showSlide(currentSlide + 1);
        }
    });

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            if (entries.some(function (entry) { return entry.isIntersecting; })) {
                startBackgroundPreload();
                observer.disconnect();
            }
        }, { rootMargin: '900px 0px', threshold: 0.01 });

        observer.observe(trigger);
    } else {
        var checkDeckPosition = function () {
            var rect = trigger.getBoundingClientRect();

            if (rect.top < window.innerHeight + 900 && rect.bottom > -900) {
                startBackgroundPreload();
                window.removeEventListener('scroll', checkDeckPosition);
                window.removeEventListener('resize', checkDeckPosition);
            }
        };

        window.addEventListener('scroll', checkDeckPosition, { passive: true });
        window.addEventListener('resize', checkDeckPosition);
        checkDeckPosition();
    }
}());
