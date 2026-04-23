// ---------------------------------------------------------
// PLACEHOLDER CONFIGURATION
// ---------------------------------------------------------
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select an existing one
// 3. Go to Project Settings -> General -> Your apps
// 4. Click the Web icon (</>) to register a new web app
// 5. Copy the configuration object and replace the below:
// ---------------------------------------------------------

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBHTcld1VLz9wUHDeobnwaWZDhTL3qUiH4",
    authDomain: "raj-simaria-8cce3.firebaseapp.com",
    projectId: "raj-simaria-8cce3",
    storageBucket: "raj-simaria-8cce3.firebasestorage.app",
    messagingSenderId: "873431539001",
    appId: "1:873431539001:web:27b73592d280d07ac11ce8",
    measurementId: "G-NNYREK7RR2"
};

// Initialize Firebase App
firebase.initializeApp(firebaseConfig);

// Initialize Services
const db = firebase.firestore();
const auth = firebase.auth();
