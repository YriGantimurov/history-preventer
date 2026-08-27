// edit_block_list.js
// History Blocker – manage site and keyword lists with privacy toggles

// ===== DOM references =====
const siteInput = document.getElementById("siteInput");
const addSiteBtn = document.getElementById("addSiteBtn");
const siteList = document.getElementById("siteList");
const emptySites = document.getElementById("emptySites");

const titleInput = document.getElementById("titleInput");
const addTitleBtn = document.getElementById("addTitleBtn");
const titleList = document.getElementById("titleList");
const emptyTitles = document.getElementById("emptyTitles");

// Visibility controls
document.querySelectorAll(".show-all").forEach((btn) => {
  btn.addEventListener("click", () =>
    setAllVisibility(btn.dataset.type, false),
  );
});
document.querySelectorAll(".hide-all").forEach((btn) => {
  btn.addEventListener("click", () => setAllVisibility(btn.dataset.type, true));
});

// Clear history button
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
clearHistoryBtn.addEventListener("click", handleClearHistory);

// ===== Custom notifications =====

/**
 * Shows a slide-in notification at the top of the popup.
 * @param {string} message - The message to display.
 * @param {string} type - 'info', 'error', or 'success'.
 * @param {number} duration - Auto-close timeout (ms), 0 to disable.
 */
function showNotification(message, type = "info", duration = 3000) {
  const container = document.getElementById("notification-container");
  const notif = document.createElement("div");
  notif.className = `notification ${type}`;
  notif.innerHTML = `
    <span>${message}</span>
    <button class="close-btn">✕</button>
  `;
  container.appendChild(notif);

  notif.querySelector(".close-btn").addEventListener("click", () => {
    removeNotification(notif);
  });

  if (duration > 0) {
    setTimeout(() => removeNotification(notif), duration);
  }
}

function removeNotification(notif) {
  if (notif && notif.parentNode) {
    notif.style.animation = "slideDown 0.2s reverse forwards";
    setTimeout(() => {
      if (notif.parentNode) notif.remove();
    }, 250);
  }
}

/**
 * Shows a confirmation modal with Yes/No buttons.
 * @param {string} message - The confirmation text.
 * @param {function} onConfirm - Callback with boolean result.
 */
function showConfirmation(message, onConfirm) {
  const overlay = document.getElementById("confirmation-overlay");
  const msgEl = document.getElementById("confirmation-message");
  const yesBtn = document.getElementById("confirmation-yes");
  const noBtn = document.getElementById("confirmation-no");

  msgEl.textContent = message;
  overlay.classList.remove("hidden");

  // Replace buttons to avoid event stacking
  const newYes = yesBtn.cloneNode(true);
  const newNo = noBtn.cloneNode(true);
  yesBtn.replaceWith(newYes);
  noBtn.replaceWith(newNo);

  newYes.addEventListener("click", () => {
    overlay.classList.add("hidden");
    if (typeof onConfirm === "function") onConfirm(true);
  });

  newNo.addEventListener("click", () => {
    overlay.classList.add("hidden");
    if (typeof onConfirm === "function") onConfirm(false);
  });
}

// ===== Data management =====

async function loadAllLists() {
  try {
    const result = await browser.storage.local.get([
      "blockedSites",
      "blockedTitles",
    ]);
    const sites = result.blockedSites || [];
    const titles = result.blockedTitles || [];
    renderList(siteList, emptySites, sites, "site");
    renderList(titleList, emptyTitles, titles, "title");
  } catch (error) {
    console.error("Failed to load lists:", error);
    showNotification("Failed to load lists", "error");
  }
}

function renderList(container, emptyMsg, items, type) {
  container.innerHTML = "";

  if (items.length === 0) {
    emptyMsg.classList.remove("hidden");
    return;
  }
  emptyMsg.classList.add("hidden");

  items.forEach((item) => {
    const li = document.createElement("li");

    const textSpan = document.createElement("span");
    if (item.hidden) {
      textSpan.textContent = "••••••";
      textSpan.className = "item-text masked";
    } else {
      textSpan.textContent = item.value;
      textSpan.className = "item-text";
    }

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = item.hidden ? "👁️" : "🙈";
    toggleBtn.className = "visibility-toggle";
    toggleBtn.setAttribute("aria-label", item.hidden ? "Show" : "Hide");
    toggleBtn.addEventListener("click", () =>
      toggleVisibility(type, item.value),
    );

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✕";
    deleteBtn.className = "delete-btn";
    deleteBtn.setAttribute("aria-label", `Delete ${item.value}`);
    deleteBtn.addEventListener("click", () => removeItem(type, item.value));

    li.appendChild(textSpan);
    li.appendChild(toggleBtn);
    li.appendChild(deleteBtn);
    container.appendChild(li);
  });
}

