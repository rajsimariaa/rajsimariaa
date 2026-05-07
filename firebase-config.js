// Firebase Configuration Placeholder
// Replace these values with your actual Firebase project config
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

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
} else {
    console.warn("Firebase SDK not detected. Please add Firebase script tags.");
}
