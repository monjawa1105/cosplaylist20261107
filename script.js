
const DATA_PATH = "./data/";

const roleLabels = {
  cosplay: "コスプレ",
  camera: "カメラマン",
  assistant: "アシスタント"
};

const roleOrder = ["cosplay", "camera", "assistant"];

let participants = [];
let activeRole = "all";
let searchText = "";

const $ = (selector) => document.querySelector(selector);

// JSONを読み込む。キャッシュを使わず最新データを取得する
async function loadJson(fileName) {
  const url = `${DATA_PATH}${fileName}?v=${Date.now()}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`${fileName} の読み込みに失敗しました`);
  }

  return response.json();
}

function normalizeXId(value) {
  return String(value || "").trim().replace(/^@/, "");
}

function xProfileUrl(xId) {
  const id = normalizeXId(xId);
  return id ? `https://x.com/${encodeURIComponent(id)}` : "";
}

function avatarUrl(xId) {
  const id = normalizeXId(xId);
  return id
    ? `https://unavatar.io/x/${encodeURIComponent(id)}`
    : "";
}

// 制作者情報：X IDは1つだけ表示
function renderCreator(eventData) {
  $("#creator-name").textContent = eventData.createdBy || "〇〇";

  const links = $("#creator-links");
  links.replaceChildren();

  const id = normalizeXId(
    Array.isArray(eventData.creatorXIds)
      ? eventData.creatorXIds[0]
      : eventData.creatorXId
  );

  if (!id) return;

  const link = document.createElement("a");
  link.href = xProfileUrl(id);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = `𝕏 @${id}`;
  link.setAttribute("aria-label", "制作者のXプロフィールを開く");

  links.append(link);
}

function formatDate(dateString) {
  if (!dateString) return "開催日未設定";

  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return dateString;
  }

  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  return `${parts[0]}.${String(parts[1]).padStart(2, "0")}.${String(parts[2]).padStart(2, "0")}（${weekdays[date.getDay()]}）`;
}

function renderEvent(eventData) {
  document.title = `${eventData.eventName || "参加者一覧"} | 参加者一覧`;

  $("#event-title").textContent =
    eventData.title || "参加者一覧";

  $("#event-name").textContent =
    eventData.eventName || "併せ名未設定";

  $("#event-date").textContent =
    formatDate(eventData.date);
}

function renderSummary() {
  const counts = {
    cosplay: 0,
    camera: 0,
    assistant: 0
  };

  participants.forEach(person => {
    if (Object.hasOwn(counts, person.role)) {
      counts[person.role]++;
    }
  });

  const summary = $("#summary");
  summary.replaceChildren();

  [
    `参加者 ${participants.length}名`,
    `コスプレ ${counts.cosplay}名`,
    `カメラマン ${counts.camera}名`,
    `アシスタント ${counts.assistant}名`
  ].forEach(label => {
    const item = document.createElement("span");
    item.textContent = label;
    summary.append(item);
  });
}

function makeAvatar(person) {
  const id = normalizeXId(person.xId);

  if (!id) {
    return makeFallbackAvatar(person.name);
  }

  const image = document.createElement("img");
  image.className = "avatar";
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.src = avatarUrl(id);

  image.addEventListener("error", () => {
    image.replaceWith(makeFallbackAvatar(person.name));
  }, { once: true });

  return image;
}

function makeFallbackAvatar(name) {
  const fallback = document.createElement("span");
  fallback.className = "avatar avatar-fallback";
  fallback.setAttribute("aria-hidden", "true");
  fallback.textContent = (name || "?").trim().slice(0, 1) || "?";
  return fallback;
}

