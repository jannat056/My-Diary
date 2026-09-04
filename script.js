const STORAGE_KEY = "myDiaryEntries";
const THEME_KEY = "myDiaryTheme";

const MOOD_LABELS = {
    happy: "Happy",
    calm: "Calm",
    excited: "Excited",
    loved: "Loved",
    sad: "Sad",
    angry: "Angry",
    tired: "Tired",
    confused: "Confused"
};

const MOOD_ICONS = {
    happy: "😊",
    calm: "😌",
    excited: "🤩",
    loved: "❤️",
    sad: "😔",
    angry: "😠",
    tired: "😴",
    confused: "😕"
};


/* =========================================================
   2. DOM ELEMENTS
   ========================================================= */

const elements = {
    // Navigation
    siteHeader: document.getElementById("site-header"),
    navLinks: document.getElementById("nav-links"),
    navLinkItems: document.querySelectorAll(".nav-link"),
    menuToggle: document.getElementById("menu-toggle"),

    // Theme
    themeToggle: document.getElementById("theme-toggle"),
    footerThemeToggle: document.getElementById("footer-theme-toggle"),

    // Hero / Stats
    totalEntries: document.getElementById("total-entries"),
    favoriteEntries: document.getElementById("favorite-entries"),
    happyEntries: document.getElementById("happy-entries"),
    currentYear: document.getElementById("current-year"),

    // Form
    diaryForm: document.getElementById("diary-form"),
    entryId: document.getElementById("entry-id"),
    entryTitle: document.getElementById("entry-title"),
    titleError: document.getElementById("title-error"),
    entryDate: document.getElementById("entry-date"),
    dateError: document.getElementById("date-error"),
    entryMood: document.getElementById("entry-mood"),
    entryContent: document.getElementById("entry-content"),
    characterCount: document.getElementById("character-count"),
    contentError: document.getElementById("content-error"),
    entryTags: document.getElementById("entry-tags"),
    entryFavorite: document.getElementById("entry-favorite"),
    clearForm: document.getElementById("clear-form"),
    saveEntry: document.getElementById("save-entry"),
    saveButtonText: document.getElementById("save-button-text"),

    // Entries
    entries: document.getElementById("entries"),
    searchEntry: document.getElementById("search-entry"),
    clearSearch: document.getElementById("clear-search"),
    moodFilter: document.getElementById("mood-filter"),
    sortEntries: document.getElementById("sort-entries"),
    resultsInfo: document.getElementById("results-info"),
    entriesContainer: document.getElementById("entries-container"),

    // Empty states
    emptyState: document.getElementById("empty-state"),
    noResults: document.getElementById("no-results"),
    resetFilters: document.getElementById("reset-filters"),

    // Footer
    footerYear: document.getElementById("footer-year"),

    // Toast
    toast: document.getElementById("toast"),
    toastIcon: document.getElementById("toast-icon"),
    toastMessage: document.getElementById("toast-message"),
    toastClose: document.getElementById("toast-close"),

    // Modal
    modalOverlay: document.getElementById("modal-overlay"),
    confirmationModal: document.getElementById("confirmation-modal"),
    modalClose: document.getElementById("modal-close"),
    modalTitle: document.getElementById("modal-title"),
    modalMessage: document.getElementById("modal-message"),
    modalCancel: document.getElementById("modal-cancel"),
    modalConfirm: document.getElementById("modal-confirm"),

    // Scroll
    scrollTop: document.getElementById("scroll-top")
};


/* =========================================================
   3. APPLICATION STATE
   ========================================================= */

let entries = [];
let entryToDelete = null;
let toastTimer = null;


