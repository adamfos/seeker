import { getAuthToken, logout, loginUser, registerUser, setAuthToken } from './auth.js';
import { generateOptimizedSearchString } from './search.js';

document.addEventListener('DOMContentLoaded', () => {
  const authToken = getAuthToken();
  updateUI(authToken);

  document.querySelector(".menu-toggle").addEventListener("click", function () {
    document.querySelector(".userbar-links").classList.toggle("active");
  });

  document.querySelector('.close-modal').addEventListener('click', closeModal);
  window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('authModal')) {
      closeModal();
    }
  });
  resetInactivityTimer();
});

function updateUI(user) {
  const userbarLinks = document.getElementById('userbarLinks');
  const mainContent = document.getElementById('mainContent');
  const authContainer = document.getElementById('authContainer');

  if (user) {
    let linksHTML = `
      <a href="profile.html" class="userbar-link"><i class="fas fa-user"></i> Profile</a>
      <a href="mysearches.html" class="userbar-link"><i class="fas fa-search"></i> My Searches</a>
      <a href="settings.html" class="userbar-link"><i class="fas fa-cog"></i> Settings</a>
    `;

    if (user.user_type === 'admin') {
      linksHTML += `<a href="admin.html" class="userbar-link"><i class="fas fa-shield-halved"></i> Admin Panel</a>`;
    }
    linksHTML += `<a href="#" id="logoutBtn" class="userbar-link"><i class="fas fa-sign-out-alt"></i> Logout</a>`;
    userbarLinks.innerHTML = linksHTML;

    mainContent.innerHTML = `
      <img src="https://i.ibb.co/pvmJX8pm/output-onlinepngtools.png" alt="Seeker Logo" class="logo">
      <div class="search-container">
        <input type="text" id="search-box" placeholder="Enter your search query..." class="search-box">
        <button id="search-button" class="search-button"><i class="fa-solid fa-magnifying-glass"></i></button>
      </div>
      <div id="search-results" class="search-results"></div>
      <p class="description">
        Seeker generates advanced Google search strings to help you find precise information effortlessly. 
        Designed for students and researchers.<br><br>
        Alternative: <a class="color" href="#">Manual Search</a>
      </p>
    `;
    document.getElementById('logoutBtn').addEventListener('click', logout);
    setupSearch();
  } else {
    userbarLinks.innerHTML = `
      <a href="#" id="loginBtn" class="userbar-link"><i class="fas fa-sign-in-alt"></i> Login</a>
      <a href="#" id="registerBtn" class="userbar-link"><i class="fas fa-user-plus"></i> Register</a>
    `;
    authContainer.innerHTML = `
      <div class="auth-welcome">
        <img src="https://i.ibb.co/pvmJX8pm/output-onlinepngtools.png" alt="Seeker Logo" class="logo">
        <p class="descriptionauth">
          Please register or login to use our advanced search query tool, save up to 50% of your time by finding the results you came for.<br><br>
          Need help? Reach out <a class="color" href="https://mau.se/sok-utbildning/program/tgiar/">here</a>.
        </p>
        <div class="auth-buttons">
          <button id="showLogin" class="auth-btn primary">Login</button>
          <button id="showRegister" class="auth-btn secondary">Register</button>
        </div>
      </div>
    `;
    document.getElementById('showLogin').addEventListener('click', showLoginForm);
    document.getElementById('showRegister').addEventListener('click', showRegisterForm);
    document.getElementById('loginBtn').addEventListener('click', showLoginForm);
    document.getElementById('registerBtn').addEventListener('click', showRegisterForm);
  }
}

