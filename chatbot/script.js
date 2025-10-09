const chatBotBody = document.querySelector(".ChatBot-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileUploadButton = document.querySelector("#file-upload");
const cancelFileButton = document.querySelector("#cancel-file");
const closeChatbotButton = document.querySelector("#close-chatbot");
const emojiButton = document.querySelector("#emoji-button");
const chatbotToggler = document.querySelector(".chatbot-toggler");


// Detect if running from file:// protocol (no server)
const isFileProtocol = window.location.protocol === 'file:';

// Demo API key - replace with your own
const API_KEY = "  ";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Common emojis for picker
const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯', '😊', '😎', '🤗', '😭', '🙄', '😱', '🤩', '🥰', '😋', '🤪'];

const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null
  }
};

const createMessageElement = (content, classes) => {
  const div = document.createElement("div");
  div.classList.add("message", classes);
  div.innerHTML = content;
  return div;
};

const generateBotResponse = async incommingMessageDiv => {
  const messageElement = incommingMessageDiv.querySelector(".message-text");
  
  const requestOption = {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "User-Agent": "ChatBot/1.0"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: userData.message || "Hello"
            }, ...(userData.file.data ? [{ inline_data: userData.file }] : [])
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    })
  };
  
  try {
    console.log("Sending request to:", API_URL);
    
    const response = await fetch(API_URL, requestOption);
    const data = await response.json();
    
    console.log("API Response:", data);
    
    if (!response.ok) {
      let errorMessage = "";
      if (response.status === 400) {
        errorMessage = "⚠️ Demo API key may have reached its limit. Please get your own free API key from Google AI Studio.";
      } else if (response.status === 403) {
        errorMessage = "🔑 API key issue. Try getting a fresh key from Google AI Studio.";
      } else if (response.status === 429) {
        errorMessage = "⏳ Too many requests. Please wait a moment and try again.";
      } else {
        errorMessage = data.error?.message || `❌ API Error: HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error("🚫 No response generated. Content may have been blocked by safety filters.");
    }

    const apiResponseText = data.candidates[0].content.parts[0].text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .trim();
    messageElement.innerHTML = apiResponseText;
  } catch (error) {
    console.error("Chatbot Error:", error);
    
    // Show user-friendly error message
    if (error.message.includes('API key')) {
      messageElement.innerHTML = `
        <div style="color: #ff6b6b; padding: 15px; border-radius: 10px; background: #ffe6e6; border-left: 4px solid #ff6b6b;">
          <strong>🔑 API Key Issue</strong><br><br>
          <strong>Quick Fix Options:</strong><br>
          1. <strong>Get Free API Key:</strong> Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #007bff; text-decoration: underline;">Google AI Studio</a><br>
          2. <strong>Alternative:</strong> Try <a href="https://openai.com/api/" target="_blank" style="color: #007bff; text-decoration: underline;">OpenAI API</a><br>
          3. <strong>Local Option:</strong> Use <a href="https://ollama.ai/" target="_blank" style="color: #007bff; text-decoration: underline;">Ollama</a> for offline AI<br><br>
          <small>💡 The demo key may have usage limits. Your own key is always better!</small>
        </div>
      `;
    } else {
      messageElement.innerHTML = `
        <div style="color: #ff6b6b; padding: 15px; border-radius: 10px; background: #ffe6e6; border-left: 4px solid #ff6b6b;">
          <strong>❌ Error:</strong> ${error.message}<br><br>
          <strong>Try:</strong><br>
          • Check your internet connection<br>
          • Wait a moment and try again<br>
          • Get your own API key for better reliability<br>
        </div>
      `;
    }
  } finally {
    userData.file = { data: null, mime_type: null };
    incommingMessageDiv.classList.remove("thinking");
    chatBotBody.scrollTo({ top: chatBotBody.scrollHeight, behavior: "smooth" });
  }
};

const handleOutgoingMessage = e => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  if (!userData.message && !userData.file.data) return;
  
  messageInput.value = "";
  // Hide send button after sending
  sendMessageButton.style.display = "none";
  // Reset textarea height
  messageInput.style.height = "auto";

  const messageContent = `<div class="message-text"></div>
  ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment"/>` : ""}`;
  const outgoingMessageDiv = createMessageElement(
    messageContent,
    "user-message"
  );
  outgoingMessageDiv.querySelector(".message-text").textContent = userData.message;
  chatBotBody.appendChild(outgoingMessageDiv);
  chatBotBody.scrollTo({ top: chatBotBody.scrollHeight, behavior: "smooth" });

  // Clear file upload after sending
  if (userData.file.data) {
    const previewImg = fileUploadWrapper.querySelector("img");
    previewImg.src = "#";
    previewImg.style.display = "none";
    fileUploadWrapper.classList.remove("file-uploaded");
    fileUploadButton.style.display = "block";
    cancelFileButton.style.display = "none";
  }

  setTimeout(() => {
    const messageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50"
                    viewBox="0 0 1024 1024">
                    <path
                        d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z">
                    </path>
                </svg>

                <div class="message-text">
                   <div class="thinking-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                   </div>
                </div>`;
    const incommingMessageDiv = createMessageElement(
      messageContent,
      "bot-message thinking"
    );
    chatBotBody.appendChild(incommingMessageDiv);
    chatBotBody.scrollTo({ top: chatBotBody.scrollHeight, behavior: "smooth" });
    
    // Start API response generation
    generateBotResponse(incommingMessageDiv);
  }, 600);
};

messageInput.addEventListener("keydown", e => {
  const userMessage = e.target.value.trim();
  if (e.key === "Enter" && !e.shiftKey && (userMessage || userData.file.data)) {
    e.preventDefault();
    handleOutgoingMessage(e);
  }
});

// Show/hide send button based on input content
// (Removed - now handled in the input event listener above)

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  // Check if running without server
  if (isFileProtocol) {
    alert('📁 File upload requires a local server.\n\nTo enable file uploads:\n1. Use Live Server extension in VS Code\n2. Or run: python -m http.server 8000\n3. Or press F5 to auto-launch');
    fileInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const previewImg = fileUploadWrapper.querySelector("img");
    previewImg.src = e.target.result;
    previewImg.style.display = "block";
    fileUploadWrapper.classList.add("file-uploaded");
    fileUploadButton.style.display = "none";
    cancelFileButton.style.display = "block";
    
    const base64String = e.target.result.split(",")[1];

    userData.file = {
      data: base64String,
      mime_type: file.type
    };

    fileInput.value = "";
    
    // Show send button when file is uploaded
    sendMessageButton.style.display = "block";
  };

  reader.readAsDataURL(file);
});

// File upload and cancel functionality
fileUploadButton.addEventListener("click", () => fileInput.click());

cancelFileButton.addEventListener("click", () => {
  const previewImg = fileUploadWrapper.querySelector("img");
  previewImg.src = "#";
  previewImg.style.display = "none";
  fileUploadWrapper.classList.remove("file-uploaded");
  fileUploadButton.style.display = "block";
  cancelFileButton.style.display = "none";
  userData.file = { data: null, mime_type: null };
  fileInput.value = "";
  
  // Hide send button if no text and no file
  if (!messageInput.value.trim()) {
    sendMessageButton.style.display = "none";
  }
});

// Emoji functionality
emojiButton.addEventListener("click", () => {
  // Create emoji picker if it doesn't exist
  let emojiPicker = document.querySelector(".emoji-picker");
  if (!emojiPicker) {
    emojiPicker = document.createElement("div");
    emojiPicker.className = "emoji-picker";
    emojiPicker.innerHTML = commonEmojis.map(emoji => `<span class="emoji-option">${emoji}</span>`).join('');
    document.querySelector(".chatbot-footer").appendChild(emojiPicker);
    
    // Add click handlers for emoji options
    emojiPicker.addEventListener("click", (e) => {
      if (e.target.classList.contains("emoji-option")) {
        messageInput.value += e.target.textContent;
        messageInput.focus();
        emojiPicker.style.display = "none";
        
        // Trigger input event to show send button
        messageInput.dispatchEvent(new Event('input'));
      }
    });
  }
  
  // Toggle emoji picker visibility
  emojiPicker.style.display = emojiPicker.style.display === "block" ? "none" : "block";
});

// Close emoji picker when clicking outside
document.addEventListener("click", (e) => {
  const emojiPicker = document.querySelector(".emoji-picker");
  if (emojiPicker && !emojiButton.contains(e.target) && !emojiPicker.contains(e.target)) {
    emojiPicker.style.display = "none";
  }
});

// Chatbot toggle functionality
chatbotToggler.addEventListener("click", () => {
  document.body.classList.toggle("show-chatbot");
});

// Close chatbot functionality
closeChatbotButton.addEventListener("click", () => {
  document.body.classList.remove("show-chatbot");
});

// Auto-resize textarea and handle emoji triggers
messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
  
  const hasText = messageInput.value.trim().length > 0;
  const hasFile = userData.file.data;
  
  if (hasText || hasFile) {
    sendMessageButton.style.display = "block";
  } else {
    sendMessageButton.style.display = "none";
  }
});

// Handle emoji picker trigger for send button
emojiButton.addEventListener("click", () => {
  // Create emoji picker if it doesn't exist
  let emojiPicker = document.querySelector(".emoji-picker");
  if (!emojiPicker) {
    emojiPicker = document.createElement("div");
    emojiPicker.className = "emoji-picker";
    emojiPicker.innerHTML = commonEmojis.map(emoji => `<span class="emoji-option">${emoji}</span>`).join('');
    document.querySelector(".chatbot-footer").appendChild(emojiPicker);
    
    // Add click handlers for emoji options
    emojiPicker.addEventListener("click", (e) => {
      if (e.target.classList.contains("emoji-option")) {
        messageInput.value += e.target.textContent;
        messageInput.focus();
        emojiPicker.style.display = "none";
        
        // Trigger input event to show send button
        messageInput.dispatchEvent(new Event('input'));
      }
    });
  }
  
  // Toggle emoji picker visibility
  emojiPicker.style.display = emojiPicker.style.display === "block" ? "none" : "block";
});

