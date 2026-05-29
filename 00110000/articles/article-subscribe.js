(() => {
    const storageKey = 'cinematicStrawberryArticleSubscribeHiddenV3';
    const pageHiddenKey = storageKey + ':' + window.location.pathname;
    const subscribedStorageKey = 'cinematicStrawberryNewsletterSubscribed';
    const newsletterReturnKey = 'cinematicStrawberryNewsletterReturn';
    const pendingRestoreKey = 'cinematicStrawberryPendingScrollRestore';
    const isCompactSubscribeViewport = () => window.matchMedia && window.matchMedia('(max-width: 1259px)').matches;

    const clearHiddenState = () => {
        try {
            window.sessionStorage.removeItem(pageHiddenKey);
        } catch (error) {
            // Ignore storage cleanup failures.
        }
    };

    const getSubscribedState = () => {
        try {
            return window.localStorage.getItem(subscribedStorageKey) === 'true';
        } catch (error) {
            return false;
        }
    };

    const setSubscribedState = () => {
        try {
            window.localStorage.setItem(subscribedStorageKey, 'true');
            window.sessionStorage.removeItem(pageHiddenKey);
        } catch (error) {
            // If storage is blocked, the thank-you page will still confirm the action visually.
        }
    };

    const getScrollPosition = () => ({
        scrollX: window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
        scrollY: window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0,
    });

    const saveNewsletterReturn = () => {
        try {
            const scrollPosition = getScrollPosition();
            window.localStorage.setItem(newsletterReturnKey, JSON.stringify({
                url: window.location.href,
                scrollX: scrollPosition.scrollX,
                scrollY: scrollPosition.scrollY,
                savedAt: Date.now(),
            }));
        } catch (error) {
            // If storage is blocked, the thank-you page will fall back to a normal navigation target.
        }
    };

    const restorePendingScroll = () => {
        let restoreState;

        try {
            restoreState = JSON.parse(window.localStorage.getItem(pendingRestoreKey) || 'null');
        } catch (error) {
            restoreState = null;
        }

        if (!restoreState || !restoreState.url) {
            return;
        }

        let restoreUrl;

        try {
            restoreUrl = new URL(restoreState.url, window.location.origin);
        } catch (error) {
            return;
        }

        if (
            restoreUrl.origin !== window.location.origin ||
            restoreUrl.pathname !== window.location.pathname ||
            restoreUrl.search !== window.location.search
        ) {
            return;
        }

        try {
            window.localStorage.removeItem(pendingRestoreKey);
        } catch (error) {
            // Ignore storage cleanup failures.
        }

        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        const x = Number(restoreState.scrollX) || 0;
        const y = Number(restoreState.scrollY) || 0;
        const scrollBack = () => window.scrollTo({ left: x, top: y, behavior: 'auto' });

        requestAnimationFrame(() => {
            scrollBack();
            requestAnimationFrame(scrollBack);
        });

        window.addEventListener('load', scrollBack, { once: true });
        window.setTimeout(scrollBack, 250);
        window.setTimeout(scrollBack, 700);
    };

    restorePendingScroll();

    const createCard = () => {
        const existingCard = document.querySelector('.article-subscribe-card');

        if (existingCard) {
            return existingCard;
        }

        const card = document.createElement('aside');
        card.className = 'article-subscribe-card';
        card.setAttribute('aria-label', 'Cinematic Strawberry newsletter');
        card.innerHTML = [
            '<button type="button" class="article-subscribe-close" aria-label="Hide newsletter box">x</button>',
            '<form action="https://app.kit.com/forms/9453676/subscriptions" method="post" target="_self" class="article-subscribe-form">',
            '<label for="article-kit-email" class="article-subscribe-label">Newsletter</label>',
            '<input type="email" name="email_address" id="article-kit-email" class="article-subscribe-input" placeholder="Email address" autocomplete="email" required>',
            '<input type="submit" value="Subscribe" class="article-subscribe-button">',
            '<p class="article-subscribe-privacy">You can unsubscribe anytime. Please review our <a href="/privacy.html">Privacy Policy</a>.</p>',
            '<p class="article-subscribe-privacy"><a href="https://kit.com/privacy" target="_blank" rel="noopener">Powered by Kit</a></p>',
            '</form>',
        ].join('');

        const header = document.querySelector('.header');
        const shouldUseMobilePlacement = isCompactSubscribeViewport();

        if (header && !shouldUseMobilePlacement) {
            header.insertAdjacentElement('afterend', card);
        } else {
            document.body.appendChild(card);
        }

        return card;
    };

    if (getSubscribedState()) {
        clearHiddenState();
        return;
    }

    const card = createCard();
    const closeButton = card.querySelector('.article-subscribe-close');
    const form = card.querySelector('.article-subscribe-form');

    if (!card || !closeButton || !form) {
        return;
    }

    const getHiddenState = () => {
        try {
            return window.sessionStorage.getItem(pageHiddenKey) === 'true';
        } catch (error) {
            return false;
        }
    };

    const setHiddenState = () => {
        try {
            window.sessionStorage.setItem(pageHiddenKey, 'true');
        } catch (error) {
            // If storage is blocked, still hide the box on the current page.
        }
    };

    if (getHiddenState()) {
        card.classList.add('is-hidden');
    } else {
        card.classList.remove('is-hidden');
        document.body.classList.add('has-article-subscribe');
    }

    closeButton.addEventListener('click', () => {
        setHiddenState();
        card.classList.add('is-hidden');
        document.body.classList.remove('has-article-subscribe');
    });

    form.addEventListener('submit', () => {
        saveNewsletterReturn();
        setSubscribedState();
    });

    document.addEventListener('click', (event) => {
        const subscribeLink = event.target.closest('a[href]');

        if (!subscribeLink) {
            return;
        }

        let subscribeUrl;

        try {
            subscribeUrl = new URL(subscribeLink.href, window.location.origin);
        } catch (error) {
            return;
        }

        if (subscribeUrl.origin === window.location.origin && subscribeUrl.pathname === '/subscribe.html') {
            saveNewsletterReturn();
        }
    });
})();