/* =========================================================
   4. INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});

function initializeApp() {
    loadEntries();
    initializeDate();
    initializeTheme();
    initializeYear();
    updateCharacterCount();
    renderEntries();
    updateStats();
    setupEventListeners();
}


/* =========================================================
   5. EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

    // Diary form
    elements.diaryForm?.addEventListener("submit", handleFormSubmit);

    // Clear form
    elements.clearForm?.addEventListener("click", () => {
        resetForm();
    });

    // Character count
    elements.entryContent?.addEventListener("input", updateCharacterCount);

    // Search
    elements.searchEntry?.addEventListener("input", renderEntries);

    // Clear search
    elements.clearSearch?.addEventListener("click", () => {
        elements.searchEntry.value = "";
        renderEntries();
        elements.searchEntry.focus();
    });

    // Mood filter
    elements.moodFilter?.addEventListener("change", renderEntries);

    // Sort
    elements.sortEntries?.addEventListener("change", renderEntries);

    // Reset filters
    elements.resetFilters?.addEventListener("click", resetFilters);

    // Dynamic entry buttons
    elements.entriesContainer?.addEventListener("click", handleEntryActions);

    // Theme
    elements.themeToggle?.addEventListener("click", toggleTheme);
    elements.footerThemeToggle?.addEventListener("click", toggleTheme);

    // Mobile menu
    elements.menuToggle?.addEventListener("click", toggleMobileMenu);

    // Navigation links
    elements.navLinkItems.forEach((link) => {
        link.addEventListener("click", closeMobileMenu);
    });

    // Toast close
    elements.toastClose?.addEventListener("click", hideToast);

    // Modal controls
    elements.modalClose?.addEventListener("click", closeModal);
    elements.modalCancel?.addEventListener("click", closeModal);
    elements.modalConfirm?.addEventListener("click", confirmDelete);

    // Modal background
    elements.modalOverlay?.addEventListener("click", (event) => {
        if (event.target === elements.modalOverlay) {
            closeModal();
        }
    });

    // Scroll top
    elements.scrollTop?.addEventListener("click", scrollToTop);

    window.addEventListener("scroll", handleScroll);

    // Keyboard shortcuts
    document.addEventListener("keydown", handleKeyboardShortcuts);
}


/* =========================================================
   6. LOCAL STORAGE
   ========================================================= */

function loadEntries() {
    try {
        const savedEntries = localStorage.getItem(STORAGE_KEY);

        if (!savedEntries) {
            entries = [];
            return;
        }

        const parsedEntries = JSON.parse(savedEntries);

        entries = Array.isArray(parsedEntries)
            ? parsedEntries
            : [];

    } catch (error) {
        console.error("Could not load diary entries:", error);
        entries = [];

        showToast(
            "error",
            "Could not load your diary entries."
        );
    }
}

function saveEntries() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(entries)
        );

        return true;

    } catch (error) {
        console.error("Could not save diary entries:", error);

        showToast(
            "error",
            "Could not save your diary entry."
        );

        return false;
    }
}


/* =========================================================
   7. FORM SUBMISSION
   ========================================================= */

function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const title = elements.entryTitle.value.trim();
    const date = elements.entryDate.value;
    const mood = elements.entryMood.value;
    const content = elements.entryContent.value.trim();
    const tags = parseTags(elements.entryTags.value);
    const favorite = elements.entryFavorite.checked;

    const editingId = elements.entryId.value;

    if (editingId) {
        updateEntry(
            editingId,
            title,
            date,
            mood,
            content,
            tags,
            favorite
        );
    } else {
        createEntry(
            title,
            date,
            mood,
            content,
            tags,
            favorite
        );
    }
}


/* =========================================================
   8. CREATE ENTRY
   ========================================================= */

function createEntry(
    title,
    date,
    mood,
    content,
    tags,
    favorite
) {
    const now = new Date().toISOString();

    const newEntry = {
        id: generateId(),
        title,
        date,
        mood,
        content,
        tags,
        favorite,
        createdAt: now,
        updatedAt: now
    };

    entries.unshift(newEntry);

    if (!saveEntries()) {
        entries.shift();
        return;
    }

    renderEntries();
    updateStats();
    resetForm();

    showToast(
        "success",
        "Your diary entry has been saved."
    );

    scrollToEntries();
}


/* =========================================================
   9. UPDATE ENTRY
   ========================================================= */

function updateEntry(
    id,
    title,
    date,
    mood,
    content,
    tags,
    favorite
) {
    const index = entries.findIndex(
        (entry) => String(entry.id) === String(id)
    );

    if (index === -1) {
        showToast(
            "error",
            "Diary entry could not be found."
        );

        return;
    }

    const oldEntry = { ...entries[index] };

    entries[index] = {
        ...entries[index],
        title,
        date,
        mood,
        content,
        tags,
        favorite,
        updatedAt: new Date().toISOString()
    };

    if (!saveEntries()) {
        entries[index] = oldEntry;
        return;
    }

    renderEntries();
    updateStats();
    resetForm();

    showToast(
        "success",
        "Your diary entry has been updated."
    );

    scrollToEntries();
}


/* =========================================================
   10. VALIDATION
   ========================================================= */

