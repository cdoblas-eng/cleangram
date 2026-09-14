(() => {
  const GRAPHQL = /(\/api\/graphql|\/graphql\/query)/;

  function bodyToString(body) {
    if (!body) return "";
    if (typeof body === "string") {
      try {
        return decodeURIComponent(body);
      } catch {
        return body;
      }
    }
    if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
      try {
        return decodeURIComponent(body.toString());
      } catch {
        return body.toString();
      }
    }
    return "";
  }

  function isPaginatedPath() {
    const path = location.pathname;
    return (
      path === "/" ||
      path.startsWith("/reels") ||
      path.startsWith("/reel/")
    );
  }

  function isFeedPagination(url, body) {
    if (!isPaginatedPath()) return false;
    if (!url || !GRAPHQL.test(url)) return false;

    const text = bodyToString(body);
    if (!text) return false;

    if (/comment/i.test(text) || /comment/i.test(url)) return false;

    return /"after"\s*:\s*"[^"]+"/.test(text);
  }

  const originalFetch = window.fetch;
  if (typeof originalFetch === "function") {
    window.fetch = function (input, init) {
      try {
        const url = typeof input === "string" ? input : input?.url;
        const body = init?.body;
        if (isFeedPagination(url, body)) {
          return new Promise(() => {});
        }
      } catch {
        /* ignore */
      }
      return originalFetch.apply(this, arguments);
    };
  }

  const XHR = window.XMLHttpRequest;
  if (XHR?.prototype) {
    const originalOpen = XHR.prototype.open;
    const originalSend = XHR.prototype.send;

    XHR.prototype.open = function (method, url) {
      this.__biUrl = url;
      return originalOpen.apply(this, arguments);
    };

    XHR.prototype.send = function (body) {
      if (isFeedPagination(this.__biUrl, body)) {
        return;
      }
      return originalSend.apply(this, arguments);
    };
  }
})();