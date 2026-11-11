
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyCbDq_24vPHDVTJ3P0cZvg1zCSIIMtrl7o",
  authDomain: "our-little-world-b1d14.firebaseapp.com",
  projectId: "our-little-world-b1d14",
  storageBucket: "our-little-world-b1d14.firebasestorage.app",
  messagingSenderId: "672337362424",
  appId: "1:672337362424:web:08a9394067eec8bc09ea0d",
  measurementId: "G-QS6WTY7HZV"
};

// INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// PAGE ELEMENTS
const loginPage = document.getElementById("loginPage");
const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const message = document.getElementById("message");

const dashboard = document.getElementById("dashboard");
const featurePage = document.getElementById("featurePage");

const logoutButton = document.getElementById("logoutButton");
const accountEmail = document.getElementById("accountEmail");

const featureHeading = document.getElementById("featureHeading");
const featureText = document.getElementById("featureText");
const backButton = document.getElementById("backButton");

const featureContent = document.querySelector(".feature-page-content");

// CHAT ELEMENTS
const chatSection = document.getElementById("chatSection");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");
const chatStatus = document.getElementById("chatStatus");

// CURRENT USER AND CHAT LISTENER
let currentUser = null;
let stopChatListener = null;

// SHARED CHAT COLLECTION
const messagesRef = collection(
  db,
  "sharedSpaces",
  "ourLittleWorld",
  "messages"
);

// FEATURE CONTENT
const features = {
  chat: {
    title: "Our Little Chat ♡",
    description: "Your shared conversations."
  },
  memories: {
    title: "Our Memories 📷",
    description: "Keep special moments and memories in one place. This feature is coming soon."
  },
  questions: {
    title: "Daily Questions ☁️",
    description: "Discover new things through thoughtful daily questions. This feature is coming soon."
  },
  notes: {
    title: "Our Shared Notes 📝",
    description: "Write down thoughts, reminders, and ideas. This feature is coming soon."
  },
  garden: {
    title: "Our Garden 🌷",
    description: "A little virtual garden that you can grow together. This feature is coming soon."
  },
  countdown: {
    title: "Our Countdown 🗓️",
    description: "Keep track of your special dates. This feature is coming soon."
  }
};

// LOGIN
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  loginButton.disabled = true;
  loginButton.textContent = "Entering...";
  message.textContent = "";

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error(error);

    if (error.code === "auth/invalid-credential") {
      message.textContent = "Incorrect email or password.";
    } else if (error.code === "auth/too-many-requests") {
      message.textContent = "Too many attempts. Try again later.";
    } else {
      message.textContent = "Unable to sign in. Check your connection.";
    }
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Enter Our World";
  }
});

// DISPLAY MESSAGES
function displayMessages(snapshot) {
  chatMessages.innerHTML = "";

  if (snapshot.empty) {
    const empty = document.createElement("p");
    empty.className = "chat-empty";
    empty.textContent = "Your conversation starts here ♡";
    chatMessages.appendChild(empty);
    return;
  }

  snapshot.forEach((messageDoc) => {
    const data = messageDoc.data();

    const bubble = document.createElement("div");
    bubble.className = "chat-message";

    if (data.uid === currentUser?.uid) {
      bubble.classList.add("mine");
    } else {
      bubble.classList.add("theirs");
    }

    const sender = document.createElement("strong");
    sender.textContent =
      data.uid === currentUser?.uid
        ? "You"
        : (data.email || "Shared account");

    const content = document.createElement("div");
    content.textContent = data.text || "";

    const time = document.createElement("small");

    if (data.createdAt) {
      time.textContent = data.createdAt.toDate().toLocaleString([], {
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "numeric"
      });
    } else {
      time.textContent = "Sending...";
    }

    bubble.appendChild(sender);
    bubble.appendChild(content);
    bubble.appendChild(time);

    chatMessages.appendChild(bubble);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// START REAL-TIME CHAT
function startChat() {
  if (stopChatListener) {
    stopChatListener();
  }

  chatStatus.textContent = "Connecting to your shared chat...";

  const chatQuery = query(
    messagesRef,
    orderBy("createdAt", "asc")
  );

  stopChatListener = onSnapshot(
    chatQuery,
    (snapshot) => {
      displayMessages(snapshot);
      chatStatus.textContent = "Connected ♡";
    },
    (error) => {
      console.error("Chat error:", error);
      chatStatus.textContent =
        "Unable to load messages. Check your connection and permissions.";
    }
  );
}

// SEND MESSAGE
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = chatInput.value.trim();

  if (!text || !currentUser) return;

  sendButton.disabled = true;
  chatStatus.textContent = "Sending...";

  try {
    await addDoc(messagesRef, {
      text: text,
      uid: currentUser.uid,
      email: currentUser.email || "",
      createdAt: serverTimestamp()
    });

    chatInput.value = "";
    chatStatus.textContent = "Message sent ♡";
  } catch (error) {
    console.error("Send error:", error);
    chatStatus.textContent = "Message could not be sent. Try again.";
  } finally {
    sendButton.disabled = false;
  }
});

// AUTHENTICATION STATUS
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (user) {
    loginPage.classList.add("hidden");
    dashboard.classList.remove("hidden");
    featurePage.classList.add("hidden");

    accountEmail.textContent = user.email || "Signed in";

    startChat();
  } else {
    loginPage.classList.remove("hidden");
    dashboard.classList.add("hidden");
    featurePage.classList.add("hidden");

    if (stopChatListener) {
      stopChatListener();
      stopChatListener = null;
    }

    currentUser = null;
  }
});

// OPEN FEATURE PAGES
document.querySelectorAll(".feature-card").forEach((card) => {
  card.addEventListener("click", () => {
    const feature = features[card.dataset.page];

    if (!feature) return;

    featureHeading.textContent = feature.title;
    featureText.textContent = feature.description;

    featureContent.classList.toggle(
      "hidden",
      card.dataset.page === "chat"
    );

    chatSection.classList.toggle(
      "hidden",
      card.dataset.page !== "chat"
    );

    dashboard.classList.add("hidden");
    featurePage.classList.remove("hidden");
  });
});

// BACK TO DASHBOARD
backButton.addEventListener("click", () => {
  featurePage.classList.add("hidden");
  dashboard.classList.remove("hidden");
});

// SIGN OUT
logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
    alert("Unable to sign out. Please try again.");
  }
});
