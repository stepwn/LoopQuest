var ChatLog = {
  chatLogElement: null,
  maxChatMessages: 3,
  chatMessagesCount: 0,

  init: function() {
    // Create the chat log element
    this.maxOpacity = 0.7;
    this.chatLogElement = document.createElement("div");
    this.chatLogElement.style = "transition: opacity 0.5s ease-out;";
    this.chatLogElement.id = "chatLog";
    this.chatLogElement.style.position = "fixed";
    this.chatLogElement.style.bottom = "1vw";
    this.chatLogElement.style.left = "50%";
    this.chatLogElement.style.transform = "translateX(-50%)";
    this.chatLogElement.style.textAlign = "center";
    this.chatLogElement.style.opacity = "0.8";
    this.chatLogElement.style.backgroundColor = "black";
    this.chatLogElement.style.color = "white";
    this.chatLogElement.style.padding = "10px";
    this.chatLogElement.style.paddingBottom = "0px";
    this.chatLogElement.style.overflowY = "auto";
    this.chatLogElement.style.opacity = 0;
    this.chatLogElement.style.zIndex = 100;
    this.chatLogElement.style.pointerEvents = "none";

  
    // Append the chat log element to the body
    document.getElementById("container").appendChild(this.chatLogElement);
    // Assign the ChatLog object to a global variable for use in other modules
    window.ChatLog = this;
  },

  addMessage: function(message, playerName="Game") {
    this.chatLogElement.style.opacity = this.maxOpacity;
    // Create the chat message element
    var chatMessageElement = document.createElement("div");
    chatMessageElement.textContent = playerName + ": " + message;
  
    // Append the new message to the chat log
    this.chatLogElement.appendChild(chatMessageElement);
  
    // Limit the number of chat messages
    this.chatMessagesCount++;
    if (this.chatMessagesCount > this.maxChatMessages) {
      // Remove the oldest chat message
      this.chatLogElement.removeChild(this.chatLogElement.firstChild);
    }
    // Reset the chat log timer
    this.resetChatLogTimer();
    // Scroll to the bottom of the chat log
    this.chatLogElement.scrollTop = this.chatLogElement.scrollHeight;
  },
  resetChatLogTimer: function() {
    // Clear the existing chat log timer if it's running
    if (this.chatLogTimer) {
      clearTimeout(this.chatLogTimer);
    }
  
    // Start a new chat log timer for 10 seconds
    this.chatLogTimer = setTimeout(function() {
      // Hide the chat log after 10 seconds of inactivity
      window.ChatLog.chatLogElement.style.opacity = 0;
    }, 5000);
  },
  
};

// Initialize the chat log
ChatLog.init();


