
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

const firebaseConfig = {
  apiKey: "AIzaSyCbDq_24vPHDVTJ3P0cZvg1zCSIIMtrl7o",
  authDomain: "our-little-world-b1d14.firebaseapp.com",
  projectId: "our-little-world-b1d14",
  storageBucket: "our-little-world-b1d14.firebasestorage.app",
  messagingSenderId: "672337362424",
  appId: "1:672337362424:web:08a9394067eec8bc09ea0d",
  measurementId: "G-QS6WTY7HZV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);

const loginPage = $("loginPage");
const dashboard = $("dashboard");
const loginForm = $("loginForm");
const loginButton = $("loginButton");
const message = $("message");
const logoutButton = $("logoutButton");

const chatMessages = $("chatMessages");
const chatForm = $("chatForm");
const chatInput = $("chatInput");
const sendButton = $("sendButton");
const chatStatus = $("chatStatus");

const messagesRef = collection(
  db, "sharedSpaces", "ourLittleWorld", "messages"
);

let currentUser = null;
let stopChatListener = null;
let countdownTimer = null;
let toastTimer = null;

function toast(text) {
  const element = $("toast");
  element.textContent = text;
  element.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("show"), 2300);
}

// LOGIN
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginButton.disabled = true;
  loginButton.textContent = "Entering...";
  message.textContent = "";

  try {
    await signInWithEmailAndPassword(
      auth,
      $("email").value.trim(),
      $("password").value
    );
  } catch (error) {
    console.error(error);
    message.textContent =
      error.code === "auth/invalid-credential"
        ? "Incorrect email or password."
        : "Unable to sign in. Please try again.";
  } finally {
    loginButton.disabled = false;
    loginButton.innerHTML = "Enter our world <span>♡</span>";
  }
});

// PAGE NAVIGATION
function openPage(pageId) {
  document.querySelectorAll(".app-page").forEach((page) => {
    page.classList.remove("active");
  });

  const page = $(pageId);
  if (!page) return;

  page.classList.remove("active");
  void page.offsetWidth;
  page.classList.add("active");

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("selected", button.dataset.nav === pageId);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-page]").forEach((button) => {
  button.addEventListener("click", () => openPage(button.dataset.page + "Page"));
});

document.querySelectorAll("[data-home]").forEach((button) => {
  button.addEventListener("click", () => openPage("homePage"));
});

document.querySelectorAll("[data-nav]").forEach((button) => {
  button.addEventListener("click", () => openPage(button.dataset.nav));
});

// REAL-TIME CHAT
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
    bubble.classList.add(data.uid === currentUser?.uid ? "mine" : "theirs");

    const sender = document.createElement("strong");
    sender.textContent = data.uid === currentUser?.uid
      ? "You"
      : (data.email || "Shared account");

    const content = document.createElement("div");
    content.textContent = data.text || "";

    const time = document.createElement("small");
    time.textContent = data.createdAt
      ? data.createdAt.toDate().toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      : "Sending...";

    bubble.append(sender, content, time);
    chatMessages.appendChild(bubble);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function startChat() {
  if (stopChatListener) stopChatListener();

  chatStatus.textContent = "Connecting to your little world...";

  const chatQuery = query(messagesRef, orderBy("createdAt", "asc"));

  stopChatListener = onSnapshot(chatQuery, (snapshot) => {
    displayMessages(snapshot);
    chatStatus.textContent = "Connected ♡";
  }, (error) => {
    console.error(error);
    chatStatus.textContent = "Unable to load messages. Check permissions.";
  });
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = chatInput.value.trim();
  if (!text || !currentUser) return;

  sendButton.disabled = true;

  try {
    await addDoc(messagesRef, {
      text,
      uid: currentUser.uid,
      email: currentUser.email || "",
      createdAt: serverTimestamp()
    });

    chatInput.value = "";
    chatStatus.textContent = "Message sent ♡";
  } catch (error) {
    console.error(error);
    chatStatus.textContent = "Message could not be sent.";
    toast("Please try sending again.");
  } finally {
    sendButton.disabled = false;
    chatInput.focus();
  }
});

// LOCAL SHARED-NOTES UI
let notes = JSON.parse(localStorage.getItem("ourWorldNotes") || "[]");

function renderNotes() {
  const list = $("notesList");
  list.innerHTML = "";

  if (!notes.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Your notebook is waiting for its first note.";
    list.appendChild(empty);
    return;
  }

  notes.forEach((note, index) => {
    const card = document.createElement("article");
    card.className = "note-item";

    const remove = document.createElement("button");
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      notes.splice(index, 1);
      saveNotes();
      renderNotes();
      toast("Note deleted.");
    });

    const content = document.createElement("p");
    content.textContent = note.text;

    const date = document.createElement("small");
    date.textContent = note.date;

    card.append(remove, content, date);
    list.appendChild(card);
  });
}

function saveNotes() {
  localStorage.setItem("ourWorldNotes", JSON.stringify(notes));
}

$("addNoteButton").addEventListener("click", () => {
  const text = $("noteInput").value.trim();
  if (!text) {
    toast("Write a little note first.");
    return;
  }

  notes.unshift({
    text,
    date: new Date().toLocaleString()
  });

  saveNotes();
  renderNotes();
  $("noteInput").value = "";
  toast("Added to your notebook ♡");
});

