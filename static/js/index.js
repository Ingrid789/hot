// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    if (!bibtexElement || !button) return;
    const copyText = button.querySelector('.copy-text');
    if (!copyText) return;
    
    navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
        button.classList.add('copied');
        copyText.textContent = 'Copied';
        
        setTimeout(function() {
            button.classList.remove('copied');
            copyText.textContent = 'Copy';
        }, 2000);
    }).catch(function(err) {
        console.error('Failed to copy: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = bibtexElement.textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        button.classList.add('copied');
        copyText.textContent = 'Copied';
        setTimeout(function() {
            button.classList.remove('copied');
            copyText.textContent = 'Copy';
        }, 2000);
    });
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function scrollElementNearTop(element, offset) {
    if (!element) return;
    var top = window.scrollY + element.getBoundingClientRect().top - (offset || 16);
    window.scrollTo({
        top: Math.max(0, top),
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (!scrollButton) return;
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Lazy-load video: move data-src → src and begin playback
function activateVideo(video) {
    if (video.dataset.lazyActivated) return;
    var source = video.querySelector('source[data-src]');
    if (source) {
        source.src = source.getAttribute('data-src');
        source.removeAttribute('data-src');
        video.load();
    }
    video.muted = true;
    video.dataset.lazyActivated = '1';
    video.addEventListener('loadeddata', function() {
        video.play().catch(function() {});
    }, { once: true });
}

function setupLazyVideos() {
    var videos = document.querySelectorAll('.contributions-section video, .how-section video, .demo-section video');
    if (!videos.length) return;

    if (!('IntersectionObserver' in window)) {
        // Fallback: activate all immediately
        videos.forEach(activateVideo);
        return;
    }

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            var video = entry.target;
            if (entry.isIntersecting) {
                activateVideo(video);
                video.play().catch(function() {});
            } else if (video.dataset.lazyActivated) {
                video.pause();
            }
        });
    }, { rootMargin: '200px', threshold: 0.1 });

    videos.forEach(function(video) {
        observer.observe(video);
    });
}

function setVideoSource(videoElement, sourceUrl) {
    if (!videoElement || !sourceUrl) return;

    // Capture the current frame as a poster so the element keeps its
    // visual content while the new source loads, preventing a flash.
    try {
        if (videoElement.readyState >= 2 && videoElement.videoWidth) {
            var canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            canvas.getContext('2d').drawImage(videoElement, 0, 0);
            videoElement.poster = canvas.toDataURL('image/jpeg', 0.7);
        }
    } catch (e) { /* cross-origin or canvas taint — ignore */ }

    var sourceEl = videoElement.querySelector('source');
    if (!sourceEl) {
        sourceEl = document.createElement('source');
        sourceEl.type = 'video/mp4';
        videoElement.appendChild(sourceEl);
    }
    sourceEl.removeAttribute('data-src');
    sourceEl.src = sourceUrl;
    videoElement.dataset.lazyActivated = '1';
    videoElement.load();

    // Once the new video has a frame, clear the poster so it doesn't
    // show stale content on subsequent pauses.
    videoElement.addEventListener('loadeddata', function clearPoster() {
        videoElement.removeEventListener('loadeddata', clearPoster);
        videoElement.removeAttribute('poster');
    });
}

function activateTab(container, activeButton) {
    if (!container || !activeButton) return;
    container.querySelectorAll('.demo-tab').forEach(function(button) {
        button.classList.remove('active');
        button.setAttribute('aria-selected', 'false');
    });
    activeButton.classList.add('active');
    activeButton.setAttribute('aria-selected', 'true');
}

