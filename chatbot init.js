(function loadChatbot() {
  const script = document.createElement("script");
  script.src = "js/chatbot-widget.js";
  script.dataset.apiBase = GLAMTOPIA_CONFIG.API_BASE;
  script.dataset.providerId = window.GLAMTOPIA_PROVIDER_ID || "";
  document.body.appendChild(script);
})();
 