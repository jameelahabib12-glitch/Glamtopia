/**
 * Glamtopia Chatbot Widget
 * ------------------------
 * Drop this into any page with:
 *
 *   <script
 *     src="js/chatbot-widget.js"
 *     data-api-base="http://localhost:5000/api"
 *     data-provider-id=""
 *   ></script>
 *
 * data-api-base    required. Base URL of the backend API.
 * data-provider-id optional. Set this on a provider's own profile page so
 *                   the widget also pulls that provider's own FAQs
 *                   (Eeman's content) alongside the general platform FAQs
 *                   (Alishba's content). Leave it off on general pages.
 *
 * This is the reference pattern mentioned in the WBS — everyone else wires
 * their own FAQ content into the same `faqs` table (via provider_id), not
 * into a separate widget.
 */
(function () {
  const scriptTag = document.currentScript;
  const API_BASE = scriptTag.dataset.apiBase || "http://localhost:5000/api";
  const PROVIDER_ID = scriptTag.dataset.providerId || "";

  const style = document.createElement("style");
  style.textContent = `
    #gt-chatbot-toggle {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%; border: none;
      background: #6B4FA0; color: #fff; font-size: 24px; cursor: pointer;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    }
    #gt-chatbot-panel {
      position: fixed; bottom: 92px; right: 24px; z-index: 9999;
      width: 320px; max-height: 440px; background: #fff;
      border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.2);
      display: none; flex-direction: column; overflow: hidden;
      font-family: system-ui, sans-serif;
    }
    #gt-chatbot-panel.open { display: flex; }
    #gt-chatbot-header {
      background: #6B4FA0; color: #fff; padding: 14px 16px;
      font-weight: 600; font-size: 14px;
    }
    #gt-chatbot-messages {
      flex: 1; overflow-y: auto; padding: 12px; font-size: 13px;
      display: flex; flex-direction: column; gap: 8px; background: #F9FAFB;
    }
    .gt-msg { padding: 8px 12px; border-radius: 10px; max-width: 85%; line-height: 1.4; }
    .gt-msg.bot { background: #EFEAFB; align-self: flex-start; }
    .gt-msg.user { background: #6B4FA0; color: #fff; align-self: flex-end; }
    .gt-faq-chip {
      text-align: left; background: #fff; border: 1px solid #E5E7EB;
      border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer;
      margin-top: 4px;
    }
    .gt-faq-chip:hover { background: #F3F0F9; }
    #gt-chatbot-input-row { display: flex; border-top: 1px solid #E5E7EB; }
    #gt-chatbot-input {
      flex: 1; border: none; padding: 10px 12px; font-size: 13px; outline: none;
    }
    #gt-chatbot-send {
      border: none; background: #6B4FA0; color: #fff; padding: 0 16px; cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  const toggle = document.createElement("button");
  toggle.id = "gt-chatbot-toggle";
  toggle.setAttribute("aria-label", "Open help chat");
  toggle.textContent = "💬";
  document.body.appendChild(toggle);

  const panel = document.createElement("div");
  panel.id = "gt-chatbot-panel";
  panel.innerHTML = `
    <div id="gt-chatbot-header">Glamtopia Help</div>
    <div id="gt-chatbot-messages"></div>
    <div id="gt-chatbot-input-row">
      <input id="gt-chatbot-input" type="text" placeholder="Ask a question..." />
      <button id="gt-chatbot-send">Send</button>
    </div>
  `;
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector("#gt-chatbot-messages");
  const inputEl = panel.querySelector("#gt-chatbot-input");
  const sendBtn = panel.querySelector("#gt-chatbot-send");

  function addMessage(text, sender) {
    const div = document.createElement("div");
    div.className = "gt-msg " + sender;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function addFaqChips(faqs) {
    const wrap = document.createElement("div");
    faqs.slice(0, 5).forEach((faq) => {
      const chip = document.createElement("button");
      chip.className = "gt-faq-chip";
      chip.textContent = faq.question;
      chip.addEventListener("click", () => {
        addMessage(faq.question, "user");
        addMessage(faq.answer, "bot");
      });
      wrap.appendChild(chip);
    });
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  let opened = false;
  let loadedInitial = false;

  toggle.addEventListener("click", async () => {
    opened = !opened;
    panel.classList.toggle("open", opened);
    if (opened && !loadedInitial) {
      loadedInitial = true;
      addMessage("Hi! Ask me anything, or pick a common question below.", "bot");
      try {
        const url = new URL(API_BASE.replace(/\/$/, "") + "/faqs");
        if (PROVIDER_ID) url.searchParams.set("providerId", PROVIDER_ID);
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json();
        if (data.faqs && data.faqs.length) addFaqChips(data.faqs);
      } catch (err) {
        console.error("Chatbot: failed to load FAQs", err);
      }
    }
  });

  async function sendQuestion() {
    const question = inputEl.value.trim();
    if (!question) return;
    addMessage(question, "user");
    inputEl.value = "";

    try {
      const res = await fetch(API_BASE.replace(/\/$/, "") + "/faqs/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question, providerId: PROVIDER_ID || undefined }),
      });
      const data = await res.json();
      addMessage(data.answer, "bot");
    } catch (err) {
      console.error("Chatbot: ask failed", err);
      addMessage("Something went wrong reaching the server. Try again in a moment.", "bot");
    }
  }

  sendBtn.addEventListener("click", sendQuestion);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendQuestion();
  });
})();
