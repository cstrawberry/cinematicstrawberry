const pages = [
    { href: "intro.html", label: "INTRODUCTION" },
    { href: "idealism.html", label: "IDEALISM" },
    { href: "code.html", label: "CODE CHRISTIANITY" },
    { href: "creativedrive.html", label: "CREATIVE DRIVE" },
    { href: "deepunderstanding.html", label: "THE DEEP UNDERSTANDING PRINCIPLE" },
    { href: "whybother.html", label: "WHY BOTHER" },
    { href: "qm.html", label: "QUALITATIVE MATHEMATICS" },
    { href: "synesthetic.html", label: "SYNESTHETIC" },
    { href: "cc.html", label: "CONSCIOUSNESS COMPLEXITY" },
    { href: "protocol.html", label: "QUANTUM COMMUNICATION PROTOCOL" },
    { href: "aitest.html", label: "AI CONSCIOUSNESS TEST" },
    { href: "emotion.html", label: "EMOTIONAL PATTERN ANALYTICS" },
    { href: "object.html", label: "COLLECTIVE MIND OBJECT" },
    { href: "symbolic.html", label: "SYMBOLIC RESONANCE" },
    { href: "theosis.html", label: "THEOSIS" },
    { href: "perspective.html", label: "HIGHER-DIMENSIONAL PERSPECTIVE" },
    { href: "sensitive.html", label: "SENSITIVE INDIVIDUAL" },
    { href: "infinity.html", label: "ABSOLUTE INFINITY" },
    { href: "artoftouch.html", label: "ART OF TOUCH" },
    { href: "cognitiveprimes.html", label: "COGNITIVE PRIMES" },
    { href: "distinction.html", label: "THE DISTINCTION FRAMEWORK" },
    { href: "self-referential.html", label: "ACCURATE PREDICTION" },
    { href: "capitalism.html", label: "ALIGNED CAPITALISM" },
    { href: "deus.html", label: "THE DEUS MOMENT" },
    { href: "psyche.html", label: "THE PSYCHE MIRROR" },
    { href: "silence.html", label: "EXPRESSIVE SILENCE" },
    { href: "compression.html", label: "THE LAW OF COMPRESSION" },
    { href: "something.html", label: "UNIVERSAL LANGUAGE" },
    { href: "awakening.html", label: "THE GREAT AWAKENING" },
    { href: "ideas.html", label: "COSMOS OF IDEAS" },
    { href: "coherence.html", label: "SUBJECTIVE COHERENCE" },
    { href: "cogito.html", label: "REVOLUTIONIZING EPISTEMOLOGY" },
    { href: "information.html", label: "INFORMATIONAL NEUTRALITY" },
    { href: "perception.html", label: "PERCEPTION MANAGEMENT" },
    { href: "dreams.html", label: "DREAM SHARING" },
    { href: "authenticity.html", label: "SIMULATION AUTHENTICITY" },
    { href: "thermodynamics.html", label: "COGNITIVE THERMODYNAMICS" },
    { href: "horizon.html", label: "HORIZON CONSTANT" },
    { href: "inquiry.html", label: "MEANINGFUL INQUIRY" },
    { href: "sanity.html", label: "SANITY" },
    { href: "liteframework.html", label: "LITE FRAMEWORK" },
    { href: "iknow.html", label: "I KNOW WHAT I CAN'T KNOW" },
    { href: "becoming.html", label: "SPACE OF BECOMING" },
    { href: "description.html", label: "MINIMAL DESCRIPTION" },
    { href: "optimization.html", label: "PREDICTION OPTIMIZATION PROBLEM" },
    { href: "predictionism.html", label: "PREDICTIONISM" },
    { href: "subjectivenumbers.html", label: " SUBJECTIVE NUMBERS" },
    { href: "liarparadox.html", label: "LIAR PARADOX" },
    { href: "reflexive.html", label: "REFLEXIVE UNDECIDABILITY" },
    { href: "prediction.html", label: "PREDICTIVE COMPRESSION" },
    { href: "predictiveuniverse.html", label: "THE PREDICTIVE UNIVERSE" },
    { href: "infinitybet.html", label: "INFINITY BET" },
    { href: "predictionrelativity.html", label: "PREDICTION RELATIVITY" },
    { href: "fibonacci.html", label: "FIBONACCI STRINGS" },
    { href: "meaning.html", label: "MEANING" },
    { href: "narrative.html", label: "NARRATIVE REALIZATION" },
    { href: "consciousness.html", label: "CONSCIOUSNESS" },
    { href: "hiddennarratives.html", label: "HIDDEN NARRATIVES" },
    { href: "time.html", label: "TIME" },
    { href: "intuitive.html", label: "INTUITIVE SYMBOLICS" },
    { href: "transparent.html", label: "THE TRANSPARENT MIND" },
    { href: "instantiation.html", label: "PHYSICAL INSTANTIATION" },
    { href: "quantum.html", label: "QUANTUM MECHANICS" },
    { href: "cymatics.html", label: "AFFECTIVE CYMATICS" },
    { href: "blackhole.html", label: "INFORMATION PARADOX" },
    { href: "causality.html", label: "CAUSALITY" },
    { href: "gravity.html", label: "GRAVITY" },
    { href: "constant.html", label: "Fine-Structure Constant" },
    { href: "nothing.html", label: "SOMETHING RATHER THAN NOTHING" },




];
let slideIndex;
let circleWrapper;
let circles;
let totalWidth;
let containerWidth;
let maxScrollIndex;
let circleContainer;
let scrollSyncFrame;
let wheelAccumulator = 0;
let wheelLock = false;

