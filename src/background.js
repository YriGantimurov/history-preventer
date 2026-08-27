importScripts("../polyfill/browser-polyfill.min.js");
// background.js
// History Blocker – background script

// ===== Data store =====
let blockedSiteObjects = [];
let blockedTitleObjects = [];
let blockedSiteValues = [];
let blockedTitleValues = [];

// ===== Load lists from storage =====
async function loadBlockedLists() {
  try {
    const result = await browser.storage.local.get([
      "blockedSites",
      "blockedTitles",
    ]);
    blockedSiteObjects = result.blockedSites || [];
    blockedTitleObjects = result.blockedTitles || [];
    blockedSiteValues = blockedSiteObjects.map((item) => item.value);
    blockedTitleValues = blockedTitleObjects.map((item) => item.value);
    console.log("Sites (objects):", blockedSiteObjects);
    console.log("Titles (objects):", blockedTitleObjects);
  } catch (error) {
    console.error("Failed to load lists:", error);
    blockedSiteObjects = [];
    blockedTitleObjects = [];
    blockedSiteValues = [];
    blockedTitleValues = [];
  }
}

// ===== URL check =====
function isUrlBlocked(url) {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("about:") || url.startsWith("moz-extension://"))
    return false;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return blockedSiteValues.some((site) => {
      const siteLower = site.toLowerCase().trim();
      if (!siteLower) return false;
      if (hostname === siteLower) return true;
      if (hostname.includes(siteLower)) return true;
      if (url.toLowerCase().includes(siteLower)) return true;
      return false;
    });
  } catch (e) {
    return false;
  }
}

// ===== Title check =====
function isTitleBlocked(title) {
  if (!title || typeof title !== "string") return false;
  const lowerTitle = title.toLowerCase();
  return blockedTitleValues.some((keyword) => {
    const kw = keyword.toLowerCase().trim();
    return kw && lowerTitle.includes(kw);
  });
}

// ===== Delete single history entry =====
async function deleteFromHistory(url) {
  try {
    await browser.history.deleteUrl({ url });
    console.log(`✅ Deleted from history: ${url}`);
  } catch (error) {
    console.warn(`⚠️ Could not delete ${url}:`, error.message);
  }
}

// ===== Navigation listener (main) =====
browser.webNavigation.onDOMContentLoaded.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const url = details.url;
  const tabId = details.tabId;

  if (isUrlBlocked(url)) {
    setTimeout(() => deleteFromHistory(url), 100);
    return;
  }

  try {
    const tab = await browser.tabs.get(tabId);
    const title = tab.title;
    if (title && isTitleBlocked(title)) {
      console.log(`🔍 Title "${title}" contains keyword – deleting ${url}`);
      setTimeout(() => deleteFromHistory(url), 100);
    }
  } catch (error) {
    console.warn("⚠️ Could not get tab title:", error.message);
  }
});

// ===== SPA navigation listener =====
browser.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  if (details.frameId !== 0 || !details.transitionType) return;

  const url = details.url;
  const tabId = details.tabId;

  if (isUrlBlocked(url)) {
    setTimeout(() => deleteFromHistory(url), 100);
    return;
  }

  try {
    const tab = await browser.tabs.get(tabId);
    const title = tab.title;
    if (title && isTitleBlocked(title)) {
      console.log(
        `🔍 SPA: Title "${title}" contains keyword – deleting ${url}`,
      );
      setTimeout(() => deleteFromHistory(url), 100);
    }
  } catch (error) {
    // ignore
  }
});

// ===== Storage change listener =====
browser.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    if (changes.blockedSites) {
      blockedSiteObjects = changes.blockedSites.newValue || [];
      blockedSiteValues = blockedSiteObjects.map((item) => item.value);
      console.log("Sites updated (objects):", blockedSiteObjects);
    }
    if (changes.blockedTitles) {
      blockedTitleObjects = changes.blockedTitles.newValue || [];
      blockedTitleValues = blockedTitleObjects.map((item) => item.value);
      console.log("Titles updated (objects):", blockedTitleObjects);
    }
  }
});

// ===== Message handler =====
browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === "clearHistoryForBlocked") {
    await clearHistoryForBlocked();
    return { success: true };
  }
});

// ===== Bulk history clearing =====
async function clearHistoryForBlocked() {
  try {
    const result = await browser.storage.local.get([
      "blockedSites",
      "blockedTitles",
    ]);
    const sites = result.blockedSites || [];
    const titles = result.blockedTitles || [];
    const siteValues = sites.map((item) => item.value);
    const titleValues = titles.map((item) => item.value);

    if (siteValues.length === 0 && titleValues.length === 0) {
      console.log("No blocked items, nothing to clear.");
      return;
    }

    console.log(
      `Bulk clearing: ${siteValues.length} sites, ${titleValues.length} keywords...`,
    );

    const historyItems = await browser.history.search({
      text: "",
      startTime: 0,
      maxResults: 10000,
    });

    console.log(`Found ${historyItems.length} history entries.`);

    const isUrlMatch = (url) => {
      if (!url) return false;
      if (url.startsWith("about:") || url.startsWith("moz-extension://"))
        return false;
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        return siteValues.some((site) => {
          const siteLower = site.toLowerCase().trim();
          if (!siteLower) return false;
          if (hostname === siteLower) return true;
          if (hostname.includes(siteLower)) return true;
          if (url.toLowerCase().includes(siteLower)) return true;
          return false;
        });
      } catch (e) {
        return false;
      }
    };

    const isTitleMatch = (title) => {
      if (!title) return false;
      const lowerTitle = title.toLowerCase();
      return titleValues.some((keyword) => {
        const kw = keyword.toLowerCase().trim();
        return kw && lowerTitle.includes(kw);
      });
    };

    const urlsToDelete = historyItems
      .filter((item) => {
        if (isUrlMatch(item.url)) return true;
        if (item.title && isTitleMatch(item.title)) return true;
        return false;
      })
      .map((item) => item.url);

    console.log(`Found ${urlsToDelete.length} URLs to delete.`);

    for (const url of urlsToDelete) {
      await deleteFromHistory(url);
    }

    console.log("Bulk clearing completed.");
  } catch (error) {
    console.error("Bulk clearing error:", error);
  }
}

// ===== Initialization =====
loadBlockedLists();
