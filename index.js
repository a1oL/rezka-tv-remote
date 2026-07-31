(function () {
    "use strict";

    if (window.__REZKA_TV_REMOTE_V1__) {
        return;
    }
    window.__REZKA_TV_REMOTE_V1__ = true;

    var CONFIG = {
        pageZoom1080p: 1.70,
        pageZoom720p: 1.15,
        focusColor: "#39ff88",
        seekSeconds: 10,
        focusSelector: [
            ".b-content__inline_item",
            ".b-topnav__item-link",
            ".b-topnav__sub a",
            ".b-search__field",
            ".b-search__submit",
            ".b-tophead__logo",
            ".b-tophead__login",
            ".b-tophead__register_page",
            ".b-theme__switcher",
            ".btn",
            ".b-simple_season__item",
            ".b-simple_episode__item",
            ".b-translator__item",
            ".b-post__social_holder a",
            ".b-post__rating a",
            "#cdnplayer-container",
            "#oframecdnplayer",
            "pjsdiv[style*='cursor: pointer']",
            "pjsdiv[style*='pointer-events: auto']",
            "a[href]",
            "button",
            "input:not([type='hidden'])",
            "select",
            "textarea",
            "[role='button']",
            "[tabindex]:not([tabindex='-1'])",
            "[onclick]"
        ].join(",")
    };

    var current = null;
    var candidates = [];
    var refreshTimer = 0;
    var zoomValue = 1;
    var lastBackAt = 0;
    var keyCodes = {};
    var initialized = false;

    function safePrevent(event) {
        try {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        } catch (ignore) {}
    }

    function addStyle() {
        if (document.getElementById("rezka-tv-remote-style")) {
            return;
        }

        var style = document.createElement("style");
        style.id = "rezka-tv-remote-style";
        style.type = "text/css";
        style.textContent =
            "[data-rezka-tv-focus='1']{" +
                "outline:5px solid " + CONFIG.focusColor + " !important;" +
                "outline-offset:4px !important;" +
                "box-shadow:0 0 0 3px rgba(0,0,0,.75),0 0 24px rgba(57,255,136,.9) !important;" +
                "position:relative !important;" +
                "z-index:2147483000 !important;" +
            "}" +
            ".b-content__inline_item[data-rezka-tv-focus='1']{" +
                "transform:scale(1.055) !important;" +
                "transform-origin:center center !important;" +
            "}" +
            "pjsdiv[data-rezka-tv-focus='1']{" +
                "outline-width:3px !important;" +
                "outline-offset:2px !important;" +
            "}" +
            "#rezka-tv-toast{" +
                "position:fixed !important;" +
                "right:28px !important;" +
                "bottom:28px !important;" +
                "padding:14px 20px !important;" +
                "border-radius:8px !important;" +
                "background:rgba(5,8,10,.93) !important;" +
                "border:2px solid rgba(57,255,136,.75) !important;" +
                "color:#fff !important;" +
                "font:700 18px Arial,sans-serif !important;" +
                "letter-spacing:.3px !important;" +
                "z-index:2147483647 !important;" +
                "opacity:0 !important;" +
                "pointer-events:none !important;" +
                "transition:opacity .15s linear !important;" +
            "}" +
            "#rezka-tv-toast.rezka-tv-show{opacity:1 !important;}";

        (document.head || document.documentElement).appendChild(style);
    }

    function toast(text, duration) {
        var node = document.getElementById("rezka-tv-toast");
        if (!node) {
            node = document.createElement("div");
            node.id = "rezka-tv-toast";
            (document.body || document.documentElement).appendChild(node);
        }

        node.textContent = text;
        node.className = "rezka-tv-show";

        window.clearTimeout(node.__rezkaTimer);
        node.__rezkaTimer = window.setTimeout(function () {
            node.className = "";
        }, duration || 1400);
    }

    function setViewport() {
        var meta = document.querySelector("meta[name='viewport']");
        if (!meta && document.head) {
            meta = document.createElement("meta");
            meta.name = "viewport";
            document.head.appendChild(meta);
        }

        if (meta) {
            meta.setAttribute(
                "content",
                "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
            );
        }
    }

    function fullscreenElement() {
        return document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement ||
            null;
    }

    function applyPageZoom() {
        var width = 1920;

        try {
            width = window.screen && window.screen.width ?
                window.screen.width :
                window.innerWidth;
        } catch (ignore) {}

        if (fullscreenElement()) {
            zoomValue = 1;
        } else if (width >= 1600) {
            zoomValue = CONFIG.pageZoom1080p;
        } else if (width >= 1100) {
            zoomValue = 1.35;
        } else {
            zoomValue = CONFIG.pageZoom720p;
        }

        try {
            document.documentElement.style.zoom = String(zoomValue);
        } catch (ignore2) {}
    }

    function removeKnownAdFrames() {
        var selectors = [
            "script[src*='franecki.net']",
            "script[src*='clarity.ms']",
            "script[src*='mc.yandex']",
            "script[src*='yandex-metrica']",
            "iframe[src*='franecki.net']",
            "iframe[src*='reichelcormier']",
            "iframe[src*='godsave.lgbt']"
        ];
        var nodes;
        var i;

        try {
            nodes = document.querySelectorAll(selectors.join(","));
            for (i = 0; i < nodes.length; i += 1) {
                if (nodes[i] && nodes[i].parentNode) {
                    nodes[i].parentNode.removeChild(nodes[i]);
                }
            }
        } catch (ignore) {}
    }

    function rectOf(element) {
        try {
            return element.getBoundingClientRect();
        } catch (ignore) {
            return null;
        }
    }

    function styleOf(element) {
        try {
            return window.getComputedStyle(element);
        } catch (ignore) {
            return null;
        }
    }

    function isDisabled(element) {
        return !!(
            element.disabled ||
            element.getAttribute("aria-disabled") === "true" ||
            element.getAttribute("disabled") !== null
        );
    }

    function isVisible(element) {
        var rect;
        var style;
        var parent;

        if (!element || element.nodeType !== 1 || isDisabled(element)) {
            return false;
        }

        style = styleOf(element);
        if (!style ||
            style.display === "none" ||
            style.visibility === "hidden" ||
            parseFloat(style.opacity || "1") < 0.04) {
            return false;
        }

        rect = rectOf(element);
        if (!rect || rect.width < 7 || rect.height < 7) {
            return false;
        }

        parent = element.parentElement;
        while (parent && parent !== document.body) {
            style = styleOf(parent);
            if (style &&
                (style.display === "none" ||
                 style.visibility === "hidden" ||
                 parseFloat(style.opacity || "1") < 0.04)) {
                return false;
            }
            parent = parent.parentElement;
        }

        return true;
    }

    function isTextInput(element) {
        var tag;
        var type;

        if (!element) {
            return false;
        }

        tag = String(element.tagName || "").toLowerCase();
        type = String(element.type || "").toLowerCase();

        return tag === "textarea" ||
            element.isContentEditable ||
            (tag === "input" &&
             type !== "button" &&
             type !== "submit" &&
             type !== "checkbox" &&
             type !== "radio" &&
             type !== "range");
    }

    function cardTarget(element) {
        var card;
        if (!element || !element.closest) {
            return element;
        }

        card = element.closest(".b-content__inline_item");
        if (card) {
            return card;
        }

        return element;
    }

    function centerKey(rect) {
        return Math.round((rect.left + rect.right) / 4) + ":" +
            Math.round((rect.top + rect.bottom) / 4);
    }

    function refreshCandidates() {
        var nodes;
        var list = [];
        var used = {};
        var i;
        var node;
        var target;
        var rect;
        var key;

        refreshTimer = 0;

        try {
            nodes = document.querySelectorAll(CONFIG.focusSelector);
        } catch (ignore) {
            nodes = [];
        }

        for (i = 0; i < nodes.length; i += 1) {
            node = nodes[i];
            target = cardTarget(node);

            if (!isVisible(target)) {
                continue;
            }

            rect = rectOf(target);
            if (!rect) {
                continue;
            }

            key = centerKey(rect);

            if (used[key]) {
                /*
                 * PlayerJS bieži izveido vairākus elementus vienā un tajā pašā
                 * koordinātē. Paturam mazāko klikšķināmo elementu.
                 */
                if ((rect.width * rect.height) <
                    (used[key].rect.width * used[key].rect.height)) {
                    used[key].element = target;
                    used[key].rect = rect;
                }
                continue;
            }

            used[key] = {
                element: target,
                rect: rect
            };
            list.push(used[key]);
        }

        candidates = list;

        if (current && !isVisible(current)) {
            clearFocus();
        }

        if (!current) {
            focusPreferredStart();
        }
    }

    function scheduleRefresh(delay) {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(refreshCandidates, delay || 50);
    }

    function clearFocus() {
        if (current) {
            try {
                current.removeAttribute("data-rezka-tv-focus");
            } catch (ignore) {}
        }
        current = null;
    }

    function scrollToElement(element) {
        var rect;
        var targetTop;
        var targetLeft;

        if (!element) {
            return;
        }

        try {
            element.scrollIntoView({
                block: "center",
                inline: "center",
                behavior: "auto"
            });
            return;
        } catch (ignore) {}

        rect = rectOf(element);
        if (!rect) {
            return;
        }

        targetTop = window.pageYOffset + rect.top -
            ((window.innerHeight - rect.height) / 2);
        targetLeft = window.pageXOffset + rect.left -
            ((window.innerWidth - rect.width) / 2);

        try {
            window.scrollTo(Math.max(0, targetLeft), Math.max(0, targetTop));
        } catch (ignore2) {}
    }

    function setFocus(element, shouldScroll) {
        if (!element || !isVisible(element)) {
            return false;
        }

        if (current && current !== element) {
            try {
                current.removeAttribute("data-rezka-tv-focus");
            } catch (ignore) {}
        }

        current = element;

        try {
            current.setAttribute("data-rezka-tv-focus", "1");
        } catch (ignore2) {}

        try {
            if (typeof current.focus === "function") {
                current.focus({ preventScroll: true });
            }
        } catch (ignore3) {
            try { current.focus(); } catch (ignore4) {}
        }

        if (shouldScroll !== false) {
            scrollToElement(current);
        }

        if (isPlayerElement(current)) {
            wakePlayerControls();
        }

        return true;
    }

    function focusPreferredStart() {
        var player;
        var cards;
        var menu;
        var i;

        if (/\/[^\/]+\.html(?:$|\?)/i.test(String(location.href))) {
            player = document.getElementById("cdnplayer-container") ||
                document.getElementById("oframecdnplayer");
            if (player && isVisible(player)) {
                setFocus(player, true);
                return;
            }
        }

        cards = document.querySelectorAll(".b-content__inline_item");
        for (i = 0; i < cards.length; i += 1) {
            if (isVisible(cards[i])) {
                setFocus(cards[i], true);
                return;
            }
        }

        menu = document.querySelector(
            ".b-topnav__item-link, .b-search__field, a[href], button"
        );
        if (menu && isVisible(menu)) {
            setFocus(menu, false);
        }
    }

    function intersectionLength(a1, a2, b1, b2) {
        return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
    }

    function candidateScore(fromRect, toRect, direction) {
        var fx = (fromRect.left + fromRect.right) / 2;
        var fy = (fromRect.top + fromRect.bottom) / 2;
        var tx = (toRect.left + toRect.right) / 2;
        var ty = (toRect.top + toRect.bottom) / 2;
        var dx = tx - fx;
        var dy = ty - fy;
        var primary;
        var secondary;
        var overlap;
        var edgeGap;

        if (direction === "left") {
            if (dx >= -2) { return Infinity; }
            primary = Math.abs(dx);
            secondary = Math.abs(dy);
            overlap = intersectionLength(
                fromRect.top, fromRect.bottom,
                toRect.top, toRect.bottom
            );
            edgeGap = Math.max(0, fromRect.left - toRect.right);
        } else if (direction === "right") {
            if (dx <= 2) { return Infinity; }
            primary = Math.abs(dx);
            secondary = Math.abs(dy);
            overlap = intersectionLength(
                fromRect.top, fromRect.bottom,
                toRect.top, toRect.bottom
            );
            edgeGap = Math.max(0, toRect.left - fromRect.right);
        } else if (direction === "up") {
            if (dy >= -2) { return Infinity; }
            primary = Math.abs(dy);
            secondary = Math.abs(dx);
            overlap = intersectionLength(
                fromRect.left, fromRect.right,
                toRect.left, toRect.right
            );
            edgeGap = Math.max(0, fromRect.top - toRect.bottom);
        } else {
            if (dy <= 2) { return Infinity; }
            primary = Math.abs(dy);
            secondary = Math.abs(dx);
            overlap = intersectionLength(
                fromRect.left, fromRect.right,
                toRect.left, toRect.right
            );
            edgeGap = Math.max(0, toRect.top - fromRect.bottom);
        }

        return (edgeGap * 4.0) +
            primary +
            (secondary * (overlap > 0 ? 0.55 : 2.25)) -
            (overlap > 0 ? 900 : 0);
    }

    function findNext(direction) {
        var fromRect;
        var best = null;
        var bestScore = Infinity;
        var i;
        var entry;
        var score;

        if (!current || !isVisible(current)) {
            focusPreferredStart();
            return current;
        }

        fromRect = rectOf(current);
        if (!fromRect) {
            return null;
        }

        for (i = 0; i < candidates.length; i += 1) {
            entry = candidates[i];

            if (entry.element === current || !isVisible(entry.element)) {
                continue;
            }

            entry.rect = rectOf(entry.element);
            if (!entry.rect) {
                continue;
            }

            score = candidateScore(fromRect, entry.rect, direction);
            if (score < bestScore) {
                bestScore = score;
                best = entry.element;
            }
        }

        return best;
    }

    function fallbackScroll(direction) {
        var x = window.pageXOffset || 0;
        var y = window.pageYOffset || 0;
        var amountY = Math.max(260, Math.floor(window.innerHeight * 0.72));
        var amountX = Math.max(300, Math.floor(window.innerWidth * 0.60));

        if (direction === "up") {
            y = Math.max(0, y - amountY);
        } else if (direction === "down") {
            y += amountY;
        } else if (direction === "left") {
            x = Math.max(0, x - amountX);
        } else {
            x += amountX;
        }

        try {
            window.scrollTo(x, y);
        } catch (ignore) {}

        scheduleRefresh(90);
    }

    function move(direction) {
        var next;

        wakePlayerControls();
        refreshCandidates();

        next = findNext(direction);
        if (next) {
            setFocus(next, true);
        } else {
            fallbackScroll(direction);
        }
    }

    function dispatchMouse(element, type) {
        var rect;
        var event;
        var x;
        var y;

        if (!element) {
            return;
        }

        rect = rectOf(element);
        if (!rect) {
            return;
        }

        x = rect.left + (rect.width / 2);
        y = rect.top + (rect.height / 2);

        try {
            event = new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: x,
                clientY: y,
                button: 0
            });
        } catch (ignore) {
            try {
                event = document.createEvent("MouseEvents");
                event.initMouseEvent(
                    type, true, true, window, 1,
                    x, y, x, y,
                    false, false, false, false,
                    0, null
                );
            } catch (ignore2) {
                event = null;
            }
        }

        if (event) {
            try { element.dispatchEvent(event); } catch (ignore3) {}
        }
    }

    function playerVideo() {
        return document.querySelector(
            "#oframecdnplayer video, #cdnplayer-container video, video"
        );
    }

    function isPlayerElement(element) {
        if (!element) {
            return false;
        }

        return element.id === "cdnplayer-container" ||
            element.id === "oframecdnplayer" ||
            (element.closest &&
             !!element.closest("#cdnplayer-container, #oframecdnplayer"));
    }

    function wakePlayerControls() {
        var player = document.getElementById("oframecdnplayer") ||
            document.getElementById("cdnplayer-container");

        if (!player) {
            return;
        }

        dispatchMouse(player, "mousemove");
        dispatchMouse(player, "mouseover");
        scheduleRefresh(45);
    }

    function togglePlayPause() {
        var video = playerVideo();

        if (!video) {
            return false;
        }

        try {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
            return true;
        } catch (ignore) {
            return false;
        }
    }

    function seekVideo(seconds) {
        var video = playerVideo();
        if (!video) {
            return false;
        }

        try {
            video.currentTime = Math.max(
                0,
                Math.min(
                    isFinite(video.duration) ? video.duration : video.currentTime + seconds,
                    video.currentTime + seconds
                )
            );
            wakePlayerControls();
            return true;
        } catch (ignore) {
            return false;
        }
    }

    function activate(element) {
        var link;
        var tag;

        if (!element) {
            return;
        }

        tag = String(element.tagName || "").toLowerCase();

        if (isTextInput(element)) {
            try {
                element.focus();
                element.click();
            } catch (ignore) {}
            return;
        }

        if (element.classList &&
            element.classList.contains("b-content__inline_item")) {
            link = element.querySelector(
                ".b-content__inline_item-cover a[href], " +
                ".b-content__inline_item-link a[href], a[href]"
            );
            if (link) {
                try {
                    link.click();
                    return;
                } catch (ignore2) {}
            }
        }

        if ((element.id === "cdnplayer-container" ||
             element.id === "oframecdnplayer" ||
             tag === "video") &&
            togglePlayPause()) {
            return;
        }

        try {
            if (typeof element.click === "function") {
                element.click();
                return;
            }
        } catch (ignore3) {}

        dispatchMouse(element, "mousedown");
        dispatchMouse(element, "mouseup");
        dispatchMouse(element, "click");
    }

    function exitFullscreen() {
        try {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                return true;
            }
            if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
                return true;
            }
            if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
                return true;
            }
            if (document.msExitFullscreen) {
                document.msExitFullscreen();
                return true;
            }
        } catch (ignore) {}

        return false;
    }

    function handleBack(event) {
        var now = Date.now();

        safePrevent(event);

        if (fullscreenElement()) {
            exitFullscreen();
            return;
        }

        if (history.length > 1) {
            try {
                history.back();
                return;
            } catch (ignore) {}
        }

        if (now - lastBackAt < 1600) {
            try {
                tizen.application.getCurrentApplication().exit();
            } catch (ignore2) {
                try { window.close(); } catch (ignore3) {}
            }
            return;
        }

        lastBackAt = now;
        toast("Nospied RETURN vēlreiz, lai aizvērtu", 1500);
    }

    function registerMediaKeys() {
        var names = [
            "MediaPlay",
            "MediaPause",
            "MediaPlayPause",
            "MediaFastForward",
            "MediaRewind"
        ];
        var i;
        var key;

        try {
            if (!window.tizen ||
                !tizen.tvinputdevice ||
                !tizen.tvinputdevice.registerKey) {
                return;
            }

            for (i = 0; i < names.length; i += 1) {
                try {
                    tizen.tvinputdevice.registerKey(names[i]);
                    key = tizen.tvinputdevice.getKey(names[i]);
                    if (key && typeof key.code === "number") {
                        keyCodes[names[i]] = key.code;
                    }
                } catch (ignore) {}
            }
        } catch (ignore2) {}
    }

    function keyNameForCode(code) {
        var name;
        for (name in keyCodes) {
            if (keyCodes.hasOwnProperty(name) && keyCodes[name] === code) {
                return name;
            }
        }
        return "";
    }

    function onKeyDown(event) {
        var code = event.keyCode || event.which;
        var keyName = keyNameForCode(code);
        var active = document.activeElement;

        if (code === 10009 || code === 10182) {
            handleBack(event);
            return;
        }

        if (keyName === "MediaPlay" || keyName === "MediaPause" ||
            keyName === "MediaPlayPause") {
            safePrevent(event);
            togglePlayPause();
            return;
        }

        if (keyName === "MediaFastForward") {
            safePrevent(event);
            seekVideo(CONFIG.seekSeconds);
            return;
        }

        if (keyName === "MediaRewind") {
            safePrevent(event);
            seekVideo(-CONFIG.seekSeconds);
            return;
        }

        /*
         * Teksta laukā ļaujam bultiņām un Enter strādāt pašai lapai,
         * lai Samsung ekrāna tastatūra un meklēšana netiktu salauzta.
         */
        if (isTextInput(active) && active === current) {
            if (code === 13 || code === 65376) {
                return;
            }
            if (code === 37 || code === 38 || code === 39 || code === 40) {
                return;
            }
        }

        if (code === 37) {
            safePrevent(event);
            move("left");
            return;
        }

        if (code === 38) {
            safePrevent(event);
            move("up");
            return;
        }

        if (code === 39) {
            safePrevent(event);
            move("right");
            return;
        }

        if (code === 40) {
            safePrevent(event);
            move("down");
            return;
        }

        if (code === 13 || code === 65376) {
            safePrevent(event);
            if (!current) {
                focusPreferredStart();
            } else {
                activate(current);
            }
        }
    }

    function onPointerActivity() {
        scheduleRefresh(80);
    }

    function initialize() {
        var observer;

        if (initialized || !document.documentElement) {
            return;
        }
        initialized = true;

        setViewport();
        addStyle();
        removeKnownAdFrames();
        applyPageZoom();
        registerMediaKeys();

        document.addEventListener("keydown", onKeyDown, true);
        document.addEventListener("click", onPointerActivity, true);
        document.addEventListener("focusin", function (event) {
            if (event.target && isVisible(event.target)) {
                setFocus(cardTarget(event.target), false);
            }
        }, true);

        document.addEventListener("fullscreenchange", function () {
            applyPageZoom();
            scheduleRefresh(80);
        }, false);
        document.addEventListener("webkitfullscreenchange", function () {
            applyPageZoom();
            scheduleRefresh(80);
        }, false);

        window.addEventListener("resize", function () {
            applyPageZoom();
            scheduleRefresh(120);
        }, false);

        if (window.MutationObserver) {
            observer = new MutationObserver(function () {
                removeKnownAdFrames();
                scheduleRefresh(80);
            });

            try {
                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: [
                        "style",
                        "class",
                        "hidden",
                        "aria-hidden"
                    ]
                });
            } catch (ignore) {}
        }

        scheduleRefresh(120);

        window.setTimeout(function () {
            refreshCandidates();
            focusPreferredStart();
        }, 700);

        window.setTimeout(function () {
            refreshCandidates();
        }, 1800);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, false);
    } else {
        initialize();
    }
}());
