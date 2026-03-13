const tl = gsap.timeline({
    onComplete: () => {
        // Flash white and transition to the Title screen
        gsap.to(document.body, {
            backgroundColor: "#fff",
            duration: 0.3,
            onComplete: () => {
                window.location.href = "title.html";
            }
        });
    }
});

// 1. Start spinning the massive HUD rings indefinitely
gsap.to('.hud-circle-1', { rotation: 360, duration: 10, repeat: -1, ease: "none" });
gsap.to('.hud-circle-2', { rotation: -360, duration: 15, repeat: -1, ease: "none" });
gsap.to('.hud-circle-3', { rotation: 360, duration: 5, repeat: -1, ease: "none" });

// 2. Animate the progress bar and the percentage number simultaneously
tl.to('.progress-bar-fill', {
    width: '100%',
    duration: 4.5,
    ease: "power2.inOut"
}, 0);

const progressText = document.getElementById('progress-text');
const dummyObj = { val: 0 };
tl.to(dummyObj, {
    val: 100,
    duration: 4.5,
    ease: "power2.inOut",
    onUpdate: () => {
        progressText.innerText = Math.round(dummyObj.val) + "%";
    }
}, 0);

// 3. Stagger the appearance of the pseudo-terminal logs to look like hacking
tl.to('#log-1', { opacity: 1, duration: 0.1 }, 0.5);
tl.to('#log-2', { opacity: 1, duration: 0.1 }, 1.8);
tl.to('#log-3', { opacity: 1, color: "#ff3366", duration: 0.1 }, 3.2);

// Add some glitching to the container sporadically scaling and skewing for chaos
tl.to('.loader-container', { x: 5, skewX: 2, duration: 0.05, repeat: 5, yoyo: true }, 1.5);
tl.to('.loader-container', { x: -5, skewX: -2, duration: 0.05, repeat: 7, yoyo: true }, 3.0);
tl.to('.loader-container', { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1 }, 4.3);