function validateForm() {
    clearValidationErrors();

    let isValid = true;

    const title = elements.entryTitle.value.trim();
    const date = elements.entryDate.value;
    const content = elements.entryContent.value.trim();

    // Title
    if (!title) {
        showFieldError(
            elements.entryTitle,
            elements.titleError,
            "Please enter a title."
        );

        isValid = false;

    } else if (title.length < 2) {
        showFieldError(
            elements.entryTitle,
            elements.titleError,
            "Title must contain at least 2 characters."
        );

        isValid = false;
    }

    // Date
    if (!date) {
        showFieldError(
            elements.entryDate,
            elements.dateError,
            "Please select a date."
        );

        isValid = false;
    }

    // Content
    if (!content) {
        showFieldError(
            elements.entryContent,
            elements.contentError,
            "Please write something in your diary."
        );

        isValid = false;

    } else if (content.length < 3) {
        showFieldError(
            elements.entryContent,
            elements.contentError,
            "Your thoughts should contain at least 3 characters."
        );

        isValid = false;
    }

    return isValid;
}

function showFieldError(input, errorElement, message) {
    if (input) {
        input.classList.add("error");
        input.setAttribute("aria-invalid", "true");
    }

    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearValidationErrors() {
    const inputs = [
        elements.entryTitle,
        elements.entryDate,
        elements.entryContent
    ];

    inputs.forEach((input) => {
        input?.classList.remove("error");
        input?.setAttribute("aria-invalid", "false");
    });

    const errors = [
        elements.titleError,
        elements.dateError,
        elements.contentError
    ];

    errors.forEach((error) => {
        if (error) {
            error.textContent = "";
        }
    });
}


/* =========================================================
   11. RESET FORM
   ========================================================= */

function resetForm() {
    elements.diaryForm?.reset();

    elements.entryId.value = "";

    clearValidationErrors();

    elements.saveButtonText.textContent = "Save Entry";

    initializeDate();
    updateCharacterCount();
}

function initializeDate() {
    if (!elements.entryDate) {
        return;
    }

    if (!elements.entryDate.value) {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        elements.entryDate.value =
            `${year}-${month}-${day}`;
    }
}


/* =========================================================
   12. CHARACTER COUNT
   ========================================================= */

function updateCharacterCount() {
    if (!elements.entryContent || !elements.characterCount) {
        return;
    }

    const currentLength =
        elements.entryContent.value.length;

    elements.characterCount.textContent =
        currentLength.toLocaleString();
}


/* =========================================================
   13. RENDER ENTRIES
   ========================================================= */

function renderEntries() {
    if (!elements.entriesContainer) {
        return;
    }

    const filteredEntries = getFilteredEntries();

    elements.entriesContainer.replaceChildren();

    updateResultsInfo(filteredEntries.length);

    if (entries.length === 0) {
        showEmptyState();
        return;
    }

    if (filteredEntries.length === 0) {
        showNoResultsState();
        return;
    }

    hideEmptyStates();

    filteredEntries.forEach((entry) => {
        const card = createEntryCard(entry);
        elements.entriesContainer.appendChild(card);
    });
}


/* =========================================================
   14. CREATE ENTRY CARD
   ========================================================= */

function createEntryCard(entry) {

    const article = document.createElement("article");
    article.className = "entry-card";
    article.dataset.id = entry.id;

    // Header
    const header = document.createElement("div");
    header.className = "entry-card-header";

    const headerInfo = document.createElement("div");
    headerInfo.className = "entry-header-info";

    const title = document.createElement("h3");
    title.className = "entry-title";
    title.textContent = entry.title;

    const date = document.createElement("time");
    date.className = "entry-date";
    date.dateTime = entry.date;
    date.textContent = formatDate(entry.date);

    headerInfo.appendChild(title);
    headerInfo.appendChild(date);

    // Mood
    const mood = document.createElement("span");
    mood.className = `entry-mood mood-${entry.mood}`;

    mood.textContent =
        `${MOOD_ICONS[entry.mood] || "•"} ${
            MOOD_LABELS[entry.mood] || entry.mood
        }`;

    header.appendChild(headerInfo);
    header.appendChild(mood);

    // Content
    const content = document.createElement("p");
    content.className = "entry-content";
    content.textContent = entry.content;

    // Tags
    const tagsWrapper = document.createElement("div");
    tagsWrapper.className = "entry-tags";

    entry.tags.forEach((tag) => {
        const tagElement = document.createElement("span");
        tagElement.className = "entry-tag";
        tagElement.textContent = `#${tag}`;

        tagsWrapper.appendChild(tagElement);
    });

    // Actions
    const actions = document.createElement("div");
    actions.className = "entry-actions";

    // Favorite
    const favoriteButton = document.createElement("button");
    favoriteButton.type = "button";
    favoriteButton.className =
        `entry-action favorite-button ${
            entry.favorite ? "active" : ""
        }`;

    favoriteButton.dataset.action = "favorite";
    favoriteButton.setAttribute(
        "aria-label",
        entry.favorite
            ? "Remove from favorites"
            : "Add to favorites"
    );

    favoriteButton.textContent =
        entry.favorite ? "♥" : "♡";

    // Edit
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "entry-action";
    editButton.dataset.action = "edit";
    editButton.setAttribute(
        "aria-label",
        "Edit diary entry"
    );
    editButton.textContent = "Edit";

    // Delete
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className =
        "entry-action delete";
    deleteButton.dataset.action = "delete";
    deleteButton.setAttribute(
        "aria-label",
        "Delete diary entry"
    );
    deleteButton.textContent = "Delete";

    actions.appendChild(favoriteButton);
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    // Assemble card
    article.appendChild(header);
    article.appendChild(content);

    if (entry.tags.length > 0) {
        article.appendChild(tagsWrapper);
    }

    article.appendChild(actions);

    return article;
}


/* =========================================================
   15. ENTRY ACTIONS
   ========================================================= */

function handleEntryActions(event) {

    const button =
        event.target.closest("[data-action]");

    if (!button) {
        return;
    }

    const card =
        button.closest(".entry-card");

    if (!card) {
        return;
    }

    const id = card.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
        editEntry(id);
    }

    if (action === "delete") {
        openDeleteModal(id);
    }

    if (action === "favorite") {
        toggleFavorite(id);
    }
}


