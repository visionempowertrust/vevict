const VICT_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "mr", label: "Marathi" },
  { code: "kn", label: "Kannada" },
  { code: "gu", label: "Gujarathi" },
  { code: "te", label: "Telugu" },
  { code: "ml", label: "Malayalam" },
  { code: "or", label: "Odiya" },
  { code: "bn", label: "Bengali" },
  { code: "as", label: "Assamese" }
];

const VICT_LANGUAGE_KEY = "vict-site-language";

window.googleTranslateElementInit = function googleTranslateElementInit() {
  if (!window.google?.translate?.TranslateElement) return;
  new google.translate.TranslateElement({
    pageLanguage: "en",
    includedLanguages: VICT_LANGUAGES.map((language) => language.code).filter((code) => code !== "en").join(","),
    autoDisplay: false
  }, "google_translate_element");
  applyStoredLanguage();
};

function selectedLanguage() {
  return localStorage.getItem(VICT_LANGUAGE_KEY) || "en";
}

function setTranslateCookie(languageCode) {
  const value = languageCode === "en" ? "" : `/en/${languageCode}`;
  const expiry = languageCode === "en" ? "Thu, 01 Jan 1970 00:00:00 GMT" : "Fri, 31 Dec 9999 23:59:59 GMT";
  document.cookie = `googtrans=${value};expires=${expiry};path=/`;
  document.cookie = `googtrans=${value};expires=${expiry};path=/;domain=${location.hostname}`;
}

function loadGoogleTranslate() {
  if (document.querySelector("[data-google-translate-script]")) return;
  const script = document.createElement("script");
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  script.dataset.googleTranslateScript = "true";
  document.body.appendChild(script);
}

function applyStoredLanguage() {
  const languageCode = selectedLanguage();
  if (languageCode === "en") return;
  const combo = document.querySelector(".goog-te-combo");
  if (!combo) {
    window.setTimeout(applyStoredLanguage, 250);
    return;
  }
  combo.value = languageCode;
  combo.dispatchEvent(new Event("change"));
}

function reapplyTranslationAfterDynamicContent() {
  [500, 1500, 3500, 7000].forEach((delay) => window.setTimeout(applyStoredLanguage, delay));
}

function changeLanguage(languageCode) {
  localStorage.setItem(VICT_LANGUAGE_KEY, languageCode);
  setTranslateCookie(languageCode);
  if (languageCode === "en") {
    location.reload();
    return;
  }
  loadGoogleTranslate();
  applyStoredLanguage();
  reapplyTranslationAfterDynamicContent();
}

function renderLanguageSelector() {
  if (document.querySelector(".language-switcher")) return;
  const wrapper = document.createElement("div");
  wrapper.className = "language-switcher notranslate";
  wrapper.setAttribute("translate", "no");
  wrapper.innerHTML = `
    <label for="site-language">Language</label>
    <select id="site-language" aria-label="Select site language">
      ${VICT_LANGUAGES.map((language) => `<option value="${language.code}">${language.label}</option>`).join("")}
    </select>
    <div id="google_translate_element" aria-hidden="true"></div>
  `;
  const headerActions = document.querySelector(".header-actions");
  if (headerActions) headerActions.prepend(wrapper);
  else document.body.prepend(wrapper);
  const select = document.querySelector("#site-language");
  select.value = selectedLanguage();
  select.addEventListener("change", () => changeLanguage(select.value));
  if (select.value !== "en") {
    loadGoogleTranslate();
    reapplyTranslationAfterDynamicContent();
  }
}

document.addEventListener("DOMContentLoaded", renderLanguageSelector);