function setupSingleVideoTabs(containerId, videoId) {
    var container = document.getElementById(containerId);
    var video = document.getElementById(videoId);
    if (!container || !video) return;

    var wrap = video.closest('.demo-main-video-wrap');
    var switching = false;

    container.querySelectorAll('.demo-tab').forEach(function(button) {
        button.addEventListener('click', function() {
            var src = button.getAttribute('data-video');
            var label = button.getAttribute('data-label');
            if (!src) return;

            // Guard: skip if already switching or same source
            var currentSrc = (video.querySelector('source') || {}).src || '';
            if (switching || currentSrc === new URL(src, location.href).href) {
                activateTab(container, button);
                return;
            }

            switching = true;
            activateTab(container, button);

            if (wrap) wrap.classList.add('is-switching');

            // Wait for CSS fade-out, then swap source
            setTimeout(function() {
                setVideoSource(video, src);
                if (label) video.setAttribute('aria-label', label);

                if (wrap) wrap.classList.add('is-loading');

                function reveal() {
                    if (wrap) {
                        wrap.classList.remove('is-switching');
                        wrap.classList.remove('is-loading');
                    }
                    video.play().catch(function() {});
                    switching = false;
                }

                video.addEventListener('loadeddata', function onLoaded() {
                    video.removeEventListener('loadeddata', onLoaded);
                    reveal();
                });

                // Safety timeout in case loadeddata never fires
                setTimeout(function() {
                    if (switching) reveal();
                }, 3000);
            }, 180);

        });
    });
}

function setupHandResultTabs() {
    var container = document.getElementById('demo-tabs-hands');
    var buttons = container ? Array.from(container.querySelectorAll('.demo-tab[data-hand-panel]')) : [];
    var panels = Array.from(document.querySelectorAll('.hand-results-panel[data-hand-content]'));
    if (!container || !buttons.length || !panels.length) return;

    function setActiveHand(handKey) {
        buttons.forEach(function(button) {
            var isActive = button.getAttribute('data-hand-panel') === handKey;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', String(isActive));
        });

        panels.forEach(function(panel) {
            panel.classList.toggle('is-active', panel.getAttribute('data-hand-content') === handKey);
        });
    }

    buttons.forEach(function(button) {
        button.addEventListener('click', function() {
            setActiveHand(button.getAttribute('data-hand-panel'));
        });
    });

    setActiveHand('shadow');
}

function setupHandCarousels() {
    var carousels = Array.from(document.querySelectorAll('[data-hand-carousel]'));
    if (!carousels.length) return;

    carousels.forEach(function(carousel) {
        var video = carousel.querySelector('video');
        var prev = carousel.querySelector('.hand-carousel-arrow--prev');
        var next = carousel.querySelector('.hand-carousel-arrow--next');
        var videos = (carousel.getAttribute('data-videos') || '').split('|').filter(Boolean);
        var labels = (carousel.getAttribute('data-labels') || '').split('|').filter(Boolean);
        var index = 0;
        var switching = false;

        if (!video || !prev || !next || !videos.length) return;

        function render(nextIndex) {
            if (switching) return;
            index = (nextIndex + videos.length) % videos.length;
            switching = true;
            carousel.classList.add('is-switching');

            setTimeout(function() {
                setVideoSource(video, videos[index]);
                video.setAttribute('aria-label', labels[index] || 'Hand tracking video');

                function reveal() {
                    carousel.classList.remove('is-switching');
                    video.play().catch(function() {});
                    switching = false;
                }

                video.addEventListener('loadeddata', function onLoaded() {
                    video.removeEventListener('loadeddata', onLoaded);
                    reveal();
                });

                setTimeout(function() {
                    if (switching) reveal();
                }, 3000);
            }, 180);
        }

        prev.addEventListener('click', function() {
            render(index - 1);
        });

        next.addEventListener('click', function() {
            render(index + 1);
        });
    });
}

