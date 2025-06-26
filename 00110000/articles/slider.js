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



];
let slideIndex;
let circleWrapper;
let circles;
let totalWidth;
let containerWidth;
let maxScrollIndex;
const visibleCircles = 1;

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
    circles = document.querySelectorAll('.circle');
    
    // Only proceed if we have circles
    if (circles.length > 0) {
        // Calculate circle width including margin
        const circleWidth = circles[0].offsetWidth;
        const computedStyle = window.getComputedStyle(circles[0]);
        const marginRight = parseInt(computedStyle.marginRight) || 20; // Default to 20px if not set
        totalWidth = circleWidth + marginRight;
        
        // Get container width
        containerWidth = document.querySelector('.circle-container').offsetWidth;
        
        // Calculate max index that still shows content properly
        // We find how many circles we can show in the container, then subtract from total
        const visibleWidth = containerWidth - 40; // Account for padding
        const maxFullyVisibleCircles = Math.floor(visibleWidth / totalWidth);
        maxScrollIndex = circles.length - maxFullyVisibleCircles;
        
        // Make sure maxScrollIndex is never negative
        maxScrollIndex = Math.max(0, maxScrollIndex);
        
        // Set initial position
        updateSlidePosition();
        
        // Add resize listener to recalculate dimensions
        window.addEventListener('resize', function() {
            // Recalculate dimensions
            const circleWidth = circles[0].offsetWidth;
            const computedStyle = window.getComputedStyle(circles[0]);
            const marginRight = parseInt(computedStyle.marginRight) || 20;
            totalWidth = circleWidth + marginRight;
            
            // Update container width
            containerWidth = document.querySelector('.circle-container').offsetWidth;
            
            // Recalculate max index
            const visibleWidth = containerWidth - 40;
            const maxFullyVisibleCircles = Math.floor(visibleWidth / totalWidth);
            maxScrollIndex = circles.length - maxFullyVisibleCircles;
            maxScrollIndex = Math.max(0, maxScrollIndex);
            
            // Update position
            updateSlidePosition();
        });
    }
});

function updateSlidePosition() {
    // Ensure slideIndex is valid
    if (slideIndex > maxScrollIndex) {
        slideIndex = maxScrollIndex;
    }
    
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
    
    updateSlidePosition();
}

// Helper functions for direct navigation
function jumpToStart() {
    slideIndex = 0;
    updateSlidePosition();
}

function jumpToEnd() {
    slideIndex = maxScrollIndex;
    updateSlidePosition();
}