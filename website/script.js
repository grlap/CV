(() => {
    'use strict';

    const root = document.documentElement;
    const body = document.body;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let motionPaused = reduceMotion.matches;

    root.classList.remove('no-js');

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const lerp = (start, end, amount) => start + (end - start) * amount;

    /* Entry: short enough to feel intentional, never a gate. */
    const showPage = () => {
        window.setTimeout(() => root.classList.add('is-ready'), reduceMotion.matches ? 0 : 420);
    };
    if (document.readyState === 'complete') showPage();
    else window.addEventListener('load', showPage, { once: true });
    window.setTimeout(() => root.classList.add('is-ready'), 1400);

    /* Header, progress, and section state. */
    const header = document.querySelector('[data-header]');
    const progress = document.querySelector('.scroll-progress span');
    const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
    const observedSections = navLinks
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);
    const educationSection = document.querySelector('.education');
    const contactSection = document.querySelector('#contact');
    let scrollTicking = false;

    const updateScrollUI = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const available = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        progress.style.transform = `scaleX(${clamp(scrollTop / available, 0, 1)})`;
        header.classList.toggle('is-scrolled', scrollTop > 20);

        const marker = scrollTop + window.innerHeight * 0.34;
        let current = '';
        for (const section of observedSections) {
            if (section.offsetTop <= marker) current = `#${section.id}`;
        }
        if (educationSection && contactSection && marker >= educationSection.offsetTop && marker < contactSection.offsetTop) {
            current = '';
        }
        navLinks.forEach(link => {
            const active = link.getAttribute('href') === current;
            link.classList.toggle('is-active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
        scrollTicking = false;
    };

    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(updateScrollUI);
            scrollTicking = true;
        }
    }, { passive: true });
    updateScrollUI();

    /* Mobile menu. */
    const menuButton = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.site-nav');
    const motionButton = document.querySelector('.motion-toggle');
    const brandLink = document.querySelector('.brand');
    const skipLink = document.querySelector('.skip-link');
    const pageMain = document.querySelector('main');
    const pageFooter = document.querySelector('.site-footer');
    const desktopMenu = window.matchMedia('(min-width: 801px)');
    const menuLabel = menuButton.querySelector('.sr-only');
    const setMenuBackgroundInert = value => {
        [skipLink, brandLink, motionButton, pageMain, pageFooter].forEach(element => {
            if (element) element.toggleAttribute('inert', value);
        });
    };
    const closeMenu = ({ restoreFocus = false } = {}) => {
        menuButton.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
        body.style.overflow = '';
        menuLabel.textContent = 'Open menu';
        setMenuBackgroundInert(false);
        if (restoreFocus && !desktopMenu.matches) menuButton.focus();
    };
    menuButton.addEventListener('click', () => {
        const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
        if (!willOpen) {
            closeMenu({ restoreFocus: true });
            return;
        }
        menuButton.setAttribute('aria-expanded', String(willOpen));
        menu.classList.toggle('is-open', willOpen);
        body.style.overflow = willOpen ? 'hidden' : '';
        menuLabel.textContent = 'Close menu';
        setMenuBackgroundInert(true);
        const focusFirstLink = () => menu.querySelector('a')?.focus({ preventScroll: true });
        focusFirstLink();
        window.setTimeout(() => {
            if (menuButton.getAttribute('aria-expanded') === 'true' && !menu.contains(document.activeElement)) {
                focusFirstLink();
            }
        }, 50);
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    window.addEventListener('keydown', event => {
        if (menuButton.getAttribute('aria-expanded') !== 'true') return;
        if (event.key === 'Escape') {
            event.preventDefault();
            closeMenu({ restoreFocus: true });
            return;
        }
        if (event.key !== 'Tab') return;
        const focusable = [menuButton, ...menu.querySelectorAll('a')];
        const currentIndex = focusable.indexOf(document.activeElement);
        if (event.shiftKey && currentIndex <= 0) {
            event.preventDefault();
            focusable[focusable.length - 1].focus();
        } else if (!event.shiftKey && currentIndex === focusable.length - 1) {
            event.preventDefault();
            focusable[0].focus();
        }
    });
    desktopMenu.addEventListener?.('change', event => {
        if (event.matches) closeMenu();
    });

    /* Reveal system. */
    const revealTargets = [...document.querySelectorAll('[data-reveal], [data-career-map]')];

    const revealObserver = 'IntersectionObserver' in window
        ? new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -9% 0px', threshold: 0.12 })
        : null;

    revealTargets.forEach((target, index) => {
        if (target.closest('[data-stagger]')) {
            target.style.transitionDelay = `${(index % 2) * 90}ms`;
        }
        if (revealObserver) revealObserver.observe(target);
        else target.classList.add('is-visible');
    });

    /* Contention field: independent load waves overlap, then converge on fair admission. */
    const queueField = document.querySelector('.queue-visual');
    const queueWaves = queueField ? [...queueField.querySelectorAll('.queue-wave')] : [];
    if (queueField && queueWaves.length === 4) {
        const waveProfiles = [
            { baseY: 145, amplitude: 90, frequency: .043, speed: 1.55, phase: .2, targetY: 107 },
            { baseY: 205, amplitude: 78, frequency: .058, speed: 2.35, phase: 1.65, targetY: 185 },
            { baseY: 260, amplitude: 66, frequency: .075, speed: 1.08, phase: 3.2, targetY: 263 },
            { baseY: 310, amplitude: 52, frequency: .098, speed: 3.05, phase: 4.7, targetY: 341 }
        ];
        let queueFieldOnScreen = true;
        let queueWaveTime = 0;
        let queueWavePreviousFrame = performance.now();
        let queueWavePreviousDraw = 0;

        const pathForLoadWave = (profile, time) => {
            let path = '';
            for (let x = 28; x <= 322; x += 5) {
                const phase = x * profile.frequency - time * profile.speed + profile.phase;
                const breathing = .82 + .18 * Math.sin(x * .012 + time * profile.speed * .37 + profile.phase);
                const primary = profile.amplitude * breathing * Math.sin(phase);
                const harmonic = profile.amplitude * .13 * Math.sin(phase * .47 + time * profile.speed * .71);
                const freeY = profile.baseY + primary + harmonic;
                const convergence = clamp((x - 256) / 66, 0, 1);
                const easedConvergence = convergence * convergence * (3 - 2 * convergence);
                const y = lerp(freeY, profile.targetY, easedConvergence);
                path += `${path ? 'L' : 'M'}${x} ${y.toFixed(2)}`;
            }
            return path;
        };

        const renderQueueWaves = () => {
            queueWaves.forEach((wave, index) => {
                wave.setAttribute('d', pathForLoadWave(waveProfiles[index], queueWaveTime));
            });
        };
        const animateQueueWaves = now => {
            const elapsed = Math.min(64, now - queueWavePreviousFrame);
            queueWavePreviousFrame = now;
            if (queueFieldOnScreen && !motionPaused && !document.hidden) {
                queueWaveTime += elapsed / 1000;
                if (now - queueWavePreviousDraw >= 32) {
                    renderQueueWaves();
                    queueWavePreviousDraw = now;
                }
            }
            requestAnimationFrame(animateQueueWaves);
        };
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                queueFieldOnScreen = entry.isIntersecting;
                if (queueFieldOnScreen) renderQueueWaves();
            }, { rootMargin: '120px 0px' }).observe(queueField);
        }
        renderQueueWaves();
        requestAnimationFrame(animateQueueWaves);
    }

    /* A propagated phase makes the agentic braid rotate as a travelling wave. */
    const braidMap = document.querySelector('[data-career-map]');
    const braidA = document.querySelector('.career-braid-strand--a');
    const braidB = document.querySelector('.career-braid-strand--b');
    if (braidMap && braidA && braidB) {
        const sampleCount = 17;
        const axis = Array.from({ length: sampleCount }, (_, index) => {
            const t = index / (sampleCount - 1);
            return {
                t,
                x: 1088 + 152 * (.45 * t + .55 * Math.sqrt(t)) - 35 * Math.pow(t, 3),
                y: 18 - 558 * t,
                amplitude: 36 * Math.pow(t, .8)
            };
        });
        const pathForPhase = (phase, direction) => {
            const points = axis.map((point, index) => {
                const offset = direction * point.amplitude * Math.cos(index * Math.PI / 2 - phase);
                return { x: point.x + offset, y: point.y + offset * .18 };
            });
            let path = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
            for (let index = 0; index < points.length - 1; index += 1) {
                const p0 = points[Math.max(0, index - 1)];
                const p1 = points[index];
                const p2 = points[index + 1];
                const p3 = points[Math.min(points.length - 1, index + 2)];
                const c1x = p1.x + (p2.x - p0.x) / 6;
                const c1y = p1.y + (p2.y - p0.y) / 6;
                const c2x = p2.x - (p3.x - p1.x) / 6;
                const c2y = p2.y - (p3.y - p1.y) / 6;
                path += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
            }
            return path;
        };
        let braidOnScreen = true;
        let braidPhase = 0;
        let previousFrame = performance.now();
        const renderBraid = () => {
            braidA.setAttribute('d', pathForPhase(braidPhase, 1));
            braidB.setAttribute('d', pathForPhase(braidPhase, -1));
        };
        const animateBraid = now => {
            const elapsed = Math.min(64, now - previousFrame);
            previousFrame = now;
            if (braidOnScreen && !motionPaused && !document.hidden) {
                braidPhase = (braidPhase + elapsed * Math.PI * 2 / 4000) % (Math.PI * 2);
                renderBraid();
            }
            requestAnimationFrame(animateBraid);
        };
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                braidOnScreen = entry.isIntersecting;
            }, { rootMargin: '120px 0px' }).observe(braidMap);
        }
        renderBraid();
        requestAnimationFrame(animateBraid);
    }

    /* Career rows preview on hover and can be pinned open for touch and keyboard users. */
    const careerRows = [...document.querySelectorAll('.career-ledger > article')];
    const careerLedger = document.querySelector('.career-ledger');
    let careerPreviewRow = null;
    const clearCareerPreview = () => {
        careerPreviewRow?.classList.remove('is-preview');
        careerPreviewRow = null;
    };
    const setCareerPreview = row => {
        if (careerPreviewRow === row) return;
        clearCareerPreview();
        careerPreviewRow = row;
        careerPreviewRow?.classList.add('is-preview');
    };
    const setCareerRowExpanded = (row, expanded) => {
        const button = row.querySelector('.career-ledger__toggle');
        const detail = row.querySelector('.career-ledger__detail');
        const company = row.querySelector('h3')?.textContent.trim() || 'this role';
        if (!button || !detail) return;

        row.classList.toggle('is-expanded', expanded);
        button.setAttribute('aria-expanded', String(expanded));
        button.setAttribute('aria-label', `${expanded ? 'Hide' : 'Show'} details for ${company}`);
        detail.setAttribute('aria-hidden', String(!expanded));
    };

    careerRows.forEach(row => {
        const button = row.querySelector('.career-ledger__toggle');
        if (!button) return;

        button.addEventListener('click', () => {
            const willExpand = button.getAttribute('aria-expanded') !== 'true';
            clearCareerPreview();
            careerRows.forEach(otherRow => {
                if (otherRow !== row && otherRow.classList.contains('is-expanded')) {
                    setCareerRowExpanded(otherRow, false);
                }
            });
            setCareerRowExpanded(row, willExpand);
        });
        row.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || !row.classList.contains('is-expanded')) return;
            setCareerRowExpanded(row, false);
            button.focus();
        });
    });

    if (careerLedger && finePointer.matches) {
        const edgeGuard = 12;
        careerLedger.addEventListener('pointermove', event => {
            if (event.pointerType && event.pointerType !== 'mouse') return;
            if (careerRows.some(row => row.classList.contains('is-expanded'))) {
                clearCareerPreview();
                return;
            }
            const row = careerRows.find(candidate => candidate.contains(event.target));
            if (!row) {
                clearCareerPreview();
                return;
            }
            const bounds = row.getBoundingClientRect();
            const withinEdgeGuard = event.clientY - bounds.top < edgeGuard
                || bounds.bottom - event.clientY < edgeGuard;
            setCareerPreview(withinEdgeGuard ? null : row);
        });
        careerLedger.addEventListener('pointerleave', clearCareerPreview);
    }

    /* Earlier experience opens on desktop hover and closes when the block is left. */
    const earlierExperience = document.querySelector('.career-ledger__earlier');
    const earlierSummary = earlierExperience?.querySelector('summary');
    const earlierGrid = earlierExperience?.querySelector('.career-ledger__earlier-grid');
    if (earlierExperience && earlierSummary && earlierGrid && finePointer.matches) {
        let detailsAnimation = null;
        let contentAnimation = null;

        const finishDetailsAnimation = () => {
            contentAnimation?.cancel();
            earlierExperience.style.height = '';
            earlierExperience.style.overflowX = '';
            earlierExperience.style.overflowY = '';
            detailsAnimation = null;
            contentAnimation = null;
        };

        const clipHeightOnly = () => {
            earlierExperience.style.overflowX = 'visible';
            earlierExperience.style.overflowY = 'clip';
        };

        const setEarlierExperienceOpen = shouldOpen => {
            detailsAnimation?.cancel();
            contentAnimation?.cancel();

            if (shouldOpen) {
                const startHeight = earlierExperience.getBoundingClientRect().height;
                earlierExperience.open = true;
                const endHeight = earlierExperience.scrollHeight;
                if (reduceMotion.matches || motionPaused || typeof earlierExperience.animate !== 'function') {
                    finishDetailsAnimation();
                    return;
                }
                earlierExperience.style.height = `${startHeight}px`;
                clipHeightOnly();
                detailsAnimation = earlierExperience.animate(
                    [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
                    { duration: 420, easing: 'cubic-bezier(.22, 1, .36, 1)' }
                );
                contentAnimation = earlierGrid.animate(
                    [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'translateY(0)' }],
                    { duration: 330, easing: 'cubic-bezier(.22, 1, .36, 1)' }
                );
                detailsAnimation.onfinish = finishDetailsAnimation;
                return;
            }

            if (!earlierExperience.open) return;
            const startHeight = earlierExperience.getBoundingClientRect().height;
            const endHeight = earlierSummary.getBoundingClientRect().height;
            if (reduceMotion.matches || motionPaused || typeof earlierExperience.animate !== 'function') {
                earlierExperience.open = false;
                finishDetailsAnimation();
                return;
            }
            earlierExperience.style.height = `${startHeight}px`;
            clipHeightOnly();
            detailsAnimation = earlierExperience.animate(
                [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
                { duration: 360, easing: 'cubic-bezier(.65, 0, .35, 1)' }
            );
            contentAnimation = earlierGrid.animate(
                [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-8px)' }],
                { duration: 240, easing: 'ease-in', fill: 'forwards' }
            );
            detailsAnimation.onfinish = () => {
                earlierExperience.open = false;
                finishDetailsAnimation();
            };
        };

        earlierExperience.addEventListener('pointerenter', () => setEarlierExperienceOpen(true));
        earlierExperience.addEventListener('pointerleave', () => setEarlierExperienceOpen(false));
        earlierSummary.addEventListener('click', event => {
            if (event.detail > 0 && earlierExperience.open) event.preventDefault();
        });
    }

    /* Live EEG: independent bands form irregular wave packets, not a cardiac pulse. */
    const eeg = document.querySelector('.education__wave');
    const eegPaths = eeg ? [...eeg.querySelectorAll('path')] : [];
    if (eeg && eegPaths.length === 3) {
        const channels = [
            { base: 20, amplitude: 8, frequencies: [.095, .265, .61, 1.12], speeds: [1.55, 2.7, 5.2, 7.1], phase: .3, packetSpeed: 58, packetOffset: 40 },
            { base: 48, amplitude: 11, frequencies: [.13, .34, .78, 1.32], speeds: [2.05, 3.8, 6.4, 8.8], phase: 1.7, packetSpeed: 73, packetOffset: 260 },
            { base: 76, amplitude: 9, frequencies: [.08, .23, .56, 1.04], speeds: [1.3, 2.45, 4.7, 7.6], phase: 3.1, packetSpeed: 49, packetOffset: 480 }
        ];
        const weights = [.51, .26, .15, .08];
        let eegOnScreen = false;
        let eegTime = 0;
        let eegPreviousFrame = performance.now();
        let eegPreviousDraw = 0;

        const pathForChannel = (channel, time) => {
            const packetCenter = ((time * channel.packetSpeed + channel.packetOffset) % 720) - 60;
            let path = '';
            for (let x = -24; x <= 624; x += 4) {
                const distance = (x - packetCenter) / 72;
                const packet = Math.exp(-(distance * distance));
                const envelope = .68 + .62 * packet + .1 * Math.sin(x * .017 - time * .7 + channel.phase);
                const signal = channel.frequencies.reduce((sum, frequency, index) => {
                    const direction = index % 2 === 0 ? -1 : 1;
                    return sum + weights[index] * Math.sin(
                        x * frequency + direction * time * channel.speeds[index] + channel.phase * (index + 1)
                    );
                }, 0);
                const y = channel.base + channel.amplitude * envelope * signal;
                path += `${path ? 'L' : 'M'}${x} ${y.toFixed(2)}`;
            }
            return path;
        };

        const renderEeg = () => {
            eegPaths.forEach((path, index) => {
                path.setAttribute('d', pathForChannel(channels[index], eegTime));
            });
        };
        const animateEeg = now => {
            const elapsed = Math.min(64, now - eegPreviousFrame);
            eegPreviousFrame = now;
            if (eegOnScreen && !motionPaused && !document.hidden) {
                eegTime += elapsed / 1000;
                if (now - eegPreviousDraw >= 33) {
                    renderEeg();
                    eegPreviousDraw = now;
                }
            }
            requestAnimationFrame(animateEeg);
        };
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                eegOnScreen = entry.isIntersecting;
                if (eegOnScreen) renderEeg();
            }, { rootMargin: '120px 0px' }).observe(eeg);
        } else {
            eegOnScreen = true;
        }
        renderEeg();
        requestAnimationFrame(animateEeg);
    }

    /* Local Redmond time, with no network dependency. */
    const timeNode = document.querySelector('[data-local-time]');
    const updateLocalTime = () => {
        try {
            const value = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Los_Angeles',
                hour: 'numeric',
                minute: '2-digit'
            }).format(new Date());
            timeNode.textContent = `${value} local`;
        } catch (_) {
            timeNode.textContent = 'Pacific time';
        }
    };
    updateLocalTime();
    window.setInterval(updateLocalTime, 60_000);

    /* Pointer glow and magnetic controls. */
    if (finePointer.matches && !reduceMotion.matches) {
        window.addEventListener('pointermove', event => {
            if (motionPaused) return;
            root.style.setProperty('--cursor-x', `${event.clientX}px`);
            root.style.setProperty('--cursor-y', `${event.clientY}px`);
        }, { passive: true });

        document.querySelectorAll('.magnetic').forEach(element => {
            element.addEventListener('pointermove', event => {
                if (motionPaused) {
                    element.style.transform = '';
                    return;
                }
                const bounds = element.getBoundingClientRect();
                const x = (event.clientX - bounds.left - bounds.width / 2) * 0.13;
                const y = (event.clientY - bounds.top - bounds.height / 2) * 0.18;
                element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            });
            element.addEventListener('pointerleave', () => {
                element.style.transform = '';
            });
        });
    }

    /* Subtle, bounded depth on image/editorial cards. */
    if (finePointer.matches && !reduceMotion.matches) {
        document.querySelectorAll('[data-tilt]').forEach(element => {
            element.addEventListener('pointermove', event => {
                if (motionPaused) {
                    element.style.transform = '';
                    return;
                }
                const rect = element.getBoundingClientRect();
                const px = (event.clientX - rect.left) / rect.width - 0.5;
                const py = (event.clientY - rect.top) / rect.height - 0.5;
                element.style.transform = `perspective(1200px) rotateX(${py * -2.8}deg) rotateY(${px * 3.8}deg)`;
            });
            element.addEventListener('pointerleave', () => {
                element.style.transform = '';
            });
        });
    }

    /* Interactive software stack. */
    const layerContent = {
        agentic: {
            index: '05 / 05',
            title: 'Agentic infrastructure',
            copy: 'Code navigation, orchestration, persistence and autonomous execution for agents doing consequential engineering work.'
        },
        distributed: {
            index: '04 / 05',
            title: 'Distributed systems',
            copy: 'Async pipelines, queues, cloud networking, coordination and fair resource allocation at the scale of millions of requests.'
        },
        database: {
            index: '03 / 05',
            title: 'Databases',
            copy: 'SQL Server internals, SqlCLR hosting, type systems, execution plans, indexing and production data performance.'
        },
        systems: {
            index: '02 / 05',
            title: 'Systems programming',
            copy: 'Runtimes, concurrency, Linux namespaces, cgroups, Windows internals and network drivers—the machinery below the product.'
        },
        tools: {
            index: '01 / 05',
            title: 'Engineering tools',
            copy: 'Debugging, observability, fault injection and automation that turn individual expertise into organizational leverage.'
        }
    };
    const stackScene = document.querySelector('.stack-scene');
    const layerDetail = document.querySelector('.layer-detail');
    const layerButtons = [...document.querySelectorAll('.stack-layer')];
    const selectLayer = button => {
        const content = layerContent[button.dataset.layer];
        layerButtons.forEach(item => {
            const active = item === button;
            item.classList.toggle('is-active', active);
            item.setAttribute('aria-pressed', String(active));
        });
        layerDetail.classList.remove('is-switching');
        void layerDetail.offsetWidth;
        layerDetail.querySelector('.layer-detail__index').textContent = content.index;
        layerDetail.querySelector('h3').textContent = content.title;
        layerDetail.querySelector('p').textContent = content.copy;
        layerDetail.classList.add('is-switching');
    };
    layerButtons.forEach(button => {
        button.addEventListener('mouseenter', () => selectLayer(button));
        button.addEventListener('focus', () => selectLayer(button));
        button.addEventListener('click', () => selectLayer(button));
    });
    if (finePointer.matches && !reduceMotion.matches) {
        const stage = document.querySelector('.stack-stage');
        stage.addEventListener('pointermove', event => {
            if (motionPaused) {
                stackScene.style.transform = '';
                return;
            }
            const rect = stage.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            stackScene.style.transform = `translate(-50%, -48%) rotateX(${54 - y * 5}deg) rotateZ(${-28 + x * 7}deg)`;
        });
        stage.addEventListener('pointerleave', () => {
            stackScene.style.transform = '';
        });
    }

    /* TermAl: three supervised sessions grow and prune a live delegation tree. */
    const termalVisual = document.querySelector('[data-termal-tree]');
    if (termalVisual) {
        const edgeGroup = termalVisual.querySelector('.termal-tree__edges');
        const primaryLayer = termalVisual.querySelector('[data-termal-layer="1"]');
        const spawnedLayer = termalVisual.querySelector('[data-termal-layer="2"]');
        const terminalLayer = termalVisual.querySelector('[data-termal-layer="3"]');
        const svgNamespace = 'http://www.w3.org/2000/svg';
        const viewBox = { width: 760, height: 360 };
        let treeOnScreen = !('IntersectionObserver' in window);
        let nextTreeChange = performance.now() + 900;
        let spawnedCounter = 7;
        let terminalCounter = 10;

        const activeNodes = layer => [...layer.querySelectorAll('.termal-node:not(.is-leaving)')];
        const choose = items => items[Math.floor(Math.random() * items.length)];
        const padded = value => String(value).padStart(2, '0');

        const renderTermalEdges = () => {
            const visualRect = termalVisual.getBoundingClientRect();
            if (!visualRect.width || !visualRect.height) return;
            const scaleX = viewBox.width / visualRect.width;
            const scaleY = viewBox.height / visualRect.height;
            const elements = [...termalVisual.querySelectorAll('[data-termal-id]')];
            const byId = new Map(elements.map(element => [element.dataset.termalId, element]));
            const paths = [];

            elements.forEach(target => {
                const parent = byId.get(target.dataset.termalParent);
                if (!parent) return;
                const sourceRect = parent.getBoundingClientRect();
                const targetRect = target.getBoundingClientRect();
                const fromX = (sourceRect.right - visualRect.left) * scaleX;
                const fromY = (sourceRect.top + sourceRect.height / 2 - visualRect.top) * scaleY;
                const toX = (targetRect.left - visualRect.left) * scaleX;
                const toY = (targetRect.top + targetRect.height / 2 - visualRect.top) * scaleY;
                const reach = Math.max(28, (toX - fromX) * .48);
                const path = document.createElementNS(svgNamespace, 'path');
                const layer = target.closest('[data-termal-layer]')?.dataset.termalLayer;
                const edgeType = layer === '1' ? 'direct' : layer === '2' ? 'spawn' : 'terminal';
                path.setAttribute('class', `termal-edge termal-edge--${edgeType}`);
                path.setAttribute('d', `M${fromX.toFixed(1)} ${fromY.toFixed(1)} C${(fromX + reach).toFixed(1)} ${fromY.toFixed(1)} ${(toX - reach).toFixed(1)} ${toY.toFixed(1)} ${toX.toFixed(1)} ${toY.toFixed(1)}`);
                if (target.classList.contains('is-leaving') || parent.classList.contains('is-leaving')) {
                    path.classList.add('is-retiring');
                }
                paths.push(path);
            });
            edgeGroup.replaceChildren(...paths);
        };

        const freeSlots = layer => {
            const used = new Set([...layer.querySelectorAll('.termal-node')].map(node => Number(node.dataset.termalSlot)));
            return [0, 1, 2, 3, 4].filter(slot => !used.has(slot));
        };

        const createTermalNode = (layer, { id, parent, slot, label, shortLabel, status, type }) => {
            const node = document.createElement('span');
            const dot = document.createElement('i');
            const copy = document.createElement('span');
            const title = document.createElement('b');
            const state = document.createElement('small');
            node.className = `termal-node termal-node--${type} is-entering`;
            node.dataset.termalId = id;
            node.dataset.termalParent = parent;
            node.dataset.termalSlot = String(slot);
            node.style.setProperty('--slot', slot);
            title.textContent = label;
            title.dataset.short = shortLabel;
            state.textContent = status;
            copy.append(title, state);
            node.append(dot, copy);
            layer.append(node);
            renderTermalEdges();
            requestAnimationFrame(() => node.classList.remove('is-entering'));
            return node;
        };

        const addSpawnedNode = () => {
            const slots = freeSlots(spawnedLayer);
            const parents = activeNodes(primaryLayer);
            if (!slots.length || !parents.length) return false;
            const number = spawnedCounter++;
            createTermalNode(spawnedLayer, {
                id: `spawn-${number}`,
                parent: choose(parents).dataset.termalId,
                slot: choose(slots),
                label: `AGENT ${padded(number)}`,
                shortLabel: `A${padded(number)}`,
                status: 'DELEGATED',
                type: 'spawned'
            });
            return true;
        };

        const addTerminalNode = () => {
            const slots = freeSlots(terminalLayer);
            const parents = activeNodes(spawnedLayer);
            if (!slots.length || !parents.length) return false;
            const number = terminalCounter++;
            createTermalNode(terminalLayer, {
                id: `terminal-${number}`,
                parent: choose(parents).dataset.termalId,
                slot: choose(slots),
                label: `TERM ${padded(number)}`,
                shortLabel: `T${padded(number)}`,
                status: 'EXEC',
                type: 'terminal'
            });
            return true;
        };

        const retireTermalNode = node => {
            if (!node || node.classList.contains('is-leaving')) return false;
            node.classList.add('is-leaving');
            const state = node.querySelector('small');
            if (state) state.textContent = 'DONE';
            renderTermalEdges();
            window.setTimeout(() => {
                node.remove();
                renderTermalEdges();
            }, 360);
            return true;
        };

        const removeTerminalNode = () => {
            const terminals = activeNodes(terminalLayer);
            return terminals.length > 1 && retireTermalNode(choose(terminals));
        };

        const removeLeafSpawnedNode = () => {
            const terminals = activeNodes(terminalLayer);
            const parentIds = new Set(terminals.map(node => node.dataset.termalParent));
            const leaves = activeNodes(spawnedLayer).filter(node => !parentIds.has(node.dataset.termalId));
            return activeNodes(spawnedLayer).length > 2 && leaves.length > 0 && retireTermalNode(choose(leaves));
        };

        const mutateTermalTree = () => {
            const roll = Math.random();
            let changed = false;
            if (roll < .34) changed = addTerminalNode();
            else if (roll < .56) changed = addSpawnedNode();
            else if (roll < .88) changed = removeTerminalNode();
            else changed = removeLeafSpawnedNode();

            if (!changed) {
                changed = addTerminalNode() || addSpawnedNode() || removeTerminalNode() || removeLeafSpawnedNode();
            }
            if (changed) renderTermalEdges();
        };

        const updateTermalTree = now => {
            if (treeOnScreen && !motionPaused && !document.hidden && now >= nextTreeChange) {
                mutateTermalTree();
                nextTreeChange = now + 1050 + Math.random() * 900;
            }
            requestAnimationFrame(updateTermalTree);
        };

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                treeOnScreen = entry.isIntersecting;
                if (treeOnScreen) {
                    nextTreeChange = performance.now() + 650;
                    renderTermalEdges();
                }
            }, { rootMargin: '120px 0px' }).observe(termalVisual);
        }
        if ('ResizeObserver' in window) new ResizeObserver(renderTermalEdges).observe(termalVisual);
        else window.addEventListener('resize', renderTermalEdges, { passive: true });
        requestAnimationFrame(renderTermalEdges);
        requestAnimationFrame(updateTermalTree);
    }

    /* Starfish: fixed-rate consumers under a smoothly varying arrival load. */
    const starfishVisual = document.querySelector('.starfish-visual');
    const starfishTracks = [...document.querySelectorAll('.starfish-queue > span')];
    if (starfishVisual && starfishTracks.length) {
        let queuesOnScreen = true;
        let queuesRunning = false;

        const createTask = entering => {
            const task = document.createElement('i');
            if (entering) task.classList.add('is-entering');
            return task;
        };

        const queueStates = starfishTracks.map((track, index) => {
            const phase = index * .72;
            const initialCount = 3 + Math.round(((Math.sin(phase) + 1) / 2) * 5);
            track.replaceChildren(...Array.from({ length: initialCount }, () => createTask(false)));
            return {
                track,
                reactor: track.closest('.starfish-core-row')?.querySelector('.starfish-reactor'),
                phase,
                nextPush: 0,
                nextPop: 0,
                workingTimer: 0
            };
        });

        const capacityFor = track => Math.max(5, Math.floor((track.clientWidth - 10) / 9));

        const enqueue = state => {
            const activeTasks = state.track.querySelectorAll('i:not(.is-leaving)');
            if (activeTasks.length >= capacityFor(state.track)) return;
            const task = createTask(true);
            state.track.append(task);
            requestAnimationFrame(() => task.classList.remove('is-entering'));
        };

        const dequeue = state => {
            const task = state.track.querySelector('i:not(.is-leaving)');
            if (!task) return;
            task.classList.add('is-leaving');
            window.setTimeout(() => task.remove(), 260);
            if (!state.reactor) return;
            state.reactor.classList.add('is-working');
            window.clearTimeout(state.workingTimer);
            state.workingTimer = window.setTimeout(() => state.reactor.classList.remove('is-working'), 190);
        };

        const resetQueueClocks = now => {
            queueStates.forEach((state, index) => {
                state.nextPop = now + 420 + index * 55;
                state.nextPush = now + 160 + index * 35;
            });
        };

        const updateQueues = now => {
            const shouldRun = queuesOnScreen && !motionPaused && !document.hidden;
            if (!shouldRun) {
                queuesRunning = false;
                requestAnimationFrame(updateQueues);
                return;
            }
            if (!queuesRunning) {
                resetQueueClocks(now);
                queuesRunning = true;
            }

            queueStates.forEach(state => {
                if (now >= state.nextPop) {
                    dequeue(state);
                    state.nextPop = now + 700;
                }
                if (now >= state.nextPush) {
                    enqueue(state);
                    const load = (Math.sin(now / 1050 + state.phase) + 1) / 2;
                    const pushDelay = 180 + Math.pow(1 - load, 2) * 1480;
                    state.nextPush = now + pushDelay;
                }
            });
            requestAnimationFrame(updateQueues);
        };

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                queuesOnScreen = entry.isIntersecting;
            }, { rootMargin: '120px 0px' }).observe(starfishVisual);
        }
        requestAnimationFrame(updateQueues);
    }

    /* Canvas system field: disorder enters; stable lanes leave. */
    const canvasControllers = [];

    const createHeroField = canvas => {
        const context = canvas.getContext('2d', { alpha: true });
        if (!context) return null;
        let width = 0;
        let height = 0;
        let dpr = 1;
        let particles = [];
        let frame = 0;
        let onScreen = true;
        let pointer = { x: 0, y: 0, active: false };

        const createParticle = (randomX = true) => {
            const laneCount = 9;
            const lane = Math.floor(Math.random() * laneCount);
            return {
                x: randomX ? Math.random() * width : -20 - Math.random() * 180,
                y: Math.random() * height,
                seedY: Math.random() * height,
                laneY: height * (0.18 + (lane / (laneCount - 1)) * 0.65),
                speed: 0.22 + Math.random() * 0.58,
                size: 0.45 + Math.random() * 1.3,
                alpha: 0.12 + Math.random() * 0.38,
                phase: Math.random() * Math.PI * 2,
                tint: Math.random()
            };
        };

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            width = Math.max(1, rect.width);
            height = Math.max(1, rect.height);
            dpr = Math.min(window.devicePixelRatio || 1, 1.6);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
            const target = clamp(Math.round((width * height) / 8000), 80, 250);
            particles = Array.from({ length: target }, () => createParticle(true));
            draw();
        };

        const drawGuide = () => {
            context.save();
            context.lineWidth = 1;
            context.strokeStyle = 'rgba(145,197,243,.055)';
            for (let i = 0; i < 9; i += 1) {
                const y = height * (0.18 + (i / 8) * 0.65);
                context.beginPath();
                context.moveTo(width * .53, y);
                context.bezierCurveTo(width * .66, y - 35, width * .76, y + 18, width + 20, y);
                context.stroke();
            }
            context.restore();
        };

        const draw = () => {
            context.clearRect(0, 0, width, height);
            drawGuide();
            const time = frame * 0.008;
            particles.forEach(particle => {
                const progress = clamp(particle.x / Math.max(1, width), 0, 1);
                const organize = clamp((progress - 0.35) / 0.5, 0, 1);
                const eased = organize * organize * (3 - 2 * organize);
                const noise = Math.sin(time * (1.2 + particle.speed) + particle.phase + particle.x * .008) * (36 * (1 - eased));
                const targetY = lerp(particle.seedY, particle.laneY, eased);
                particle.y = lerp(particle.y, targetY + noise, .035 + eased * .035);

                if (pointer.active) {
                    const dx = particle.x - pointer.x;
                    const dy = particle.y - pointer.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    if (distance < 180) particle.y += (dy / distance) * (1 - distance / 180) * 1.5;
                }

                const color = particle.tint > .92
                    ? `rgba(255,91,69,${particle.alpha * .8})`
                    : particle.tint < .1
                        ? `rgba(200,255,77,${particle.alpha * .65})`
                        : `rgba(145,197,243,${particle.alpha})`;
                context.fillStyle = color;
                context.beginPath();
                context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                context.fill();

                if (!motionPaused) particle.x += particle.speed * (1 + eased * 1.15);
                if (particle.x > width + 25) Object.assign(particle, createParticle(false));
            });

            if (pointer.active) {
                context.strokeStyle = 'rgba(255,91,69,.18)';
                context.lineWidth = 1;
                context.beginPath();
                context.arc(pointer.x, pointer.y, 34 + Math.sin(time * 2) * 4, 0, Math.PI * 2);
                context.stroke();
            }
        };

        const loop = () => {
            if (onScreen && !motionPaused && !document.hidden) {
                frame += 1;
                draw();
            }
            requestAnimationFrame(loop);
        };

        canvas.addEventListener('pointermove', event => {
            const rect = canvas.getBoundingClientRect();
            pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true };
        });
        canvas.addEventListener('pointerleave', () => { pointer.active = false; });
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                onScreen = entry.isIntersecting;
                if (onScreen) draw();
            }, { rootMargin: '120px 0px' }).observe(canvas);
        }
        window.addEventListener('resize', resize, { passive: true });
        resize();
        requestAnimationFrame(loop);
        return { draw, resize };
    };

    const createContactField = canvas => {
        const context = canvas.getContext('2d', { alpha: true });
        if (!context) return null;
        let width = 0;
        let height = 0;
        let dpr = 1;
        let time = 0;
        let onScreen = false;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            width = Math.max(1, rect.width);
            height = Math.max(1, rect.height);
            dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
            draw();
        };

        const draw = () => {
            context.clearRect(0, 0, width, height);
            const centerX = width * .74;
            const centerY = height * .42;
            for (let ring = 0; ring < 13; ring += 1) {
                const radius = 44 + ring * 31 + Math.sin(time + ring * .8) * 7;
                context.beginPath();
                for (let step = 0; step <= 120; step += 1) {
                    const angle = (step / 120) * Math.PI * 2;
                    const wobble = Math.sin(angle * 3 + time * .8 + ring) * (7 + ring * .4);
                    const x = centerX + Math.cos(angle) * (radius + wobble) * 1.35;
                    const y = centerY + Math.sin(angle) * (radius + wobble) * .72;
                    if (step === 0) context.moveTo(x, y); else context.lineTo(x, y);
                }
                context.closePath();
                context.strokeStyle = `rgba(7,17,29,${0.12 - ring * .004})`;
                context.lineWidth = 1;
                context.stroke();
            }
            for (let dot = 0; dot < 90; dot += 1) {
                const angle = dot * 2.399 + time * .1;
                const radius = 24 + (dot / 90) * Math.min(width, height) * .38;
                const x = centerX + Math.cos(angle) * radius * 1.45;
                const y = centerY + Math.sin(angle) * radius * .72;
                context.fillStyle = `rgba(7,17,29,${.08 + (dot % 5) * .018})`;
                context.beginPath();
                context.arc(x, y, dot % 9 === 0 ? 2 : .8, 0, Math.PI * 2);
                context.fill();
            }
        };

        const loop = () => {
            if (onScreen && !motionPaused && !document.hidden) {
                time += .007;
                draw();
            }
            requestAnimationFrame(loop);
        };
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                onScreen = entry.isIntersecting;
                if (onScreen) draw();
            }, { rootMargin: '120px 0px' }).observe(canvas);
        } else {
            onScreen = true;
        }
        window.addEventListener('resize', resize, { passive: true });
        resize();
        requestAnimationFrame(loop);
        return { draw, resize };
    };

    const heroCanvas = document.getElementById('system-field');
    const contactCanvas = document.getElementById('contact-field');
    if (heroCanvas) canvasControllers.push(createHeroField(heroCanvas));
    if (contactCanvas) canvasControllers.push(createContactField(contactCanvas));

    /* Global motion control also controls the canvases. */
    const syncMotionButton = () => {
        root.classList.toggle('motion-paused', motionPaused);
        motionButton.setAttribute('aria-pressed', String(motionPaused));
        motionButton.setAttribute('aria-label', motionPaused ? 'Resume page motion' : 'Pause page motion');
        motionButton.querySelector('.motion-toggle__label').textContent = motionPaused ? 'Resume motion' : 'Pause motion';
        if (motionPaused) {
            document.querySelectorAll('.magnetic, [data-tilt], .stack-scene').forEach(element => {
                element.style.transform = '';
            });
            canvasControllers.forEach(controller => controller && controller.draw());
        }
    };
    motionButton.addEventListener('click', () => {
        motionPaused = !motionPaused;
        syncMotionButton();
    });
    reduceMotion.addEventListener?.('change', event => {
        motionPaused = event.matches;
        syncMotionButton();
    });
    syncMotionButton();

    /* Fix a browser edge case after back/forward cache restoration. */
    window.addEventListener('pageshow', event => {
        if (event.persisted) {
            closeMenu();
            updateScrollUI();
            canvasControllers.forEach(controller => controller && controller.resize());
        }
    });
})();