function setupOverviewSwitcher() {
    var root = document.querySelector('[data-overview-switcher]');
    if (!root) return;
    var tabs = Array.from(root.querySelectorAll('[data-overview-view]'));
    var panels = Array.from(root.querySelectorAll('[data-overview-panel]'));
    var iframe = root.querySelector('#overview-video-panel iframe');
    var activeView = 'summary';

    function setView(view) {
        if (view === activeView) return;
        activeView = view;

        tabs.forEach(function(tab) {
            var selected = tab.dataset.overviewView === view;
            tab.classList.toggle('is-active', selected);
            tab.setAttribute('aria-selected', String(selected));
            tab.tabIndex = selected ? 0 : -1;
        });

        panels.forEach(function(panel) {
            var selected = panel.dataset.overviewPanel === view;
            panel.hidden = !selected;
            panel.classList.toggle('is-entering', selected);
            if (!selected) {
                panel.querySelectorAll('video').forEach(function(video) {
                    video.pause();
                });
            }
        });

        root.style.setProperty('--overview-page-offset', view === 'video' ? '-18px' : '18px');
        root.style.setProperty('--overview-page-angle', view === 'video' ? '-3deg' : '3deg');

        if (iframe) {
            if (view === 'video') {
                iframe.src = iframe.dataset.src;
            } else {
                // Unload the player so audio stops when its page is hidden.
                iframe.removeAttribute('src');
            }
        }
    }

    tabs.forEach(function(tab, index) {
        tab.addEventListener('click', function() {
            setView(tab.dataset.overviewView);
        });
        tab.addEventListener('keydown', function(event) {
            var nextIndex;
            if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
            else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
            else if (event.key === 'Home') nextIndex = 0;
            else if (event.key === 'End') nextIndex = tabs.length - 1;
            else return;
            event.preventDefault();
            tabs[nextIndex].focus();
            setView(tabs[nextIndex].dataset.overviewView);
        });
    });

    panels.forEach(function(panel) {
        panel.addEventListener('animationend', function(event) {
            if (event.target === panel) panel.classList.remove('is-entering');
        });
    });
}

function setupMethodOverviewPanels() {
    var hotspots = Array.from(document.querySelectorAll('.how-method-hotspot'));
    var panels = Array.from(document.querySelectorAll('.how-method-panel[data-method-panel-content]'));
    var emptyState = document.querySelector('.how-method-empty[data-method-empty]');
    var plannerCard = document.querySelector('.how-method-panel[data-method-panel-content="planner"] .how-model-card');
    if (!hotspots.length || !panels.length || !emptyState) return;

    function setActivePanel(panelKey) {
        var hasSelection = Boolean(panelKey);

        hotspots.forEach(function(button) {
            var isActive = button.getAttribute('data-method-panel') === panelKey;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        panels.forEach(function(panel) {
            panel.classList.toggle('is-active', panel.getAttribute('data-method-panel-content') === panelKey);
        });

        emptyState.classList.toggle('is-active', !hasSelection);
    }

    hotspots.forEach(function(button) {
        button.addEventListener('click', function() {
            var panelKey = button.getAttribute('data-method-panel');
            setActivePanel(panelKey);
            if (panelKey === 'planner') {
                requestAnimationFrame(function() {
                    scrollElementNearTop(plannerCard, 18);
                });
            }
        });
    });

    setActivePanel('');
}

function setupPlannerSkillTabs() {
    var tabs = Array.from(document.querySelectorAll('.how-planner-hotspot[data-skill-panel]'));
    var panels = Array.from(document.querySelectorAll('.how-planner-skill-panel[data-skill-content]'));
    var emptyState = document.querySelector('[data-planner-empty]');
    var hotspotWrap = document.querySelector('.how-planner-hotspots');
    var plannerCard = document.querySelector('.how-method-panel[data-method-panel-content="planner"] .how-model-card');
    if (!tabs.length || !panels.length || !emptyState) return;

    function setActiveSkill(skillKey) {
        var hasSelection = Boolean(skillKey);

        tabs.forEach(function(tab) {
            var isActive = tab.getAttribute('data-skill-panel') === skillKey;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-pressed', String(isActive));
        });

        if (hotspotWrap) {
            hotspotWrap.classList.toggle('has-active', hasSelection);
        }

        panels.forEach(function(panel) {
            var isDirectMatch = panel.getAttribute('data-skill-content') === skillKey;
            var isActive = isDirectMatch;
            panel.classList.toggle('is-active', isActive);
            if (isActive) {
                panel.querySelectorAll('video').forEach(function(video) {
                    activateVideo(video);
                    video.play().catch(function() {});
                });
            } else {
                panel.querySelectorAll('video').forEach(function(video) {
                    video.pause();
                });
            }
        });

        emptyState.classList.toggle('is-active', !hasSelection);
    }

    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            setActiveSkill(tab.getAttribute('data-skill-panel'));
            requestAnimationFrame(function() {
                scrollElementNearTop(plannerCard, 18);
            });
        });
    });

    setActiveSkill('');
}