function useNativeCarouselScroll() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function measureSlider() {
    const circleWidth = circles[0].offsetWidth;
    const computedStyle = window.getComputedStyle(circles[0]);
    const marginRight = parseFloat(computedStyle.marginRight) || 20;
    const containerStyle = window.getComputedStyle(circleContainer);
    const horizontalPadding = (parseFloat(containerStyle.paddingLeft) || 0) + (parseFloat(containerStyle.paddingRight) || 0);

    totalWidth = circleWidth + marginRight;
    containerWidth = circleContainer.offsetWidth;

    const visibleWidth = useNativeCarouselScroll()
        ? circleWrapper.clientWidth
        : Math.max(0, circleContainer.clientWidth - horizontalPadding);
    const maxFullyVisibleCircles = Math.max(1, Math.floor(visibleWidth / totalWidth));
    maxScrollIndex = Math.max(0, circles.length - maxFullyVisibleCircles);
}

function syncSlideIndexFromScroll() {
    if (!useNativeCarouselScroll() || !totalWidth) {
        return;
    }

    if (scrollSyncFrame) {
        return;
    }

    scrollSyncFrame = window.requestAnimationFrame(() => {
        scrollSyncFrame = null;
        slideIndex = Math.max(0, Math.min(maxScrollIndex, Math.round(circleWrapper.scrollLeft / totalWidth)));
    });
}

function handleCarouselWheel(event) {
    if (!circleWrapper || !circles || circles.length === 0 || maxScrollIndex <= 0) {
        return;
    }

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

    if (Math.abs(delta) < 1) {
        return;
    }

    event.preventDefault();

    if (useNativeCarouselScroll()) {
        circleWrapper.scrollBy({
            left: delta,
            behavior: 'auto',
        });
        return;
    }

    wheelAccumulator += delta;

    if (wheelLock || Math.abs(wheelAccumulator) < 45) {
        return;
    }

    wheelLock = true;
    shiftSlide(wheelAccumulator > 0 ? 1 : -1);
    wheelAccumulator = 0;

    window.setTimeout(() => {
        wheelLock = false;
        wheelAccumulator = 0;
    }, 150);
}

document.addEventListener('DOMContentLoaded', function () {
    const currentPage = window.location.pathname.split("/").pop();
    const sliderContainer = document.querySelector('.circle-wrapper');

    // Generate slider items dynamically, excluding the current page
    pages.forEach((page, index) => {
        if (page.href !== currentPage) {
            const circleDiv = document.createElement('div');
            circleDiv.className = `circle ${page.label.toLowerCase().replace(/ /g, '')}`;
            circleDiv.innerHTML = `<a href="${page.href}">${page.label}</a>`;
            sliderContainer.appendChild(circleDiv);
        } else {
            // Set the starting slideIndex to the current page's index
            slideIndex = index;
        }
    });

    circleWrapper = document.querySelector('.circle-wrapper');
    circleContainer = document.querySelector('.circle-container');
    circles = document.querySelectorAll('.circle');
    
    // Only proceed if we have circles
    if (circles.length > 0) {
        if (typeof slideIndex !== 'number') {
            slideIndex = 0;
        }

        measureSlider();
        // Set initial position
        updateSlidePosition();

        circleWrapper.addEventListener('scroll', syncSlideIndexFromScroll, { passive: true });
        circleContainer.addEventListener('wheel', handleCarouselWheel, { passive: false });
        
        // Add resize listener to recalculate dimensions
        window.addEventListener('resize', function() {
            measureSlider();
            updateSlidePosition();
        });
    }
});

function updateSlidePosition(options = {}) {
    // Ensure slideIndex is valid
    if (slideIndex > maxScrollIndex) {
        slideIndex = maxScrollIndex;
    }

    if (slideIndex < 0) {
        slideIndex = 0;
    }

    if (useNativeCarouselScroll()) {
        circleWrapper.style.transform = 'none';
        circleWrapper.scrollTo({
            left: slideIndex * totalWidth,
            behavior: options.smooth ? 'smooth' : 'auto',
        });
        return;
    }
    
    circleWrapper.scrollLeft = 0;
    circleWrapper.style.transform = `translateX(-${slideIndex * totalWidth}px)`;
}

function shiftSlide(direction) {
    slideIndex += direction;
    
    // Looping behavior with boundary checks
    if (slideIndex > maxScrollIndex) {
        slideIndex = 0;  // Loop back to the first circle
    } else if (slideIndex < 0) {
        slideIndex = maxScrollIndex;  // Loop to the max valid position
    }
    
    updateSlidePosition({ smooth: true });
}

// Helper functions for direct navigation
function jumpToStart() {
    slideIndex = 0;
    updateSlidePosition({ smooth: true });
}

function jumpToEnd() {
    slideIndex = maxScrollIndex;
    updateSlidePosition({ smooth: true });
}
