
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

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

// GET PAGE ELEMENTS
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

// FEATURE PAGE CONTENT
const features = {
  chat: {
    title: "Our Chat 💬",
    description: "A place for your conversations and little updates. Our shared chat is coming soon."
  },
  memories: {
    title: "Our Memories 📷",
    description: "Keep special moments and memories in one place. This memory corner is coming soon."
  },
  questions: {
    title: "Daily Questions ☁️",
    description: "Discover new things through thoughtful daily questions. This feature is coming soon."
  },
  notes: {
    title: "Our Shared Notes 📝",
    description: "Write down thoughts, reminders, and ideas to keep. Shared notes are coming soon."
  },
  garden: {
    title: "Our Garden 🌷",
    description: "A little virtual garden that you can grow together. Planting begins soon."
  },
  countdown: {
    title: "Our Countdown 🗓️",
    description: "Keep track of your special dates and upcoming celebrations. The countdown is coming soon."
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
    message.textContent = "";
  } catch (error) {
    console.error(error);

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      message.textContent = "Incorrect email or password. Please try again.";
    } else if (error.code === "auth/too-many-requests") {
      message.textContent = "Too many attempts. Please try again later.";
    } else {
      message.textContent = "Unable to sign in. Please check your connection.";
    }
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Enter Our World";
  }
});

// CHECK LOGIN STATUS
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginPage.classList.add("hidden");
    dashboard.classList.remove("hidden");
    featurePage.classList.add("hidden");

    accountEmail.textContent = user.email || "Signed in";
  } else {
    loginPage.classList.remove("hidden");
    dashboard.classList.add("hidden");
    featurePage.classList.add("hidden");
  }
});

// OPEN FEATURE PAGES
document.querySelectorAll(".feature-card").forEach((card) => {
  card.addEventListener("click", () => {
    const feature = features[card.dataset.page];

    if (!feature) return;

    featureHeading.textContent = feature.title;
    featureText.textContent = feature.description;

    dashboard.classList.add("hidden");
    featurePage.classList.remove("hidden");
  });
});

// RETURN TO DASHBOARD
backButton.addEventListener("click", () => {
  featurePage.classList.add("hidden");
  dashboard.classList.remove("hidden");
});

// SIGN OUT
logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-out error:", error);
    alert("Unable to sign out. Please try again.");
  }
});