/* ── Scroll-triggered reveal animations ── */
function setupRevealAnimations() {
    var els = document.querySelectorAll('.reveal, .reveal--left, .reveal--right, .reveal--scale, .reveal--fade');
    if (!els.length || !('IntersectionObserver' in window)) {
        // Fallback: show everything immediately
        els.forEach(function(el) { el.classList.add('is-visible'); });
        return;
    }

    // Assign stagger indices to children of .reveal-stagger parents
    document.querySelectorAll('.reveal-stagger').forEach(function(parent) {
        var children = parent.querySelectorAll('.reveal, .reveal--left, .reveal--right, .reveal--scale');
        children.forEach(function(child, i) {
            child.style.setProperty('--reveal-i', i);
        });
    });

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function(el) { observer.observe(el); });
}

function setupOutlinePanel() {
    var panel = document.querySelector('.outline-panel');
    var outlineLinks = Array.from(document.querySelectorAll('.outline-panel .outline-link[data-outline-link]'));
    if (!outlineLinks.length) return;

    // --- Fold / unfold toggle ---
    var titleEl = document.getElementById('outline-toggle');
    if (titleEl && panel) {
        titleEl.addEventListener('click', function(e) {
            e.preventDefault();
            panel.classList.toggle('is-collapsed');
        });
    }

    var sectionEntries = outlineLinks
        .map(function(link) {
            var id = link.getAttribute('data-outline-link');
            var section = id ? document.getElementById(id) : null;
            return section ? { id: id, section: section } : null;
        })
        .filter(Boolean);
    if (!sectionEntries.length) return;

    function setActiveLink(id) {
        outlineLinks.forEach(function(link) {
            var isActive = link.getAttribute('data-outline-link') === id;
            link.classList.toggle('active', isActive);
            link.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
    }

    function updateActiveFromScroll() {
        // Track the section that has crossed a stable anchor point.
        var anchorY = window.innerHeight * 0.32;
        var activeId = sectionEntries[0].id;

        for (var i = 0; i < sectionEntries.length; i += 1) {
            var item = sectionEntries[i];
            var top = item.section.getBoundingClientRect().top;
            if (top <= anchorY) {
                activeId = item.id;
            } else {
                break;
            }
        }

        setActiveLink(activeId);
    }

    window.addEventListener('scroll', updateActiveFromScroll, { passive: true });
    window.addEventListener('resize', updateActiveFromScroll);

    updateActiveFromScroll();
}

/* ── Mouse-following Gradient Spotlight on Hero ── */
function setupHeroSpotlight() {
    if (!window.matchMedia('(hover: hover)').matches) return;

    var hero = document.querySelector('.hero-main');
    if (!hero) return;

    var rafId = null;
    var mouseX = 0;
    var mouseY = 0;

    hero.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!rafId) {
            rafId = requestAnimationFrame(function() {
                var rect = hero.getBoundingClientRect();
                var x = mouseX - rect.left;
                var y = mouseY - rect.top;
                hero.style.setProperty('--mouse-x', x + 'px');
                hero.style.setProperty('--mouse-y', y + 'px');
                rafId = null;
            });
        }
    });
}