/* =========================================================
   16. EDIT ENTRY
   ========================================================= */

function editEntry(id) {

    const entry = entries.find(
        (item) => String(item.id) === String(id)
    );

    if (!entry) {
        showToast(
            "error",
            "Diary entry could not be found."
        );

        return;
    }

    elements.entryId.value = entry.id;
    elements.entryTitle.value = entry.title;
    elements.entryDate.value = entry.date;
    elements.entryMood.value = entry.mood;
    elements.entryContent.value = entry.content;
    elements.entryTags.value = entry.tags.join(", ");
    elements.entryFavorite.checked = Boolean(entry.favorite);

    elements.saveButtonText.textContent =
        "Update Entry";

    clearValidationErrors();
    updateCharacterCount();

    document.getElementById("write")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    elements.entryTitle.focus();

    showToast(
        "info",
        "You are editing this diary entry."
    );
}


/* =========================================================
   17. FAVORITE
   ========================================================= */

function toggleFavorite(id) {

    const entry = entries.find(
        (item) => String(item.id) === String(id)
    );

    if (!entry) {
        return;
    }

    entry.favorite = !entry.favorite;
    entry.updatedAt = new Date().toISOString();

    saveEntries();
    renderEntries();
    updateStats();

    showToast(
        "success",
        entry.favorite
            ? "Added to favorites."
            : "Removed from favorites."
    );
}


/* =========================================================
   18. DELETE MODAL
   ========================================================= */

function openDeleteModal(id) {

    const entry = entries.find(
        (item) => String(item.id) === String(id)
    );

    if (!entry) {
        return;
    }

    entryToDelete = id;

    elements.modalTitle.textContent =
        "Delete Diary Entry";

    elements.modalMessage.textContent =
        `Are you sure you want to delete "${entry.title}"? This action cannot be undone.`;

    elements.modalOverlay?.classList.add("active");

    document.body.classList.add("modal-open");

    elements.modalConfirm?.focus();
}

function closeModal() {

    elements.modalOverlay?.classList.remove("active");

    document.body.classList.remove("modal-open");

    entryToDelete = null;
}

function confirmDelete() {

    if (!entryToDelete) {
        closeModal();
        return;
    }

    const index = entries.findIndex(
        (entry) =>
            String(entry.id) === String(entryToDelete)
    );

    if (index === -1) {
        closeModal();
        return;
    }

    const deletedEntry = entries[index];

    entries.splice(index, 1);

    if (!saveEntries()) {
        entries.splice(index, 0, deletedEntry);
        closeModal();
        return;
    }

    renderEntries();
    updateStats();
    closeModal();

    showToast(
        "success",
        "Diary entry deleted successfully."
    );
}


