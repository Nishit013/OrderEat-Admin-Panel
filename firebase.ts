import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";

const firebaseConfig = {
  apiKey: "AIzaSyAjxKEB1dqVksX408f18eUCb5v73LW6wrc",
  authDomain: "ordereat-1325.firebaseapp.com",
  projectId: "ordereat-1325",
  storageBucket: "ordereat-1325.firebasestorage.app",
  messagingSenderId: "810353651974",
  appId: "1:810353651974:web:2633a0ff7c7ece07bf2e87"
};

const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
export const auth = app.auth();
export const db = app.database();