// 参加者カード
function makeParticipantCard(person) {
  const hasX = Boolean(normalizeXId(person.xId));

  // カード自体はリンクにせず、専用ボタンを設置
  const card = document.createElement("article");
  card.className = "participant-card";

  card.append(makeAvatar(person));

  const info = document.createElement("div");
  info.className = "participant-info";

  const name = document.createElement("span");
  name.className = "participant-name";
  name.textContent = person.name || "名前未設定";
  info.append(name);

  if (person.reading) {
    const reading = document.createElement("span");
    reading.className = "participant-reading";
    reading.textContent = person.reading;
    info.append(reading);
  }

  const meta = document.createElement("div");
  meta.className = "participant-meta";

  const role = document.createElement("span");
  role.className = `role-badge role-${person.role}`;
  role.textContent = roleLabels[person.role] || "役割未設定";
  meta.append(role);

  if (person.role === "cosplay" && person.character) {
    const character = document.createElement("span");
    character.className = "character-badge";
    character.textContent = person.character;
    meta.append(character);
  }

  info.append(meta);
  card.append(info);

  // Xプロフィールへ飛ぶ専用ボタン
  if (hasX) {
    const profileButton = document.createElement("a");
    profileButton.className = "profile-button";
    profileButton.href = xProfileUrl(person.xId);
    profileButton.target = "_blank";
    profileButton.rel = "noopener noreferrer";
    profileButton.textContent = "𝕏 プロフィールを見る";
    profileButton.setAttribute(
      "aria-label",
      `${person.name} のXプロフィールを開く`
    );

    card.append(profileButton);
  }

  return card;
}

function getFilteredParticipants() {
  const query = searchText.trim().toLocaleLowerCase("ja");

  return participants
    .filter(person => {
      const matchesRole =
        activeRole === "all" || person.role === activeRole;

      const searchable = [
        person.name,
        person.reading,
        person.character,
        person.xId
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ja");

      return matchesRole &&
        (!query || searchable.includes(query));
    })
    .sort((a, b) => {
      const roleDiff =
        roleOrder.indexOf(a.role) -
        roleOrder.indexOf(b.role);

      if (activeRole === "all" && roleDiff !== 0) {
        return roleDiff;
      }

      return (a.sortOrder ?? 9999) -
        (b.sortOrder ?? 9999);
    });
}

function renderParticipants() {
  const list = $("#participant-list");
  const filtered = getFilteredParticipants();

  list.replaceChildren();

  filtered.forEach(person => {
    list.append(makeParticipantCard(person));
  });

  $("#result-count").textContent =
    `${filtered.length} / ${participants.length}名`;

  $("#empty-state").hidden = filtered.length !== 0;
}

function setupFilters() {
  $("#role-filters").addEventListener("click", event => {
    const button = event.target.closest("button[data-role]");
    if (!button) return;

    activeRole = button.dataset.role;

    $("#role-filters")
      .querySelectorAll("button")
      .forEach(item => {
        const selected = item === button;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });

    renderParticipants();
  });

  $("#search-input").addEventListener("input", event => {
    searchText = event.target.value;
    $("#clear-search").hidden = !searchText;
    renderParticipants();
  });

  $("#clear-search").addEventListener("click", () => {
    $("#search-input").value = "";
    searchText = "";
    $("#clear-search").hidden = true;
    renderParticipants();
    $("#search-input").focus();
  });
}

async function init() {
  setupFilters();

  try {
    const [eventData, participantData] = await Promise.all([
      loadJson("event.json"),
      loadJson("participants.json")
    ]);

    participants = Array.isArray(participantData)
      ? participantData
      : [];

    renderCreator(eventData);
    renderEvent(eventData);
    renderSummary();
    renderParticipants();

  } catch (error) {
    console.error(error);

    $("#event-title").textContent =
      "データを読み込めませんでした";

    $("#event-name").textContent =
      "JSONファイルの場所や内容を確認してください。";

    $("#participant-list").replaceChildren();
    $("#empty-state").hidden = false;
    $("#empty-state").textContent =
      "Live Serverで開いているか、dataフォルダ内にJSONがあるか確認してください。";
  }
}

init();