/* ── Cursor Trail — Root Trajectory Visualization ── */
function setupCursorTrail() {
    if (!window.matchMedia('(hover: hover)').matches) return;

    var zones = document.querySelectorAll('.demo-section, .how-section');
    if (!zones.length) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'cursor-trail-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var pts = [];
    var LIFE = 400;
    var raf = null;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function inZone(cy) {
        for (var i = 0; i < zones.length; i++) {
            var r = zones[i].getBoundingClientRect();
            if (cy >= r.top && cy <= r.bottom) return true;
        }
        return false;
    }

    document.addEventListener('mousemove', function(e) {
        if (!inZone(e.clientY)) return;
        pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
        if (!raf) tick();
    });

    function tick() {
        raf = requestAnimationFrame(function() {
            var now = performance.now();
            while (pts.length && now - pts[0].t > LIFE) pts.shift();

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (var i = 0; i < pts.length; i++) {
                var age = (now - pts[i].t) / LIFE;
                var a = 0.15 * (1 - age);
                var r = 2 * (1 - age * 0.5);
                ctx.beginPath();
                ctx.arc(pts[i].x, pts[i].y, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(37,99,235,' + a.toFixed(3) + ')';
                ctx.fill();
            }

            raf = null;
            if (pts.length) tick();
        });
    }
}

/* ── Hero DF Rings — Gentle Mouse Tracking ── */
function setupHeroDFTracking() {
    if (!window.matchMedia('(hover: hover)').matches) return;

    var hero = document.querySelector('.hero-main');
    var rings = document.querySelector('.hero-df-rings');
    if (!hero || !rings) return;

    var curX = 0, curY = 0, tgtX = 0, tgtY = 0;
    var raf = null;

    hero.addEventListener('mousemove', function(e) {
        var rect = hero.getBoundingClientRect();
        tgtX = ((e.clientX - rect.left) / rect.width - 0.5) * 4;
        tgtY = ((e.clientY - rect.top) / rect.height - 0.5) * 4;
        if (!raf) animate();
    });

    hero.addEventListener('mouseleave', function() {
        tgtX = 0; tgtY = 0;
        if (!raf) animate();
    });

    function animate() {
        raf = requestAnimationFrame(function() {
            curX += (tgtX - curX) * 0.08;
            curY += (tgtY - curY) * 0.08;
            rings.style.transform = 'translate(calc(-50% + ' + curX.toFixed(2) + '%), calc(-50% + ' + curY.toFixed(2) + '%))';
            raf = null;
            if (Math.abs(tgtX - curX) > 0.01 || Math.abs(tgtY - curY) > 0.01) animate();
        });
    }
}

/* ── Video glow: add is-visible to demo-main-video-wrap when in view ── */
function setupVideoGlow() {
    var wraps = document.querySelectorAll('.demo-main-video-wrap');
    if (!wraps.length || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            entry.target.classList.toggle('is-visible', entry.isIntersecting);
        });
    }, { threshold: 0.3 });

    wraps.forEach(function(wrap) { observer.observe(wrap); });
}

document.addEventListener('DOMContentLoaded', function() {
    // Core interactions first (must work even if optional features fail).
    setupSingleVideoTabs('demo-tabs-generalization', 'demo-video-generalization');
    setupSingleVideoTabs('demo-tabs-longhorizon', 'demo-video-longhorizon');
    setupSingleVideoTabs('demo-tabs-recovery', 'demo-video-recovery');
    setupSingleVideoTabs('demo-tabs-sim2sim', 'demo-video-sim2sim');
    setupSingleVideoTabs('demo-tabs-realworld', 'demo-video-realworld');
    setupHandResultTabs();
    setupHandCarousels();
    setupOverviewSwitcher();
    setupMethodOverviewPanels();
    setupPlannerSkillTabs();
    setupOutlinePanel();
    setupLazyVideos();

    // Scroll-triggered reveal animations
    setupRevealAnimations();

    // Fancy visual enhancements
    setupHeroSpotlight();
    setupVideoGlow();
    setupCursorTrail();
    setupHeroDFTracking();
});
