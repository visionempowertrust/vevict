const updatesTimeline = document.querySelector(".updates-timeline");
const updatesSyncStatus = document.querySelector("#updates-sync-status");
const commitsEndpoint = "https://api.github.com/repos/visionempowertrust/vevict/commits?sha=main&per_page=100";

function escapeUpdateHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function existingCommitHashes() {
  return new Set([...updatesTimeline.querySelectorAll("code")].map((item) => item.textContent.trim().toLowerCase()));
}

function localDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function displayDate(dateKey) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  }).format(new Date(`${dateKey}T12:00:00+05:30`));
}

function commitSummary(commit) {
  return String(commit.commit?.message || "Portal update").split(/\r?\n/, 1)[0].trim();
}

function renderLiveUpdates(commits) {
  const knownHashes = existingCommitHashes();
  const unseen = commits.filter((commit) => {
    const shortHash = String(commit.sha || "").slice(0, 7).toLowerCase();
    return shortHash && !knownHashes.has(shortHash);
  });
  if (!unseen.length) {
    updatesSyncStatus.textContent = "The feature timeline is up to date with the main branch.";
    return;
  }

  const groups = new Map();
  unseen.forEach((commit) => {
    const dateKey = localDateKey(commit.commit?.committer?.date || commit.commit?.author?.date);
    if (!dateKey) return;
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey).push(commit);
  });

  const sections = [...groups.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([dateKey, items]) => {
    const rows = items.map((commit) => {
      const shortHash = String(commit.sha).slice(0, 7);
      const url = commit.html_url || `https://github.com/visionempowertrust/vevict/commit/${commit.sha}`;
      return `<li><a href="${escapeUpdateHtml(url)}" target="_blank" rel="noopener"><code>${escapeUpdateHtml(shortHash)}</code></a> ${escapeUpdateHtml(commitSummary(commit))}.</li>`;
    }).join("");
    return `<section class="update-release" data-live-update-date="${escapeUpdateHtml(dateKey)}"><h2><time datetime="${escapeUpdateHtml(dateKey)}">${escapeUpdateHtml(displayDate(dateKey))}</time></h2><ul>${rows}</ul></section>`;
  });

  if (!sections.length) return;
  updatesTimeline.insertAdjacentHTML("afterbegin", sections.join(""));
  const previousLatest = updatesTimeline.querySelector(".update-latest");
  previousLatest?.classList.remove("update-latest");
  previousLatest?.querySelector(".update-date span")?.remove();
  updatesTimeline.firstElementChild?.classList.add("update-latest");
  updatesSyncStatus.textContent = `${unseen.length} recent portal update${unseen.length === 1 ? "" : "s"} loaded from the main branch.`;
  window.applyStoredLanguage?.();
  window.reapplyTranslationAfterDynamicContent?.();
}

async function loadLatestPortalUpdates() {
  try {
    const response = await fetch(commitsEndpoint, { headers: { Accept: "application/vnd.github+json" } });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const commits = await response.json();
    if (!Array.isArray(commits)) throw new Error("Unexpected GitHub response");
    renderLiveUpdates(commits);
  } catch (error) {
    updatesSyncStatus.textContent = "Showing the saved feature timeline. Live updates could not be checked right now.";
    console.warn("Could not load the latest VICT portal commits", error);
  }
}

loadLatestPortalUpdates();
