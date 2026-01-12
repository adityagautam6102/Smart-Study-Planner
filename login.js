// Simple login/register logic using localStorage

function getUsers() {
  const raw = localStorage.getItem('smartStudyUsers');
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem('smartStudyUsers', JSON.stringify(users));
}

function setCurrentUser(user) {
  localStorage.setItem('smartStudyUser', JSON.stringify(user));
}

function onLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const users = getUsers();
  const found = users.find(u => u.email === email && u.password === password);
  if (found) {
    setCurrentUser({name: found.name, email: found.email});
    window.location.href = 'index.html';
  } else {
    alert('Invalid credentials. Try registering if you don\'t have an account.');
  }
}

function onRegister(e) {
  e.preventDefault();
  const name = document.getElementById('rname').value.trim();
  const email = document.getElementById('remail').value.trim();
  const password = document.getElementById('rpassword').value;

  if (!name || !email || !password) return alert('Please fill all fields');

  const users = getUsers();
  if (users.find(u => u.email === email)) return alert('Email already registered');

  users.push({name, email, password});
  saveUsers(users);
  setCurrentUser({name, email});
  alert('Account created — redirecting to planner');
  window.location.href = 'index.html';
}

function initAuth() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  loginForm.addEventListener('submit', onLogin);
  registerForm.addEventListener('submit', onRegister);
}

window.addEventListener('DOMContentLoaded', initAuth);