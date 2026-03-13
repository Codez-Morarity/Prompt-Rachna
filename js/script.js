const glitchElements = document.querySelectorAll('.glitch');

// Utility functions for random values
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

glitchElements.forEach(glitchElement => {
    // Initialise CSS variables on the element
    gsap.set(glitchElement, {
        '--clip-before-1': '0%',
        '--clip-before-2': '0%',
        '--clip-after-1': '0%',
        '--clip-after-2': '0%',
        '--glitch-x-before': '0px',
        '--glitch-y-before': '0px',
        '--glitch-x-after': '0px',
        '--glitch-y-after': '0px'
    });

    let isGlitching = false;
    let autoGlitchTimeout;

    // Clean finish state after a glitch burst
    function cleanReset() {
        gsap.to(glitchElement, {
            '--clip-before-1': '0%',
            '--clip-before-2': '0%',
            '--clip-after-1': '0%',
            '--clip-after-2': '0%',
            '--glitch-x-before': '0px',
            '--glitch-y-before': '0px',
            '--glitch-x-after': '0px',
            '--glitch-y-after': '0px',
            skewX: 0,
            scale: 1,
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.1,
            ease: "power1.inOut"
        });
    }

    // The main explosive glitch timeline maker
    function doGlitch() {
        if (!isGlitching) return;

        const tl = gsap.timeline({
            onComplete: () => {
                if (isGlitching) {
                    autoGlitchTimeout = gsap.delayedCall(randomFloat(0.5, 3), doGlitch);
                } else {
                    cleanReset();
                }
            }
        });

        const numFrames = randomInt(4, 10); 

        for (let i = 0; i < numFrames; i++) {
            const beforeTop = randomInt(0, 80);
            const beforeBottom = beforeTop + randomInt(5, 30);
            const afterTop = randomInt(0, 80);
            const afterBottom = afterTop + randomInt(5, 30);

            const xBefore = randomFloat(-15, 15);
            const yBefore = randomFloat(-5, 5);
            const xAfter = randomFloat(-15, 15);
            const yAfter = randomFloat(-5, 5);
            
            const skewX = Math.random() > 0.8 ? randomFloat(-15, 15) : 0;
            const scale = Math.random() > 0.9 ? randomFloat(1.02, 1.1) : 1;
            const opacity = Math.random() > 0.9 ? randomFloat(0.6, 0.9) : 1;

            tl.to(glitchElement, {
                '--clip-before-1': `${beforeTop}%`,
                '--clip-before-2': `${beforeBottom}%`,
                '--clip-after-1': `${afterTop}%`,
                '--clip-after-2': `${afterBottom}%`,
                '--glitch-x-before': `${xBefore}px`,
                '--glitch-y-before': `${yBefore}px`,
                '--glitch-x-after': `${xAfter}px`,
                '--glitch-y-after': `${yAfter}px`,
                skewX: skewX,
                scale: scale,
                opacity: opacity,
                duration: randomFloat(0.02, 0.08),
                ease: "none"
            });
        }
        
        // Ensure state drops back to zero if mouse left during frames
        tl.call(() => {
            if (!isGlitching) cleanReset();
        });
    }

    // Add a continuous small ambient jitter during hover
    function ambientJitter() {
        if (!isGlitching) return;
        gsap.to(glitchElement, {
            x: randomFloat(-1.5, 1.5),
            y: randomFloat(-1.5, 1.5),
            duration: randomFloat(0.05, 0.1),
            ease: "none",
            onComplete: ambientJitter
        });
    }

    // Trigger effect when cursor hovers
    const triggerArea = glitchElement.closest('.glitch-link') || glitchElement;

    triggerArea.addEventListener('mouseenter', () => {
        if (!isGlitching) {
            isGlitching = true;
            doGlitch();
            ambientJitter();
        }
    });

    triggerArea.addEventListener('mouseleave', () => {
        isGlitching = false;
        if (autoGlitchTimeout) {
            autoGlitchTimeout.kill();
        }
        // Stop any ongoing janky animations safely and smoothly transition back to normal
        gsap.killTweensOf(glitchElement); 
        cleanReset(); 
    });

});