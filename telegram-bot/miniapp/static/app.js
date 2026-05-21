(function () {
  "use strict";

  const ROOM_TYPES = {
    kitchen: "Кухня",
    bathroom: "Санузел",
    bedroom: "Спальня",
    living_room: "Гостиная",
    hallway: "Коридор",
    other: "Другое"
  };

  const EDITOR_STEPS = ["base", "geometry", "finishes", "points"];

  const ROOM_PRESETS = {
    kitchen: {
      label: "Кухня",
      room_type: "kitchen",
      walls_plaster: true,
      walls_putty: true,
      walls_paint: true,
      walls_tiles: true,
      floor_screed: true,
      floor_tiles: true,
      floor_laminate: false,
      electrical_points: 10,
      plumbing_points: 4
    },
    bathroom: {
      label: "Санузел",
      room_type: "bathroom",
      walls_plaster: true,
      walls_putty: true,
      walls_paint: false,
      walls_tiles: true,
      floor_screed: true,
      floor_tiles: true,
      floor_laminate: false,
      electrical_points: 6,
      plumbing_points: 6
    },
    bedroom: {
      label: "Спальня",
      room_type: "bedroom",
      walls_plaster: true,
      walls_putty: true,
      walls_paint: true,
      walls_tiles: false,
      floor_screed: true,
      floor_tiles: false,
      floor_laminate: true,
      electrical_points: 8,
      plumbing_points: 0
    },
    living_room: {
      label: "Гостиная",
      room_type: "living_room",
      walls_plaster: true,
      walls_putty: true,
      walls_paint: true,
      walls_tiles: false,
      floor_screed: true,
      floor_tiles: false,
      floor_laminate: true,
      electrical_points: 12,
      plumbing_points: 0
    }
  };

  function defaultRoom() {
    return {
      name: "",
      area_m2: 0,
      ceiling_height_m: null,
      perimeter_m: null,
      length_m: null,
      width_m: null,
      room_type: "other",
      walls_plaster: true,
      walls_putty: true,
      walls_paint: true,
      walls_tiles: false,
      floor_screed: true,
      floor_tiles: false,
      floor_laminate: false,
      electrical_points: 0,
      plumbing_points: 0
    };
  }

  function defaultPayload() {
    return {
      version: 1,
      status: "in_progress",
      step: "ready_next_action",
      city: "Москва",
      ceiling_height_m: 2.7,
      rooms: [],
      draft_room: {},
      edit_room_index: null,
      edit_room_field: ""
    };
  }

  const FAVORITE_TIER_KEY = "umniy_remont_favorite_tier";
  const LEGACY_FAVORITE_TIER_KEY = "umid_favorite_tier";
  const LOCAL_DRAFT_KEY = "umniy_remont_local_draft";
  const LEGACY_LOCAL_DRAFT_KEY = "umid_local_draft";

  function getStoredFavoriteTier() {
    try {
      const raw = window.localStorage.getItem(FAVORITE_TIER_KEY) || window.localStorage.getItem(LEGACY_FAVORITE_TIER_KEY) || "standard";
      return ["econom", "standard", "premium"].includes(raw) ? raw : "standard";
    } catch (error) {
      return "standard";
    }
  }

  function saveFavoriteTier(tier) {
    try {
      window.localStorage.setItem(FAVORITE_TIER_KEY, tier);
    } catch (error) {
      return;
    }
  }

  function loadLocalDraft() {
    try {
      const raw = window.localStorage.getItem(LOCAL_DRAFT_KEY) || window.localStorage.getItem(LEGACY_LOCAL_DRAFT_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function saveLocalDraft(payload) {
    try {
      window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(payload));
    } catch (error) {
      return;
    }
  }

  function clearLocalDraft() {
    try {
      window.localStorage.removeItem(LOCAL_DRAFT_KEY);
      window.localStorage.removeItem(LEGACY_LOCAL_DRAFT_KEY);
    } catch (error) {
      return;
    }
  }

  const state = {
    initData: "",
    payload: defaultPayload(),
    editIndex: null,
    geometryMode: "auto",
    editorStep: "base",
    busy: false,
    favoriteTier: getStoredFavoriteTier(),
    tg: null,
    tgUser: null,
    serverUserId: null,
    lastSavedAt: null,
    lastSummary: null,
    lastReportText: "",
    autosaveTimer: null,
    authMode: "telegram"
  };

  const els = {
    openInTelegramHint: document.getElementById("openInTelegramHint"),
    statusLine: document.getElementById("statusLine"),
    cityInput: document.getElementById("cityInput"),
    ceilingInput: document.getElementById("ceilingInput"),
    addRoomBtn: document.getElementById("addRoomBtn"),
    roomsList: document.getElementById("roomsList"),
    editorCard: document.getElementById("editorCard"),
    editorTitle: document.getElementById("editorTitle"),
    closeEditorBtn: document.getElementById("closeEditorBtn"),
    prevEditorStepBtn: document.getElementById("prevEditorStepBtn"),
    nextEditorStepBtn: document.getElementById("nextEditorStepBtn"),
    roomName: document.getElementById("roomName"),
    roomType: document.getElementById("roomType"),
    roomArea: document.getElementById("roomArea"),
    roomHeight: document.getElementById("roomHeight"),
    roomPerimeter: document.getElementById("roomPerimeter"),
    roomLength: document.getElementById("roomLength"),
    roomWidth: document.getElementById("roomWidth"),
    wallsPlaster: document.getElementById("wallsPlaster"),
    wallsPutty: document.getElementById("wallsPutty"),
    wallsPaint: document.getElementById("wallsPaint"),
    wallsTiles: document.getElementById("wallsTiles"),
    floorScreed: document.getElementById("floorScreed"),
    floorTiles: document.getElementById("floorTiles"),
    floorLaminate: document.getElementById("floorLaminate"),
    electricalPoints: document.getElementById("electricalPoints"),
    plumbingPoints: document.getElementById("plumbingPoints"),
    saveRoomBtn: document.getElementById("saveRoomBtn"),
    saveSessionBtn: document.getElementById("saveSessionBtn"),
    calculateBtn: document.getElementById("calculateBtn"),
    resetSessionBtn: document.getElementById("resetSessionBtn"),
    copyReportBtn: document.getElementById("copyReportBtn"),
    downloadJsonBtn: document.getElementById("downloadJsonBtn"),
    sendLeadBtn: document.getElementById("sendLeadBtn"),
    resultCard: document.getElementById("resultCard"),
    laborCards: document.getElementById("laborCards"),
    scenarioCards: document.getElementById("scenarioCards"),
    materialsList: document.getElementById("materialsList"),
    assumptionsList: document.getElementById("assumptionsList"),
    cabinetAvatarImage: document.getElementById("cabinetAvatarImage"),
    cabinetAvatarText: document.getElementById("cabinetAvatarText"),
    profileName: document.getElementById("profileName"),
    profileHandle: document.getElementById("profileHandle"),
    profileId: document.getElementById("profileId"),
    profileRooms: document.getElementById("profileRooms"),
    profileLastSaved: document.getElementById("profileLastSaved"),
    profileStatus: document.getElementById("profileStatus"),
    profileProgressText: document.getElementById("profileProgressText"),
    profileProgressBar: document.getElementById("profileProgressBar"),
    
    // Элементы кастомных оверлеев и тостов
    toastContainer: document.getElementById("toastContainer"),
    customConfirmModal: document.getElementById("customConfirmModal"),
    confirmTitle: document.getElementById("confirmTitle"),
    confirmMessage: document.getElementById("confirmMessage"),
    confirmCancelBtn: document.getElementById("confirmCancelBtn"),
    confirmOkBtn: document.getElementById("confirmOkBtn"),
    spinnerOverlay: document.getElementById("spinnerOverlay"),
    spinnerMessage: document.getElementById("spinnerMessage")
  };

  const geometryChipButtons = Array.from(document.querySelectorAll("#geometryMode .chip"));
  const geometryInputGroups = Array.from(document.querySelectorAll("#geometryInputs [data-for]"));
  const presetButtons = Array.from(document.querySelectorAll("#roomPresetChips .chip"));
  const favoriteTierButtons = Array.from(document.querySelectorAll("#favoriteTierChips .chip"));
  const editorTabButtons = Array.from(document.querySelectorAll("#editorStepTabs .editor-tab"));
  const editorPanes = Array.from(document.querySelectorAll("[data-editor-pane]"));

  function setStatus(text, kind) {
    els.statusLine.textContent = text;
    els.statusLine.style.color = kind === "error" ? "#e15241" : "var(--accent)";
  }

  function showTelegramHint(flag) {
    if (flag) {
      els.openInTelegramHint.classList.remove("hidden");
      return;
    }
    els.openInTelegramHint.classList.add("hidden");
  }

  // Кастомная роскошная система всплывающих подсказок (тосты)
  function showToast(message, type = "success") {
    if (!els.toastContainer) return;
    
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let svgIcon = "";
    if (type === "success") {
      svgIcon = `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor" style="color:var(--accent);"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`;
    } else if (type === "error") {
      svgIcon = `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor" style="color:var(--danger);"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`;
    } else {
      svgIcon = `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor" style="color:var(--warning);"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`;
    }
    
    toast.innerHTML = `
      ${svgIcon}
      <span>${message}</span>
    `;
    
    els.toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add("show");
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3200);
  }

  // Кастомная роскошная система подтверждения (Confirm Modal)
  let confirmResolver = null;
  function showConfirm(message) {
    return new Promise((resolve) => {
      if (!els.customConfirmModal) {
        resolve(window.confirm(message));
        return;
      }
      
      els.confirmMessage.textContent = message;
      els.customConfirmModal.classList.remove("hidden");
      
      setTimeout(() => {
        els.customConfirmModal.classList.add("active");
      }, 10);
      
      confirmResolver = resolve;
    });
  }

  function closeConfirmModal(result) {
    if (!els.customConfirmModal) return;
    
    els.customConfirmModal.classList.remove("active");
    setTimeout(() => {
      els.customConfirmModal.classList.add("hidden");
      if (confirmResolver) {
        confirmResolver(result);
        confirmResolver = null;
      }
    }, 250);
  }

  // Привязка событий кнопок кастомного подтверждения
  if (els.confirmOkBtn && els.confirmCancelBtn) {
    els.confirmOkBtn.addEventListener("click", () => closeConfirmModal(true));
    els.confirmCancelBtn.addEventListener("click", () => closeConfirmModal(false));
  }

  // Кастомные спиннеры загрузки (Spinner Overlay)
  function showSpinner(message = "Формируем архитектурную смету...") {
    if (!els.spinnerOverlay) return;
    if (els.spinnerMessage) {
      els.spinnerMessage.textContent = message;
    }
    els.spinnerOverlay.classList.remove("hidden");
    setTimeout(() => {
      els.spinnerOverlay.classList.add("active");
    }, 10);
  }

  function hideSpinner() {
    if (!els.spinnerOverlay) return;
    els.spinnerOverlay.classList.remove("active");
    setTimeout(() => {
      els.spinnerOverlay.classList.add("hidden");
    }, 300);
  }

  function notify(text) {
    showToast(text, "success");
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const normalized = String(value).replace(",", ".").trim();
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function toPositive(value) {
    const parsed = toNumber(value);
    if (parsed === null || parsed <= 0) {
      return null;
    }
    return parsed;
  }

  function toNonNegativeInt(value) {
    const parsed = toNumber(value);
    if (parsed === null || parsed < 0) {
      return 0;
    }
    return Math.floor(parsed);
  }

  function formatMoney(value) {
    return `${Math.round(Number(value || 0)).toLocaleString("ru-RU")} ₽`;
  }

  function formatDateTime(isoText) {
    if (!isoText) {
      return "-";
    }
    const parsed = new Date(isoText);
    if (Number.isNaN(parsed.getTime())) {
      return "-";
    }
    return parsed.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function initialsFromUser(user) {
    if (!user) {
      return "UM";
    }
    const first = (user.first_name || "").slice(0, 1);
    const last = (user.last_name || "").slice(0, 1);
    return `${first}${last}`.toUpperCase() || "UM";
  }

  function updateFavoriteTierUI() {
    favoriteTierButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.tier === state.favoriteTier);
    });
  }

  function setGeometryMode(mode) {
    state.geometryMode = mode;
    geometryChipButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === mode);
    });

    geometryInputGroups.forEach((group) => {
      const groupMode = group.dataset.for;
      const show = (mode === "perimeter" && groupMode === "perimeter") || (mode === "dimensions" && groupMode === "dimensions");
      group.classList.toggle("hidden", !show);
    });
  }

  function setEditorStep(step) {
    if (!EDITOR_STEPS.includes(step)) {
      return;
    }
    state.editorStep = step;

    editorTabButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.editorStep === step);
    });
    editorPanes.forEach((pane) => {
      const isCurrent = pane.dataset.editorPane === step;
      pane.classList.toggle("hidden", !isCurrent);
      if (isCurrent) {
        pane.classList.remove("fade-in");
        void pane.offsetWidth; // триггер reflow
        pane.classList.add("fade-in");
      }
    });

    const idx = EDITOR_STEPS.indexOf(step);
    els.prevEditorStepBtn.classList.toggle("hidden", idx <= 0);
    els.nextEditorStepBtn.classList.toggle("hidden", idx >= EDITOR_STEPS.length - 1);
    els.saveRoomBtn.textContent = idx === EDITOR_STEPS.length - 1 ? "Сохранить комнату" : "Сохранить и продолжить";
  }

  function applyRoomPreset(presetKey) {
    const preset = ROOM_PRESETS[presetKey];
    if (!preset) {
      return;
    }

    els.roomType.value = preset.room_type;
    els.wallsPlaster.checked = !!preset.walls_plaster;
    els.wallsPutty.checked = !!preset.walls_putty;
    els.wallsPaint.checked = !!preset.walls_paint;
    els.wallsTiles.checked = !!preset.walls_tiles;
    els.floorScreed.checked = !!preset.floor_screed;
    els.floorTiles.checked = !!preset.floor_tiles;
    els.floorLaminate.checked = !!preset.floor_laminate;
    els.electricalPoints.value = preset.electrical_points;
    els.plumbingPoints.value = preset.plumbing_points;
    if (!els.roomName.value.trim()) {
      els.roomName.value = preset.label;
    }

    presetButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.preset === presetKey);
    });
  }

  function calculateProgress() {
    let progress = 0;
    if ((state.payload.city || "").trim()) {
      progress += 20;
    }
    if (toPositive(state.payload.ceiling_height_m) !== null) {
      progress += 15;
    }

    const rooms = Array.isArray(state.payload.rooms) ? state.payload.rooms : [];
    if (rooms.length > 0) {
      progress += 25;
    }

    const completeRooms = rooms.filter((room) => {
      return toPositive(room.area_m2) !== null && (room.name || "").trim().length > 0;
    });
    if (rooms.length > 0 && completeRooms.length === rooms.length) {
      progress += 20;
    }

    const hasMeasuredGeometry = rooms.some((room) => toPositive(room.perimeter_m) !== null || (toPositive(room.length_m) !== null && toPositive(room.width_m) !== null));
    if (hasMeasuredGeometry) {
      progress += 10;
    }

    if (state.payload.status === "finished") {
      progress += 10;
    }
    return Math.min(100, progress);
  }

  function updateCabinet() {
    const user = state.tgUser;
    const fullName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Пользователь" : "Личный кабинет";
    const username = user && user.username ? `@${user.username}` : "без username";

    const avatarUrl = user && typeof user.photo_url === "string" ? user.photo_url.trim() : "";
    if (avatarUrl) {
      els.cabinetAvatarImage.src = avatarUrl;
      els.cabinetAvatarImage.classList.remove("hidden");
      els.cabinetAvatarText.classList.add("hidden");
    } else {
      els.cabinetAvatarImage.classList.add("hidden");
      els.cabinetAvatarText.classList.remove("hidden");
      els.cabinetAvatarText.textContent = initialsFromUser(user);
    }

    els.profileName.textContent = fullName;
    els.profileHandle.textContent = state.authMode === "telegram" ? username : "Откройте Mini App через Telegram";

    const profileId = state.serverUserId || (user ? user.id : null);
    els.profileId.textContent = profileId ? String(profileId) : "-";
    els.profileRooms.textContent = String(Array.isArray(state.payload.rooms) ? state.payload.rooms.length : 0);
    els.profileLastSaved.textContent = formatDateTime(state.lastSavedAt);
    els.profileStatus.textContent = state.authMode === "local" ? "Локальный режим" : state.payload.status === "finished" ? "Смета рассчитана" : "Черновик";

    const progress = calculateProgress();
    els.profileProgressText.textContent = `${progress}%`;
    els.profileProgressBar.style.width = `${progress}%`;
    updateFavoriteTierUI();
  }

  function roomGeometryLabel(room) {
    if (toPositive(room.perimeter_m) !== null) {
      return `Периметр: ${Number(room.perimeter_m).toFixed(1)} м`;
    }
    if (toPositive(room.length_m) !== null && toPositive(room.width_m) !== null) {
      return `Размеры: ${Number(room.length_m).toFixed(1)} × ${Number(room.width_m).toFixed(1)} м`;
    }
    return "Периметр: по допущению квадратной комнаты";
  }

  function buildEditorRoom() {
    const room = defaultRoom();
    room.name = (els.roomName.value || "").trim();
    room.room_type = els.roomType.value;

    const area = toPositive(els.roomArea.value);
    if (area === null) {
      throw new Error("Введите площадь комнаты больше 0.");
    }
    room.area_m2 = area;

    room.ceiling_height_m = toPositive(els.roomHeight.value);

    if (state.geometryMode === "perimeter") {
      const perimeter = toPositive(els.roomPerimeter.value);
      if (perimeter === null) {
        throw new Error("Введите периметр комнаты больше 0.");
      }
      room.perimeter_m = perimeter;
    } else if (state.geometryMode === "dimensions") {
      const length = toPositive(els.roomLength.value);
      const width = toPositive(els.roomWidth.value);
      if (length === null || width === null) {
        throw new Error("Введите длину и ширину комнаты больше 0.");
      }
      room.length_m = length;
      room.width_m = width;
    }

    room.walls_plaster = els.wallsPlaster.checked;
    room.walls_putty = els.wallsPutty.checked;
    room.walls_paint = els.wallsPaint.checked;
    room.walls_tiles = els.wallsTiles.checked;
    room.floor_screed = els.floorScreed.checked;
    room.floor_tiles = els.floorTiles.checked;
    room.floor_laminate = els.floorLaminate.checked;
    room.electrical_points = toNonNegativeInt(els.electricalPoints.value);
    room.plumbing_points = toNonNegativeInt(els.plumbingPoints.value);

    if (!room.name) {
      room.name = `Комната ${state.editIndex !== null ? state.editIndex + 1 : (state.payload.rooms.length + 1)}`;
    }

    if ((room.room_type === "kitchen" || room.room_type === "bathroom") && room.plumbing_points === 0) {
      throw new Error("Для кухни/санузла укажите сантехточки (больше 0).");
    }

    return room;
  }

  function fillEditor(room, index) {
    const safeRoom = room || defaultRoom();
    state.editIndex = typeof index === "number" ? index : null;

    els.editorTitle.textContent = state.editIndex === null ? "Новая комната" : `Редактирование: ${safeRoom.name || "Комната"}`;
    els.roomName.value = safeRoom.name || "";
    els.roomType.value = safeRoom.room_type || "other";
    els.roomArea.value = safeRoom.area_m2 || "";
    els.roomHeight.value = safeRoom.ceiling_height_m || "";
    els.roomPerimeter.value = safeRoom.perimeter_m || "";
    els.roomLength.value = safeRoom.length_m || "";
    els.roomWidth.value = safeRoom.width_m || "";

    els.wallsPlaster.checked = !!safeRoom.walls_plaster;
    els.wallsPutty.checked = !!safeRoom.walls_putty;
    els.wallsPaint.checked = !!safeRoom.walls_paint;
    els.wallsTiles.checked = !!safeRoom.walls_tiles;
    els.floorScreed.checked = !!safeRoom.floor_screed;
    els.floorTiles.checked = !!safeRoom.floor_tiles;
    els.floorLaminate.checked = !!safeRoom.floor_laminate;
    els.electricalPoints.value = Number.isFinite(safeRoom.electrical_points) ? safeRoom.electrical_points : 0;
    els.plumbingPoints.value = Number.isFinite(safeRoom.plumbing_points) ? safeRoom.plumbing_points : 0;

    presetButtons.forEach((button) => button.classList.remove("active"));

    if (toPositive(safeRoom.perimeter_m) !== null) {
      setGeometryMode("perimeter");
    } else if (toPositive(safeRoom.length_m) !== null && toPositive(safeRoom.width_m) !== null) {
      setGeometryMode("dimensions");
    } else {
      setGeometryMode("auto");
    }

    setEditorStep("base");
    els.editorCard.classList.remove("hidden");
    els.editorCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeEditor() {
    state.editIndex = null;
    els.editorCard.classList.add("hidden");
  }

  function renderRooms() {
    const rooms = Array.isArray(state.payload.rooms) ? state.payload.rooms : [];
    if (!rooms.length) {
      els.roomsList.innerHTML = '<div class="empty">Комнат пока нет. Нажмите «+ Добавить».</div>';
      updateCabinet();
      return;
    }

    els.roomsList.innerHTML = "";
    rooms.forEach((room, index) => {
      const item = document.createElement("article");
      item.className = "room-item";

      const title = document.createElement("p");
      title.className = "room-title";
      title.textContent = `${index + 1}. ${room.name || "Комната"}`;

      const meta = document.createElement("div");
      meta.className = "room-meta";
      meta.innerHTML = [
        `${ROOM_TYPES[room.room_type] || ROOM_TYPES.other}, ${Number(room.area_m2 || 0).toFixed(1)} м²`,
        roomGeometryLabel(room),
        `Электроточки: ${room.electrical_points || 0}, сантехточки: ${room.plumbing_points || 0}`
      ].join("<br>");

      const actions = document.createElement("div");
      actions.className = "room-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "btn subtle";
      editBtn.type = "button";
      editBtn.textContent = "Редактировать";
      editBtn.addEventListener("click", () => fillEditor(room, index));

      const duplicateBtn = document.createElement("button");
      duplicateBtn.className = "btn subtle";
      duplicateBtn.type = "button";
      duplicateBtn.textContent = "Дублировать";
      duplicateBtn.addEventListener("click", async () => {
        const cloned = JSON.parse(JSON.stringify(room));
        cloned.name = `${room.name || "Комната"} (копия)`;
        state.payload.rooms.push(cloned);
        renderRooms();
        await saveSession(true);
      });

      const removeBtn = document.createElement("button");
      removeBtn.className = "btn subtle";
      removeBtn.type = "button";
      removeBtn.textContent = "Удалить";
      removeBtn.addEventListener("click", async () => {
        state.payload.rooms.splice(index, 1);
        renderRooms();
        await saveSession(true);
      });

      actions.append(editBtn, duplicateBtn, removeBtn);
      item.append(title, meta, actions);
      els.roomsList.appendChild(item);
    });

    updateCabinet();
  }

  function readGlobalFields() {
    state.payload.city = (els.cityInput.value || "").trim() || "Москва";
    const ceiling = toPositive(els.ceilingInput.value);
    state.payload.ceiling_height_m = ceiling === null ? 2.7 : ceiling;
  }

  function writeGlobalFields() {
    els.cityInput.value = state.payload.city || "Москва";
    els.ceilingInput.value = state.payload.ceiling_height_m || 2.7;
  }

  async function apiPost(url, data) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    let body = {};
    try {
      body = await response.json();
    } catch (error) {
      body = {};
    }

    if (!response.ok || body.ok === false) {
      const message = body.error || `HTTP ${response.status}`;
      throw new Error(message);
    }
    return body;
  }

  function syncMeta(meta) {
    if (!meta || typeof meta !== "object") {
      return;
    }
    if (meta.user_id) {
      state.serverUserId = meta.user_id;
    }
    if (meta.updated_at) {
      state.lastSavedAt = meta.updated_at;
    }
  }

  async function loadSession() {
    if (state.authMode === "local") {
      const localDraft = loadLocalDraft();
      state.payload = localDraft || defaultPayload();
      state.lastSavedAt = null;
      writeGlobalFields();
      renderRooms();
      updateCabinet();
      setStatus("Локальный режим. Откройте Mini App через кнопку бота.", "error");
      return;
    }

    try {
      const data = await apiPost("/miniapp/api/session/load", { initData: state.initData });
      state.payload = data.payload || defaultPayload();
      syncMeta(data.meta);
      writeGlobalFields();
      renderRooms();
      updateCabinet();
      setStatus("Сессия загружена.", "ok");
    } catch (error) {
      state.authMode = "local";
      showTelegramHint(true);
      const localDraft = loadLocalDraft();
      state.payload = localDraft || defaultPayload();
      writeGlobalFields();
      renderRooms();
      updateCabinet();
      setStatus("Нужен запуск из Telegram. Сейчас включен локальный черновик.", "error");
    }
  }

  async function saveSession(silent) {
    if (state.busy) {
      return;
    }

    readGlobalFields();

    if (state.authMode === "local") {
      saveLocalDraft(state.payload);
      state.lastSavedAt = new Date().toISOString();
      updateCabinet();
      if (!silent) {
        showToast("Локальный черновик успешно сохранен.", "success");
      }
      setStatus("Локальный черновик сохранен.", "ok");
      return;
    }

    try {
      state.busy = true;
      if (!silent) {
        showSpinner("Сохраняем сессию на сервере...");
      }
      const data = await apiPost("/miniapp/api/session/save", {
        initData: state.initData,
        payload: state.payload
      });
      state.payload = data.payload || state.payload;
      syncMeta(data.meta);
      updateCabinet();
      if (!silent) {
        showToast("Черновик сметы сохранен.", "success");
      }
      setStatus("Изменения сохранены.", "ok");
    } catch (error) {
      setStatus(`Ошибка сохранения: ${error.message}`, "error");
      if (!silent) {
        showToast(`Ошибка сохранения: ${error.message}`, "error");
      }
    } finally {
      state.busy = false;
      if (!silent) {
        hideSpinner();
      }
    }
  }

  async function resetSession() {
    if (state.busy) {
      return;
    }

    const confirmed = await showConfirm("Сбросить всю сессию и удалить комнаты?");
    if (!confirmed) {
      return;
    }

    if (state.authMode === "local") {
      clearLocalDraft();
      state.payload = defaultPayload();
      state.lastSummary = null;
      state.lastReportText = "";
      state.lastSavedAt = null;
      els.resultCard.classList.add("hidden");
      writeGlobalFields();
      renderRooms();
      updateCabinet();
      setStatus("Локальный черновик сброшен.", "ok");
      showToast("Локальный черновик успешно сброшен.", "success");
      return;
    }

    try {
      state.busy = true;
      showSpinner("Сбрасываем сессию...");
      const data = await apiPost("/miniapp/api/session/reset", { initData: state.initData });
      state.payload = data.payload || defaultPayload();
      syncMeta(data.meta);
      state.lastSummary = null;
      state.lastReportText = "";
      els.resultCard.classList.add("hidden");
      writeGlobalFields();
      renderRooms();
      updateCabinet();
      setStatus("Сессия сброшена.", "ok");
      showToast("Сессия сброшена.", "success");
    } catch (error) {
      showToast(`Ошибка сброса: ${error.message}`, "error");
    } finally {
      state.busy = false;
      hideSpinner();
    }
  }

  function renderLaborCards(labor) {
    const tiers = [
      { key: "econom", label: "Econom" },
      { key: "standard", label: "Standard" },
      { key: "premium", label: "Premium" }
    ];
    els.laborCards.innerHTML = "";
    tiers.forEach((tier) => {
      const card = document.createElement("article");
      card.className = "labor-card";
      card.innerHTML = `<p class="tier">${tier.label}</p><p class="price">${formatMoney(labor[tier.key] || 0)}</p>`;
      els.laborCards.appendChild(card);
    });
  }

  function renderScenarioCards(scenarios) {
    const items = [
      { key: "standard_base", label: "Standard (база)" },
      { key: "standard_plus_10", label: "Standard +10%" },
      { key: "standard_plus_15", label: "Standard +15%" },
      { key: "premium_delta", label: "Дельта Premium" }
    ];
    els.scenarioCards.innerHTML = "";
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "labor-card";
      card.innerHTML = `<p class="tier">${item.label}</p><p class="price">${formatMoney((scenarios || {})[item.key] || 0)}</p>`;
      els.scenarioCards.appendChild(card);
    });
  }

  function renderMaterials(materials) {
    els.materialsList.innerHTML = "";
    (materials || []).forEach((item) => {
      const line = document.createElement("div");
      line.className = "material-item";
      line.textContent = `${item.label}: ${Number(item.quantity).toFixed(2)} ${item.unit} (≈ ${item.packages} ${item.package_unit})`;
      els.materialsList.appendChild(line);
    });
    if (!materials || materials.length === 0) {
      els.materialsList.innerHTML = '<div class="empty">Материалы не рассчитаны.</div>';
    }
  }

  function renderAssumptions(summary) {
    const list = []
      .concat(summary.assumptions || [])
      .concat(summary.room_assumptions || []);
    els.assumptionsList.innerHTML = "";
    list.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      els.assumptionsList.appendChild(li);
    });
    if (list.length === 0) {
      els.assumptionsList.innerHTML = "<li>Допущения не сформированы.</li>";
    }
  }

  function buildReportText(summary) {
    const labor = summary.labor_totals || {};
    const scenarios = summary.budget_scenarios || {};
    const materials = summary.materials || [];
    const assumptions = []
      .concat(summary.assumptions || [])
      .concat(summary.room_assumptions || []);

    const lines = [
      "Предварительная смета — Умный Ремонт",
      `Город: ${summary.city || "Москва"}`,
      `Комнат: ${summary.rooms_count || 0}`,
      "",
      "Работы:",
      `- Econom: ${formatMoney(labor.econom)}`,
      `- Standard: ${formatMoney(labor.standard)}`,
      `- Premium: ${formatMoney(labor.premium)}`,
      "",
      "Сценарии бюджета:",
      `- Standard база: ${formatMoney(scenarios.standard_base)}`,
      `- Standard +10%: ${formatMoney(scenarios.standard_plus_10)}`,
      `- Standard +15%: ${formatMoney(scenarios.standard_plus_15)}`,
      `- Дельта Premium: ${formatMoney(scenarios.premium_delta)}`,
      "",
      "Материалы:"
    ];

    materials.forEach((item) => {
      lines.push(`- ${item.label}: ${Number(item.quantity).toFixed(2)} ${item.unit} (~${item.packages} ${item.package_unit})`);
    });

    if (assumptions.length > 0) {
      lines.push("", "Допущения:");
      assumptions.forEach((item) => lines.push(`- ${item}`));
    }

    return lines.join("\n");
  }

  function renderSummary(summary) {
    els.resultCard.classList.remove("hidden");
    renderLaborCards(summary.labor_totals || {});
    renderScenarioCards(summary.budget_scenarios || {});
    renderMaterials(summary.materials || []);
    renderAssumptions(summary);
  }

  async function copyReport() {
    const reportText = state.lastReportText || (state.lastSummary ? buildReportText(state.lastSummary) : "");
    if (!reportText) {
      showToast("Сначала выполните расчет сметы.", "warning");
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reportText);
      } else {
        const area = document.createElement("textarea");
        area.value = reportText;
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      showToast("Отчет скопирован в буфер обмена.", "success");
    } catch (error) {
      showToast("Не удалось скопировать отчет.", "error");
    }
  }

  function downloadSummaryJson() {
    if (!state.lastSummary) {
      showToast("Сначала выполните расчет сметы.", "warning");
      return;
    }

    const payload = {
      generated_at: new Date().toISOString(),
      favorite_tier: state.favoriteTier,
      session: state.payload,
      summary: state.lastSummary,
      report_text: state.lastReportText || buildReportText(state.lastSummary)
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "umniy-remont-estimate-summary.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Файл JSON успешно скачан.", "success");
  }

  async function calculate() {
    if (state.busy) {
      return;
    }

    if (state.authMode === "local") {
      showToast("Для расчета откройте Mini App через кнопку в Telegram.", "warning");
      return;
    }

    readGlobalFields();

    try {
      state.busy = true;
      showSpinner("Формируем предварительный расчёт...");
      const data = await apiPost("/miniapp/api/calculate", {
        initData: state.initData,
        payload: state.payload
      });
      state.payload = data.payload || state.payload;
      syncMeta(data.meta);
      state.lastSummary = data.summary || null;
      state.lastReportText = data.report_text || (state.lastSummary ? buildReportText(state.lastSummary) : "");
      if (state.lastSummary) {
        renderSummary(state.lastSummary);
      }
      state.payload.status = "finished";
      updateCabinet();
      setStatus("Смета рассчитана.", "ok");
      showToast("Предварительный расчёт готов!", "success");
    } catch (error) {
      setStatus(`Ошибка расчета: ${error.message}`, "error");
      showToast(`Ошибка расчета: ${error.message}`, "error");
    } finally {
      state.busy = false;
      hideSpinner();
    }
  }

  function sendLeadToBot() {
    const url = "https://t.me/umniyremontbot?start=measure_miniapp_result";
    if (state.tg && typeof state.tg.openTelegramLink === "function") {
      state.tg.openTelegramLink(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function scheduleAutosave() {
    if (state.autosaveTimer) {
      window.clearTimeout(state.autosaveTimer);
    }
    state.autosaveTimer = window.setTimeout(async () => {
      await saveSession(true);
      state.autosaveTimer = null;
    }, 700);
  }

  function bindEvents() {
    geometryChipButtons.forEach((button) => {
      button.addEventListener("click", () => setGeometryMode(button.dataset.mode || "auto"));
    });

    presetButtons.forEach((button) => {
      button.addEventListener("click", () => applyRoomPreset(button.dataset.preset || ""));
    });

    favoriteTierButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tier = button.dataset.tier || "standard";
        state.favoriteTier = tier;
        saveFavoriteTier(tier);
        updateFavoriteTierUI();
      });
    });

    editorTabButtons.forEach((button) => {
      button.addEventListener("click", () => setEditorStep(button.dataset.editorStep || "base"));
    });

    els.prevEditorStepBtn.addEventListener("click", () => {
      const idx = EDITOR_STEPS.indexOf(state.editorStep);
      if (idx > 0) {
        setEditorStep(EDITOR_STEPS[idx - 1]);
      }
    });

    els.nextEditorStepBtn.addEventListener("click", () => {
      const idx = EDITOR_STEPS.indexOf(state.editorStep);
      if (idx < EDITOR_STEPS.length - 1) {
        setEditorStep(EDITOR_STEPS[idx + 1]);
      }
    });

    els.addRoomBtn.addEventListener("click", () => fillEditor(defaultRoom(), null));
    els.closeEditorBtn.addEventListener("click", closeEditor);

    els.saveRoomBtn.addEventListener("click", async () => {
      try {
        const room = buildEditorRoom();
        if (state.editIndex === null) {
          state.payload.rooms.push(room);
          showToast(`Комната "${room.name}" успешно добавлена.`, "success");
        } else {
          state.payload.rooms[state.editIndex] = room;
          showToast(`Комната "${room.name}" успешно обновлена.`, "success");
        }
        state.payload.status = "in_progress";
        renderRooms();

        const currentIndex = EDITOR_STEPS.indexOf(state.editorStep);
        if (currentIndex < EDITOR_STEPS.length - 1) {
          setEditorStep(EDITOR_STEPS[currentIndex + 1]);
        } else {
          closeEditor();
        }

        await saveSession(true);
      } catch (error) {
        showToast(error.message || "Проверьте заполнение комнаты", "error");
      }
    });

    els.saveSessionBtn.addEventListener("click", async () => {
      await saveSession(false);
    });

    els.calculateBtn.addEventListener("click", async () => {
      await calculate();
    });

    els.resetSessionBtn.addEventListener("click", async () => {
      await resetSession();
    });

    els.copyReportBtn.addEventListener("click", async () => {
      await copyReport();
    });

    els.downloadJsonBtn.addEventListener("click", () => {
      downloadSummaryJson();
    });

    if (els.sendLeadBtn) {
      els.sendLeadBtn.addEventListener("click", sendLeadToBot);
    }

    [els.cityInput, els.ceilingInput].forEach((input) => {
      input.addEventListener("input", () => {
        readGlobalFields();
        updateCabinet();
        scheduleAutosave();
      });
    });
  }

  async function initTelegram() {
    const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
    if (!tg) {
      state.authMode = "local";
      showTelegramHint(true);
      return;
    }

    state.tg = tg;
    tg.ready();
    tg.expand();

    state.initData = tg.initData || "";
    state.tgUser = tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null;

    if (!state.initData) {
      state.authMode = "local";
      showTelegramHint(true);
      return;
    }

    state.authMode = "telegram";
    showTelegramHint(false);
  }

  async function bootstrap() {
    bindEvents();
    setGeometryMode("auto");
    setEditorStep("base");
    updateCabinet();
    await initTelegram();
    await loadSession();
  }

  bootstrap();
})();