renderNotes();

// DAILY QUESTIONS
const questions = [
  "What is one small thing that made you happy recently?",
  "What place would you love to visit someday?",
  "What is a memory that always makes you smile?",
  "What simple activity would make a perfect day?",
  "What is something new you would like to learn?",
  "What song reminds you of a happy moment?",
  "What is one thing you appreciate about today?",
  "If you had a free afternoon, how would you spend it?",
  "What is a little tradition you would like to start?",
  "What is something you are looking forward to?"
];

let questionIndex = Number(localStorage.getItem("ourQuestionIndex") || 0);
$("dailyQuestion").textContent = questions[questionIndex % questions.length];

$("nextQuestionButton").addEventListener("click", () => {
  questionIndex = (questionIndex + 1) % questions.length;
  localStorage.setItem("ourQuestionIndex", questionIndex);
  $("dailyQuestion").textContent = questions[questionIndex];
  $("answerInput").value = "";
  $("answerStatus").textContent = "";
});

$("saveAnswerButton").addEventListener("click", () => {
  const answer = $("answerInput").value.trim();
  if (!answer) {
    $("answerStatus").textContent = "Write your answer first ♡";
    return;
  }

  localStorage.setItem(
    "ourAnswer_" + questionIndex,
    answer
  );
  $("answerStatus").textContent = "Your answer has been saved on this device ♡";
});

// COUNTDOWN
function updateCountdown() {
  const dateValue = $("specialDate").value;
  if (!dateValue) return;

  const target = new Date(dateValue + "T00:00:00").getTime();
  const difference = target - Date.now();

  if (difference <= 0) {
    $("countDays").textContent = "0";
    $("countHours").textContent = "0";
    $("countMinutes").textContent = "0";
    $("countSeconds").textContent = "0";
    $("countdownTitle").textContent = "Your special day is here! ♡";
    return;
  }

  $("countDays").textContent = Math.floor(difference / 86400000);
  $("countHours").textContent = Math.floor(difference / 3600000) % 24;
  $("countMinutes").textContent = Math.floor(difference / 60000) % 60;
  $("countSeconds").textContent = Math.floor(difference / 1000) % 60;
}

function loadCountdown() {
  const saved = JSON.parse(localStorage.getItem("ourWorldCountdown") || "null");
  if (saved) {
    $("specialDate").value = saved.date || "";
    $("specialTitle").value = saved.title || "";
    $("countdownTitle").textContent = saved.title || "A day worth celebrating";
  }
  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);
}

$("saveCountdownButton").addEventListener("click", () => {
  const date = $("specialDate").value;
  const title = $("specialTitle").value.trim();

  if (!date) {
    $("countdownStatus").textContent = "Choose your special date first.";
    return;
  }

  const saved = { date, title: title || "A day worth celebrating" };
  localStorage.setItem("ourWorldCountdown", JSON.stringify(saved));
  $("countdownTitle").textContent = saved.title;
  $("countdownStatus").textContent = "Your special date has been saved on this device ♡";
  updateCountdown();
  toast("Countdown updated!");
});

loadCountdown();

// VIRTUAL GARDEN
const flowers = ["🌷", "🌼", "🌸", "🌻", "🪻", "🌺", "💐"];
let garden = JSON.parse(localStorage.getItem("ourWorldGarden") || "null") || {
  count: 3,
  water: 0
};

function renderGarden() {
  const gardenFlowers = $("gardenFlowers");
  gardenFlowers.innerHTML = "";

  const visible = Math.min(garden.count, 15);

  for (let i = 0; i < visible; i++) {
    const flower = document.createElement("span");
    flower.textContent = flowers[i % flowers.length];
    flower.style.animationDelay = (i * 0.12) + "s";
    gardenFlowers.appendChild(flower);
  }

  $("flowerCount").textContent = garden.count;
}

function saveGarden() {
  localStorage.setItem("ourWorldGarden", JSON.stringify(garden));
  renderGarden();
}

$("plantButton").addEventListener("click", () => {
  if (garden.count >= 30) {
    toast("Your garden is full of flowers! ♡");
    return;
  }

  garden.count++;
  saveGarden();
  $("gardenMessage").textContent = "A new little flower has grown. 🌷";
  toast("A new flower was planted!");
});

$("waterButton").addEventListener("click", () => {
  garden.water++;
  saveGarden();
  $("gardenMessage").textContent = "Your garden is receiving a little care. 💧";
  toast("Your flowers have been watered!");
});

renderGarden();

// AUTH STATE
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (user) {
    loginPage.classList.add("hidden");
    dashboard.classList.remove("hidden");
    openPage("homePage");
    startChat();
  } else {
    loginPage.classList.remove("hidden");
    dashboard.classList.add("hidden");

    if (stopChatListener) {
      stopChatListener();
      stopChatListener = null;
    }

    currentUser = null;
  }
});

// SIGN OUT
logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    toast("Signed out.");
  } catch (error) {
    console.error(error);
    toast("Unable to sign out. Please try again.");
  }
});
