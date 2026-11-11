
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

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

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const message = document.getElementById("message");

const loginCard = document.getElementById("loginCard");
const welcomeCard = document.getElementById("welcomeCard");
const welcomeEmail = document.getElementById("welcomeEmail");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";
  message.textContent = "";

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    message.textContent = "Sign-in failed. Check your email and password.";
    console.error(error.code);
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Enter Our World";
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginCard.classList.add("hidden");
    welcomeCard.classList.remove("hidden");
    welcomeEmail.textContent = user.email;
  } else {
    loginCard.classList.remove("hidden");
    welcomeCard.classList.add("hidden");
  }
});

document.getElementById("logoutButton").addEventListener("click", async () => {
  await signOut(auth);
});
