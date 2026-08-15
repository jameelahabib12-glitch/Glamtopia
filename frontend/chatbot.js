const chatBox = document.getElementById("chatBox");

const messageInput =
    document.getElementById("messageInput");

const sendBtn =
    document.getElementById("sendBtn");

const typing =
    document.getElementById("typing");


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(text, sender) {

    const row =
        document.createElement("div");

    row.className =
        `message-row ${sender}`;


    const message =
        document.createElement("div");

    message.className =
        `message ${sender}`;


    message.textContent =
        text;


    row.appendChild(message);

    // Typing indicator سے پہلے message رکھنا
    chatBox.insertBefore(
        row,
        typing
    );


    chatBox.scrollTop =
        chatBox.scrollHeight;
}


// ==========================================
// SHOW TYPING
// ==========================================

function showTyping() {

    typing.style.display =
        "block";

    chatBox.scrollTop =
        chatBox.scrollHeight;
}


// ==========================================
// HIDE TYPING
// ==========================================

function hideTyping() {

    typing.style.display =
        "none";
}


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

    const message =
        messageInput.value.trim();


    // Empty message
    if (!message) {
        return;
    }


    // User message
    addMessage(
        message,
        "user"
    );


    // Clear input
    messageInput.value = "";


    // Disable button
    sendBtn.disabled =
        true;


    // Show typing
    showTyping();


    try {

        const response =
            await fetch(
                "/api/chatbot",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        message: message
                    })
                }
            );


        const data =
            await response.json();


        hideTyping();


        if (!response.ok) {

            addMessage(
                data.message ||
                "Sorry, something went wrong.",
                "bot"
            );

            return;
        }


        // Bot response
        addMessage(
            data.reply ||
            "I'm here to help with Glamtopia.",
            "bot"
        );


    } catch (error) {

        console.error(
            "Chatbot error:",
            error
        );


        hideTyping();


        addMessage(
            "Sorry, I couldn't connect to the Glamtopia server.",
            "bot"
        );


    } finally {

        sendBtn.disabled =
            false;

        messageInput.focus();
    }
}


// ==========================================
// SEND BUTTON
// ==========================================

sendBtn.addEventListener(
    "click",
    sendMessage
);


// ==========================================
// ENTER KEY
// ==========================================

messageInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();
        }

    }
);