/* =========================================================
   19. SEARCH / FILTER / SORT
   ========================================================= */

function getFilteredEntries() {

    const searchTerm =
        elements.searchEntry?.value
            .trim()
            .toLowerCase() || "";

    const selectedMood =
        elements.moodFilter?.value || "all";

    const selectedSort =
        elements.sortEntries?.value || "newest";

    let filtered = [...entries];

    // Search
    if (searchTerm) {
        filtered = filtered.filter((entry) => {

            const searchableText = [
                entry.title,
                entry.content,
                entry.mood,
                ...(entry.tags || [])
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(searchTerm);
        });
    }

    // Mood filter
    if (selectedMood !== "all") {
        filtered = filtered.filter(
            (entry) => entry.mood === selectedMood
        );
    }

    // Sort
    filtered.sort((a, b) => {

        switch (selectedSort) {

            case "oldest":
                return compareDates(a.date, b.date);

            case "title-asc":
                return a.title.localeCompare(
                    b.title,
                    undefined,
                    { sensitivity: "base" }
                );

            case "title-desc":
                return b.title.localeCompare(
                    a.title,
                    undefined,
                    { sensitivity: "base" }
                );

            case "newest":
            default:
                return compareDates(b.date, a.date);
        }
    });

    return filtered;
}

function compareDates(dateA, dateB) {
    return (
        new Date(dateA).getTime() -
        new Date(dateB).getTime()
    );
}


/* =========================================================
   20. RESULTS / EMPTY STATES
   ========================================================= */

function updateResultsInfo(count) {

    if (!elements.resultsInfo) {
        return;
    }

    if (entries.length === 0) {
        elements.resultsInfo.textContent =
            "No entries yet.";
        return;
    }

    const word =
        count === 1 ? "entry" : "entries";

    elements.resultsInfo.textContent =
        `Showing ${count} ${word}`;
}

function showEmptyState() {
    elements.emptyState?.classList.remove("hidden");
    elements.noResults?.classList.add("hidden");
}

function showNoResultsState() {
    elements.emptyState?.classList.add("hidden");
    elements.noResults?.classList.remove("hidden");
}

function hideEmptyStates() {
    elements.emptyState?.classList.add("hidden");
    elements.noResults?.classList.add("hidden");
}

function resetFilters() {

    if (elements.searchEntry) {
        elements.searchEntry.value = "";
    }

    if (elements.moodFilter) {
        elements.moodFilter.value = "all";
    }

    if (elements.sortEntries) {
        elements.sortEntries.value = "newest";
    }

    renderEntries();
}


/* =========================================================
   21. TAGS
   ========================================================= */

function parseTags(value) {

    if (!value) {
        return [];
    }

    const uniqueTags = new Set();

    value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .forEach((tag) => {

            const cleanTag = tag
                .replace(/^#+/, "")
                .replace(/\s+/g, " ");

            if (cleanTag) {
                uniqueTags.add(cleanTag);
            }
        });

    return [...uniqueTags].slice(0, 10);
}


/* =========================================================
   22. STATS
   ========================================================= */

function updateStats() {

    const total = entries.length;

    const favorites =
        entries.filter(
            (entry) => entry.favorite
        ).length;

    const happyDays =
        entries.filter(
            (entry) => entry.mood === "happy"
        ).length;

    if (elements.totalEntries) {
        elements.totalEntries.textContent =
            total.toLocaleString();
    }

    if (elements.favoriteEntries) {
        elements.favoriteEntries.textContent =
            favorites.toLocaleString();
    }

    if (elements.happyEntries) {
        elements.happyEntries.textContent =
            happyDays.toLocaleString();
    }
}


/* =========================================================
   23. DARK MODE
   ========================================================= */

function initializeTheme() {

    const savedTheme =
        localStorage.getItem(THEME_KEY);

    if (savedTheme === "dark") {
        document.body.classList.add("dark-theme");
    } else if (savedTheme === "light") {
        document.body.classList.remove("dark-theme");
    } else {
        const prefersDark =
            window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;

        if (prefersDark) {
            document.body.classList.add("dark-theme");
        }
    }

    updateThemeButtons();
}

function toggleTheme() {

    document.body.classList.toggle("dark-theme");

    const isDark =
        document.body.classList.contains("dark-theme");

    localStorage.setItem(
        THEME_KEY,
        isDark ? "dark" : "light"
    );

    updateThemeButtons();

    showToast(
        "info",
        isDark
            ? "Dark mode enabled."
            : "Light mode enabled."
    );
}

function updateThemeButtons() {

    const isDark =
        document.body.classList.contains("dark-theme");

    const buttons = [
        elements.themeToggle,
        elements.footerThemeToggle
    ];

    buttons.forEach((button) => {

        if (!button) {
            return;
        }

        const icon =
            button.querySelector(".theme-icon");

        if (icon) {
            icon.textContent =
                isDark ? "☀️" : "🌙";
        }

        button.setAttribute(
            "aria-label",
            isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
        );

        button.setAttribute(
            "title",
            isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
        );
    });
}


/* =========================================================
   24. MOBILE NAVIGATION
   ========================================================= */

function toggleMobileMenu() {

    if (!elements.navLinks || !elements.menuToggle) {
        return;
    }

    const isOpen =
        elements.navLinks.classList.toggle("active");

    elements.menuToggle.classList.toggle(
        "active",
        isOpen
    );

    elements.menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
    );
}

function closeMobileMenu() {

    elements.navLinks?.classList.remove("active");
    elements.menuToggle?.classList.remove("active");

    elements.menuToggle?.setAttribute(
        "aria-expanded",
        "false"
    );
}


/* =========================================================
   25. TOAST NOTIFICATION
   ========================================================= */

function showToast(type, message) {

    if (!elements.toast) {
        return;
    }

    clearTimeout(toastTimer);

    const icons = {
        success: "✓",
        error: "✕",
        info: "ⓘ",
        warning: "!"
    };

    elements.toastIcon.textContent =
        icons[type] || "ⓘ";

    elements.toastMessage.textContent =
        message;

    elements.toast.dataset.type = type;

    elements.toast.classList.add("show");

    toastTimer = setTimeout(() => {
        hideToast();
    }, 3500);
}

function hideToast() {

    elements.toast?.classList.remove("show");

    clearTimeout(toastTimer);
    toastTimer = null;
}


/* =========================================================
   26. SCROLL TO TOP
   ========================================================= */

function handleScroll() {

    if (!elements.scrollTop) {
        return;
    }

    if (window.scrollY > 500) {
        elements.scrollTop.classList.add("show");
    } else {
        elements.scrollTop.classList.remove("show");
    }
}

function scrollToTop() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function scrollToEntries() {

    elements.entries?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================================
   27. YEAR
   ========================================================= */

function initializeYear() {

    const year =
        new Date().getFullYear();

    if (elements.currentYear) {
        elements.currentYear.textContent =
            year;
    }

    if (elements.footerYear) {
        elements.footerYear.textContent =
            year;
    }
}


/* =========================================================
   28. DATE FORMAT
   ========================================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const date = new Date(
        `${dateString}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    ).format(date);
}


/* =========================================================
   29. UNIQUE ID
   ========================================================= */

function generateId() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}


/* =========================================================
   30. KEYBOARD SHORTCUTS
   ========================================================= */

function handleKeyboardShortcuts(event) {

    // Escape
    if (event.key === "Escape") {

        closeModal();
        closeMobileMenu();
        hideToast();

        return;
    }

    // Ctrl + K / Cmd + K -> Search
    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
    ) {

        event.preventDefault();

        elements.searchEntry?.focus();
    }

    // Ctrl + Enter -> Save
    if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "Enter"
    ) {

        if (
            document.activeElement ===
            elements.entryContent
        ) {
            elements.diaryForm?.requestSubmit();
        }
    }
}


/* =========================================================
   31. PREVENT DATA LOSS WHILE EDITING
   ========================================================= */

window.addEventListener("beforeunload", () => {

    const hasUnsavedContent =
        elements.entryTitle?.value.trim() ||
        elements.entryContent?.value.trim();

    const isEditing =
        Boolean(elements.entryId?.value);

    if (hasUnsavedContent && isEditing) {
        // Browser decides whether to show the warning.
        // No custom message is required in modern browsers.
        return;
    }
});


/* =========================================================
   32. GLOBAL ERROR HANDLING
   ========================================================= */

window.addEventListener("error", (event) => {

    console.error(
        "Application error:",
        event.error || event.message
    );
});