// ===== Visibility toggles =====

async function toggleVisibility(type, value) {
  try {
    const key = type === "site" ? "blockedSites" : "blockedTitles";
    const result = await browser.storage.local.get(key);
    let items = result[key] || [];

    const index = items.findIndex(
      (item) => item.value.toLowerCase() === value.toLowerCase(),
    );
    if (index === -1) return;

    items[index].hidden = !items[index].hidden;
    await browser.storage.local.set({ [key]: items });
    await loadAllLists();
  } catch (error) {
    console.error("Toggle visibility failed:", error);
    showNotification("Failed to toggle visibility", "error");
  }
}

async function setAllVisibility(type, hidden) {
  try {
    const key = type === "site" ? "blockedSites" : "blockedTitles";
    const result = await browser.storage.local.get(key);
    let items = result[key] || [];
    items = items.map((item) => ({ ...item, hidden }));
    await browser.storage.local.set({ [key]: items });
    await loadAllLists();
  } catch (error) {
    console.error("Failed to set all visibility:", error);
    showNotification("Failed to update visibility", "error");
  }
}

// ===== Add / remove items =====

async function addItem(type, rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) return;

  let normalized;
  if (type === "site") {
    try {
      const urlObj = new URL(trimmed);
      normalized = urlObj.hostname;
    } catch (e) {
      normalized = trimmed;
    }
    normalized = normalized.toLowerCase();
  } else {
    normalized = trimmed.trim();
  }

  if (!normalized) return;

  try {
    const key = type === "site" ? "blockedSites" : "blockedTitles";
    const result = await browser.storage.local.get(key);
    let items = result[key] || [];

    const isDuplicate = items.some(
      (item) => item.value.toLowerCase() === normalized.toLowerCase(),
    );
    if (isDuplicate) {
      showNotification(`"${normalized}" already exists`, "info");
      if (type === "site") siteInput.value = "";
      else titleInput.value = "";
      return;
    }

    items.push({ value: normalized, hidden: true });
    await browser.storage.local.set({ [key]: items });

    if (type === "site") siteInput.value = "";
    else titleInput.value = "";

    await loadAllLists();
    showNotification(`"${normalized}" added`, "success");
  } catch (error) {
    console.error(`Add ${type} failed:`, error);
    showNotification(`Failed to add "${normalized}"`, "error");
  }
}

async function removeItem(type, value) {
  try {
    const key = type === "site" ? "blockedSites" : "blockedTitles";
    const result = await browser.storage.local.get(key);
    let items = result[key] || [];
    items = items.filter(
      (item) => item.value.toLowerCase() !== value.toLowerCase(),
    );
    await browser.storage.local.set({ [key]: items });
    await loadAllLists();
    showNotification(`"${value}" removed`, "success");
  } catch (error) {
    console.error(`Remove ${type} failed:`, error);
    showNotification(`Failed to remove "${value}"`, "error");
  }
}

// ===== Clear history handler =====

async function handleClearHistory() {
  try {
    const result = await browser.storage.local.get([
      "blockedSites",
      "blockedTitles",
    ]);
    const sites = result.blockedSites || [];
    const titles = result.blockedTitles || [];
    if (sites.length === 0 && titles.length === 0) {
      showNotification(
        "Block list is empty. Add sites or keywords first.",
        "info",
      );
      return;
    }

    const siteValues = sites.map((s) => s.value).join(", ") || "none";
    const titleValues = titles.map((t) => t.value).join(", ") || "none";
    const message =
      `Are you sure you want to delete all history entries matching:\n` +
      `- Sites (${sites.length}): ${siteValues}\n` +
      `- Keywords (${titles.length}): ${titleValues}`;

    showConfirmation(message, async (confirmed) => {
      if (!confirmed) return;
      try {
        await browser.runtime.sendMessage({ action: "clearHistoryForBlocked" });
        showNotification(
          "History clearing started. Check console for details.",
          "success",
        );
      } catch (error) {
        console.error("Clear history message error:", error);
        showNotification("Failed to start clearing.", "error");
      }
    });
  } catch (error) {
    console.error("Clear history error:", error);
    showNotification("An error occurred", "error");
  }
}

// ===== Event listeners =====

addSiteBtn.addEventListener("click", () => addItem("site", siteInput.value));
siteInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addItem("site", siteInput.value);
  }
});

addTitleBtn.addEventListener("click", () => addItem("title", titleInput.value));
titleInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addItem("title", titleInput.value);
  }
});

document.addEventListener("DOMContentLoaded", loadAllLists);