function setupSearch() {
  const searchButton = document.getElementById('search-button');
  const searchBox = document.getElementById('search-box');
  const searchResults = document.getElementById('search-results');

  const handleSearch = async () => {
    resetInactivityTimer();
    const query = searchBox.value.trim();
    if (!query) {
      searchResults.innerHTML = '<p class="error">Please enter a search query</p>';
      return;
    }

    searchResults.innerHTML = '<p class="loading">Generating optimized search string...</p>';

    try {
      const result = await generateOptimizedSearchString(query);
      if (result.error) {
        searchResults.innerHTML = `<p class="error">Error: ${result.error}</p>`;
      } else {
        searchResults.innerHTML = `
          <div class="result-container">
            <div class="search-string"><code>${result.searchString}</code></div>
            <div class="search-actions">
              <button id="copy-button" class="action-button"><i class="far fa-copy"></i> Copy</button>
              <a href="https://www.google.com/search?q=${encodeURIComponent(result.searchString)}" target="_blank" class="action-button"><i class="fas fa-external-link-alt"></i> Search on Google</a>
              <button id="saveSearchBtn" class="action-button">💾 Spara sökning</button>
            </div>
          </div>
        `;

document.getElementById('saveSearchBtn').addEventListener('click', async () => {
  const user = getAuthToken();
  console.log("Inloggad användare:", user);
  const searchString = searchBox.value.trim();
  const goal = document.getElementById('searchGoal')?.value;

  


  if (!user || !user.user_id) {
    alert("Du måste vara inloggad för att spara sökningar.");
    return;
  }

  if (!searchString) {
    alert("Inget att spara – sökrutan är tom.");
    return;
  }

  try {
    const response = await fetch('/api/save-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: user.user_id,
        search_string: searchString,
        goal: goal || ""
      })
    });

    const result = await response.json();
    console.log("Svar från /api/save-search:", result);

    if (result.success) {
      alert("✅ Sökningen har sparats!");
    } else {
      alert("❌ Kunde inte spara: " + result.error);
    }
  } catch (error) {
    console.error("Fel vid sparande:", error);
    alert("Ett fel uppstod när sökningen skulle sparas.");
  }
});


        document.getElementById('copy-button').addEventListener('click', () => {
          navigator.clipboard.writeText(result.searchString)
            .then(() => {
              const copyButton = document.getElementById('copy-button');
              copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
              setTimeout(() => {
                copyButton.innerHTML = '<i class="far fa-copy"></i> Copy';
              }, 2000);
            })
            .catch(err => {
              console.error('Failed to copy text: ', err);
            });
        });
      }
    } catch (error) {
      searchResults.innerHTML = `<p class="error">An error occurred: ${error.message}</p>`;
    }
  };

  const params = new URLSearchParams(window.location.search);
  if (params.has('query')) {
    searchBox.value = params.get('query');
    handleSearch();
  }

  searchButton.addEventListener('click', handleSearch);
  searchBox.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });
}


function closeModal() {
  document.getElementById('authModal').style.display = 'none';
}

function showLoginForm() {
  const modal = document.getElementById('authModal');
  const modalContent = document.getElementById('modalContent');

  modalContent.innerHTML = `
    <h2>Login to Seeker</h2><br>
    <form id="loginForm">
      <div class="form-group">
        <label for="loginEmail">Email</label>
        <input type="email" id="loginEmail" required>
      </div>
      <div class="form-group">
        <label for="loginPassword">Password</label>
        <input type="password" id="loginPassword" required>
      </div>
      <button type="submit" class="auth-btn primary">Login</button>
    </form>
  `;

  modal.style.display = 'block';

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const response = await loginUser(email, password);

    if (response.error) {
      alert(response.error);
    } else {
      // Store user data in localStorage using setAuthToken
      setAuthToken({
        user_id: response.user_id,
        username: response.username,
        user_type: response.user_type
      });
      
      closeModal();
      updateUI(response);
    }
  });
}

function showRegisterForm() {
  const modal = document.getElementById('authModal');
  const modalContent = document.getElementById('modalContent');

  modalContent.innerHTML = `
    <h2>Register for Seeker</h2><br>
    <form id="registerForm">
      <div class="form-group">
        <label for="regUsername">Username</label>
        <input type="text" id="regUsername" required>
      </div>
      <div class="form-group">
        <label for="regEmail">Email</label>
        <input type="email" id="regEmail" required>
      </div>
      <div class="form-group">
        <label for="regPassword">Password</label>
        <input type="password" id="regPassword" required>
      </div>
      <div class="form-group">
        <label for="regUserType">Occupation</label>
        <select id="regUserType" required>
          <option value="student">Student</option>
          <option value="academic">Academic / Researcher</option>
          <option value="professional">Professional</option>
        </select>
      </div>
      <div class="form-group">
        <label for="regInstitution">Institution (optional)</label>
        <input type="text" id="regInstitution">
      </div>
      <button type="submit" class="auth-btn primary">Register</button>
    </form>
  `;

  modal.style.display = 'block';

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const userType = document.getElementById('regUserType').value;
    const institution = document.getElementById('regInstitution').value;

    const user = await registerUser(username, email, password, userType, institution);

    if (user.error) {
        alert(user.error);
    } else {
        alert('Registration was successful!');
        setAuthToken(user);
        closeModal();
        updateUI(user);
    }
    });
}

// Inactivity logout: if no search in 3 minutes, prompt then logout
let inactivityTimer;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(async () => {
    const stay = confirm('You have been inactive for 3 minutes. Click OK to stay logged in or Cancel to log out.');
    if (stay) {
      resetInactivityTimer();
    } else {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';  // adjust to new maps if needed
    }
  }, 3 * 60 * 1000);
}