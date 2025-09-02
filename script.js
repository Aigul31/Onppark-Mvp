// OnPark App JavaScript

let selectedGender = '';
let selectedInterests = [];
let currentAge = 25;
let map;
let userMarker;
let userLocation = null;
let markersLayer;

// Screen Navigation Functions (must be declared before use)
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
  
  // Apply translations every time we switch screens
  updateTranslations();
}

function showRegistration() {
  showScreen('registrationScreen');
}

function showLogin() {
  showScreen('registrationScreen');
}

function showPhoto() {
  showScreen('photoScreen');
}

function showInterests() {
  showScreen('interestsScreen');
}

function showMap() {
  showScreen('mapScreen');
  setTimeout(() => {
    initializeMap();
    
    // Сначала загружаем других пользователей
    loadStatuses();
    
    // НЕ отправляем статус автоматически - пользователь должен выбрать место на карте
    console.log('Карта инициализирована. Пользователь может выбрать статус и место.');
  }, 100);
}

function showProfile() {
  showScreen('profileScreen');
  loadProfileData(); // Load user's registration data
}

function selectPhoto() {
  document.getElementById('photoInput').click();
}

// Gender Selection
document.addEventListener('DOMContentLoaded', function() {
  const genderOptions = document.querySelectorAll('.gender-option');
  
  genderOptions.forEach(option => {
    option.addEventListener('click', function() {
      genderOptions.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      selectedGender = this.dataset.gender;
    });
  });

  // Age Slider
  const ageSlider = document.getElementById('ageSlider');
  const ageValue = document.getElementById('ageValue');
  
  if (ageSlider) {
    ageSlider.addEventListener('input', function() {
      currentAge = this.value;
      ageValue.textContent = this.value;
    });
  }

  // Password Toggle
  const showPasswordBtn = document.querySelector('.show-password');
  const passwordInput = document.getElementById('password');
  
  if (showPasswordBtn) {
    showPasswordBtn.addEventListener('click', function() {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        this.textContent = 'Hide';
      } else {
        passwordInput.type = 'password';
        this.textContent = 'Show';
      }
    });
  }

  // Registration Form
  const registrationForm = document.getElementById('registrationForm');
  if (registrationForm) {
    registrationForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // Проверяем, возвращается ли пользователь (email заполнен автоматически)
      const savedProfile = localStorage.getItem('onparkProfile');
      if (savedProfile && email && password && !name) {
        // Это вход существующего пользователя
        await loginExistingUser(email, password);
        return;
      }

      if (!selectedGender) {
        alert('Пожалуйста, выберите пол');
        return;
      }
      
      if (!name) {
        alert('Пожалуйста, введите имя');
        return;
      }
      
      // Save profile data
      const profileData = {
        user_id: `user_${Date.now()}`, // Уникальный ID пользователя
        name,
        email,
        password, // Добавляем пароль в профиль
        age: currentAge,
        interests: selectedInterests.join(', '),
        avatar_url: localStorage.getItem('userAvatarUrl') || null
      };
      
      // Сохраняем локально для обратной совместимости
      localStorage.setItem('onparkProfile', JSON.stringify(profileData));
      
      // Отправляем в Supabase через API
      try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE}/api/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(profileData)
        });
        
        const result = await response.json();
        if (result.success) {
          console.log('Профиль сохранён в Supabase:', result.data);
        } else {
          console.error('Ошибка сохранения профиля:', result.error);
        }
      } catch (error) {
        console.error('Ошибка отправки профиля:', error);
      }
      
      // Show success message
      showSuccessMessage();
      
      setTimeout(() => {
        showPhoto();
      }, 2000);
    });
  }

  // Interest Bubbles
  const interestBubbles = document.querySelectorAll('.interest-bubble');
  
  interestBubbles.forEach(bubble => {
    bubble.addEventListener('click', function() {
      this.classList.toggle('selected');
      
      const interest = this.dataset.interest;
      if (selectedInterests.includes(interest)) {
        selectedInterests = selectedInterests.filter(i => i !== interest);
      } else {
        selectedInterests.push(interest);
      }
    });
  });

  // Photo Upload
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');
  
  if (photoInput) {
    photoInput.addEventListener('change', async function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          photoPreview.innerHTML = `<img src="${e.target.result}" alt="Profile photo">`;
        };
        reader.readAsDataURL(file);
        
        // Upload to Object Storage
        const uploadedUrl = await uploadPhotoToObjectStorage(file);
        if (uploadedUrl) {
          console.log('Photo uploaded to Object Storage:', uploadedUrl);
          // Store URL for later use
          localStorage.setItem('userAvatarUrl', uploadedUrl);
          
          // Также обновляем в основном профиле
          const currentProfile = JSON.parse(localStorage.getItem('onparkProfile') || '{}');
          currentProfile.avatar_url = uploadedUrl;
          localStorage.setItem('onparkProfile', JSON.stringify(currentProfile));
        }
        
        setTimeout(() => {
          showPhotoSuccess();
        }, 1000);
      }
    });
  }

  // Map filter functionality
  const filterIcons = document.querySelectorAll('.filter-icon');
  
  filterIcons.forEach(filter => {
    filter.addEventListener('click', function() {
      const filterType = this.dataset.filter;
      updateMapFilter(filterType);
    });
  });

  // Chat button functionality
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', showMessages);
  }

  // Check for saved profile and auto-login
  const savedProfile = localStorage.getItem('onparkProfile');
  if (savedProfile) {
    const profile = JSON.parse(savedProfile);
    if (profile.user_id && profile.display_name) {
      // User has a complete profile, go directly to map
      console.log('Auto-login detected for user:', profile.display_name);
      showMap();
    } else {
      // Incomplete profile, stay on welcome screen
      console.log('Incomplete profile found, staying on welcome screen');
    }
  } else {
    // No profile found, stay on welcome screen
    console.log('No saved profile found, staying on welcome screen');
  }
  
  // Load saved profile data
  loadProfileData();
  
  // Auto-fill email if user exists
  const savedProfileData = localStorage.getItem('onparkProfile');
  if (savedProfileData) {
    const profile = JSON.parse(savedProfileData);
    const emailField = document.getElementById('email');
    if (emailField && profile.email) {
      emailField.value = profile.email;
    }
  }
  
  // Load saved language
  const savedLang = localStorage.getItem('language') || 'ru';
  setLanguage(savedLang);
  
  // Initialize Supabase
  initializeSupabase();
  
  // Set current user (for demo, using a mock user)
  currentUser = {
    id: 'current-user-123',
    display_name: 'Вы',
    age: 25,
    status: 'coffee',
    interests: ['coffee', 'networking'],
    avatar_url: '👤'
  };
  
  console.log('OnPark initialized with demo data');
  
  // Инициализируем реальные чаты из localStorage
  initializeRealUserChats();
  
  // Initialize pending connections
  initializePendingConnections();
});

// Supabase Integration
let supabase = null;

async function initializeSupabase() {
  try {
    if (!window.APP_CONFIG || !window.APP_CONFIG.SUPABASE_URL || !window.APP_CONFIG.SUPABASE_ANON_KEY) {
      console.log('Supabase credentials not configured in APP_CONFIG, using mock data');
      return false;
    }
    
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG;
    
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('Supabase initialized with credentials');
      
      // Обработка magic link после входа
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log('Пользователь вошел:', session.user.email);
          alert('Вход выполнен успешно! Теперь вы можете размещать статусы.');
        }
        if (event === 'SIGNED_OUT') {
          console.log('Пользователь вышел');
        }
      });
      
      return true;
    } else {
      console.log('Supabase library not loaded, using mock data');
      return false;
    }
  } catch (error) {
    console.log('Supabase initialization failed, using mock data:', error);
    return false;
  }
}

// Language Functions
function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
  
  // Update language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.lang === lang) {
      btn.classList.add('active');
    }
  });
  
  // Update all translatable elements
  updateTranslations();
  
  // Update dynamic content if currently viewing
  const messagesScreen = document.getElementById('messagesScreen');
  if (messagesScreen && messagesScreen.style.display !== 'none') {
    loadConfirmedProfiles();
  }
}

function updateTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
      element.textContent = translations[currentLanguage][key];
    }
  });
  
  // Update placeholders
  const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
  placeholderElements.forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
      element.placeholder = translations[currentLanguage][key];
    }
  });
}

function t(key) {
  return translations[currentLanguage] && translations[currentLanguage][key] 
    ? translations[currentLanguage][key] 
    : translations['ru'][key] || key;
}

// Map and Geolocation Functions
function initializeMap() {
  if (map) {
    map.remove();
  }
  
  // Initialize map centered on Almaty, Kazakhstan
  map = L.map('map').setView([43.2776, 76.8957], 13); // Алматы
  
  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);
  
  // Create markers layer group
  markersLayer = L.layerGroup().addTo(map);
  
  // Add active user markers FIRST
  addActiveUsers();
  
  // Load profiles  
  loadProfiles();
  
  // Setup filter buttons
  setupUserStatusFilters();
  
  // Load real users from database with shorter delay for better performance
  setTimeout(() => {
    loadStatuses();
  }, 1000);
}

// Load statuses from API and display real users on map  
async function loadStatuses() {
  try {
    // Получаем статусы и профили из API (где фактически сохраняются данные)
    const [statusResponse, profilesResponse] = await Promise.all([
      fetch(`${window.APP_CONFIG.API_BASE}/api/statuses`),
      fetch(`${window.APP_CONFIG.API_BASE}/api/profiles`)
    ]);
    
    if (statusResponse.ok && profilesResponse.ok) {
      const statuses = await statusResponse.json();
      const profiles = await profilesResponse.json();
      
      console.log('=== ОТЛАДКА ЗАГРУЗКИ РЕАЛЬНЫХ ПОЛЬЗОВАТЕЛЕЙ ===');
      console.log('Загружено статусов:', statuses.length, statuses.slice(0, 3));
      console.log('Загружено профилей:', profiles.length, profiles);
      
      // Показываем счетчик статусов пользователю
      const statusCount = document.getElementById('status-counter') || createStatusCounter();
      statusCount.textContent = `${statuses.length} статусов на карте`;
      
      // Создаем карту профилей для быстрого поиска
      const profileMap = {};
      profiles.forEach(profile => {
        profileMap[profile.user_id] = profile;
      });
      
      // Очищаем предыдущие маркеры реальных пользователей
      if (window.realUserMarkers) {
        window.realUserMarkers.forEach(marker => map.removeLayer(marker));
      }
      window.realUserMarkers = [];
      
      // Получаем текущего пользователя
      const currentProfile = JSON.parse(localStorage.getItem('onparkProfile') || '{}');
      
      // Добавляем маркеры для каждого статуса
      console.log('Текущий пользователь:', currentProfile.user_id);
      statuses.forEach((status, index) => {
        console.log(`Обрабатываем статус ${index}:`, status);
        
        // Приводим координаты к числам и проверяем валидность
        const lat = Number(status.latitude);
        const lng = Number(status.longitude);
        
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          console.log('Пропускаем - невалидные координаты:', { lat, lng, original: { latitude: status.latitude, longitude: status.longitude } });
          return;
        }
        
        const profile = profileMap[status.user_id];
        if (!profile) {
          console.log('Пропускаем - нет профиля для user_id:', status.user_id);
          return;
        }
        
        // Пропускаем текущего пользователя
        if (currentProfile.user_id === status.user_id) {
          console.log('Пропускаем - это текущий пользователь');
          return;
        }
        
        console.log('Создаем маркер для пользователя:', profile.name || profile.display_name);
        
        const marker = L.marker([lat, lng], {
          icon: getStatusIconMarker(status.icon)
        }).addTo(map);
        
        // Добавляем попап с информацией о пользователе
        const popupContent = `
          <div style="text-align: center; min-width: 200px;">
            ${profile.avatar_url ? `<img src="${profile.avatar_url}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; margin-bottom: 10px;">` : ''}
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${profile.name || profile.display_name}</div>
            <div style="color: #4aa896; margin-bottom: 5px;">${status.message}</div>
            <div style="font-size: 12px; color: #666;">Возраст: ${profile.age}</div>
            ${profile.interests ? `<div style="font-size: 12px; color: #666; margin-top: 5px;">Интересы: ${profile.interests}</div>` : ''}
            <button onclick="startChat('${status.user_id}', '${profile.name || profile.display_name}', '${profile.avatar_url || ''}')" 
                    style="background: #4aa896; color: white; border: none; border-radius: 15px; 
                           padding: 8px 16px; margin-top: 10px; cursor: pointer; font-size: 14px;">
              Написать
            </button>
          </div>
        `;
        marker.bindPopup(popupContent);
        
        window.realUserMarkers.push(marker);
      });
      
      console.log(`Добавлено ${window.realUserMarkers.length} реальных пользователей на карту`);
    }
  } catch (error) {
    console.error('Error loading real statuses:', error);
    // Показываем ошибку в счетчике
    const statusCount = document.getElementById('status-counter') || createStatusCounter();
    statusCount.textContent = 'Ошибка загрузки статусов';
    statusCount.style.color = '#ff5757';
  }
}

// Создание счетчика статусов
function createStatusCounter() {
  const counter = document.createElement('div');
  counter.id = 'status-counter';
  counter.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(255, 255, 255, 0.9);
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: bold;
    color: #4aa896;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  `;
  counter.textContent = 'Загрузка...';
  document.body.appendChild(counter);
  return counter;
}

// Обязательная подсказка о статусе после регистрации
function showMandatoryStatusTutorial() {
  const tutorialOverlay = document.createElement('div');
  tutorialOverlay.id = 'status-tutorial-overlay';
  tutorialOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  tutorialOverlay.innerHTML = `
    <div style="
      background: white;
      border-radius: 20px;
      padding: 30px;
      max-width: 400px;
      margin: 20px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    ">
      <div style="font-size: 48px; margin-bottom: 20px;">🎯</div>
      <h2 style="margin: 0 0 15px 0; color: #4aa896;">Разместите свой статус!</h2>
      <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
        Чтобы <strong>общаться с другими пользователями</strong>, вам нужно разместить свой статус на карте. 
        Выберите что вас интересует: кофе ☕, прогулка 🚶‍♀️ или путешествие ✈️
      </p>
      <p style="margin: 0 0 25px 0; color: #999; font-size: 14px;">
        Это обязательное условие для активации функции сообщений
      </p>
      <button onclick="startStatusPlacement()" style="
        background: #4aa896;
        color: white;
        border: none;
        padding: 15px 30px;
        border-radius: 25px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        width: 100%;
      ">Разместить статус сейчас</button>
    </div>
  `;
  
  document.body.appendChild(tutorialOverlay);
}

// Начать размещение статуса (из обязательной подсказки)
function startStatusPlacement() {
  const tutorial = document.getElementById('status-tutorial-overlay');
  if (tutorial) {
    document.body.removeChild(tutorial);
  }
  
  // Подсвечиваем фильтры статусов
  const filterIcons = document.querySelectorAll('.filter-icon');
  filterIcons.forEach(icon => {
    icon.style.animation = 'pulse 1.5s infinite';
    icon.style.border = '3px solid #ff6b6b';
  });
  
  // Показываем подсказку где кликнуть
  const hint = document.createElement('div');
  hint.id = 'status-placement-hint';
  hint.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: #4aa896;
    color: white;
    padding: 15px 20px;
    border-radius: 25px;
    z-index: 5000;
    font-weight: bold;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    animation: bounce 2s infinite;
  `;
  hint.textContent = '👆 Выберите ваш интерес (кофе, прогулка или путешествие)';
  document.body.appendChild(hint);
}

// Функция для перехода на страницу сообщений по кнопке "Написать"
function startChat(userId, userName, userAvatar) {
  console.log('Начинаем чат с пользователем:', userName, 'ID:', userId);
  
  // Переходим на страницу сообщений
  showMessages();
  
  // Добавляем профиль выбранного пользователя в список сообщений
  addUserToMessagesList(userId, userName, userAvatar);
  
  console.log('Переход на страницу сообщений с пользователем:', userName);
}

// Функция для показа чата с выбранным пользователем
function showChat(userId, userName) {
  console.log('Переход в чат с пользователем:', userName, 'ID:', userId);
  
  // Устанавливаем данные текущего чата
  window.currentChatUser = {
    id: userId,
    name: userName
  };
  
  // Обновляем заголовок чата
  const chatUserNameEl = document.getElementById('chatUserName');
  const chatAvatarEl = document.getElementById('chatAvatar');
  
  if (chatUserNameEl) {
    chatUserNameEl.textContent = userName;
  }
  
  // Найдем данные пользователя для аватара
  if (window.allUsersData) {
    const userData = window.allUsersData.find(u => u.user_id === userId || u.id === userId);
    if (userData && chatAvatarEl) {
      chatAvatarEl.src = userData.avatar_url || 'https://via.placeholder.com/40';
    }
  }
  
  // Загружаем сообщения для этого чата
  loadChatMessages();
  
  // Показываем экран чата
  showScreen('chatScreen');
}

// Добавить пользователя в список сообщений
function addUserToMessagesList(userId, userName, userAvatar) {
  // Инициализируем глобальный массив реальных чатов, если его нет
  if (!window.realUserChats) {
    window.realUserChats = [];
  }
  
  // Проверяем, нет ли уже этого пользователя в массиве
  const existingChatIndex = window.realUserChats.findIndex(chat => chat.userId === userId);
  if (existingChatIndex === -1) {
    // Добавляем нового пользователя в массив
    window.realUserChats.unshift({
      userId: userId,
      userName: userName,
      userAvatar: userAvatar,
      addedAt: new Date().toISOString()
    });
    
    // Сохраняем в localStorage для персистентности
    localStorage.setItem('realUserChats', JSON.stringify(window.realUserChats));
    
    console.log('Добавлен новый чат с пользователем:', userName, 'Всего чатов:', window.realUserChats.length);
  } else {
    // Перемещаем существующий чат в начало списка
    const existingChat = window.realUserChats.splice(existingChatIndex, 1)[0];
    window.realUserChats.unshift(existingChat);
    
    // Обновляем localStorage
    localStorage.setItem('realUserChats', JSON.stringify(window.realUserChats));
    
    console.log('Обновлен существующий чат с пользователем:', userName);
  }
  
  // Перезагружаем список сообщений чтобы показать изменения
  loadConfirmedProfiles();
}

// Инициализация реальных чатов из localStorage при загрузке
function initializeRealUserChats() {
  try {
    const savedChats = localStorage.getItem('realUserChats');
    if (savedChats) {
      window.realUserChats = JSON.parse(savedChats);
      console.log('Загружено', window.realUserChats.length, 'сохраненных чатов');
    } else {
      window.realUserChats = [];
    }
  } catch (error) {
    console.error('Ошибка загрузки сохраненных чатов:', error);
    window.realUserChats = [];
  }
}

// Проверка есть ли у пользователя статус
async function checkUserHasStatus(userId) {
  try {
    const response = await fetch(`${window.APP_CONFIG.API_BASE}/api/statuses`);
    const statuses = await response.json();
    
    // Проверяем есть ли статус для этого пользователя
    return statuses.some(status => status.user_id === userId);
  } catch (error) {
    console.error('Ошибка проверки статуса:', error);
    return false;
  }
}

// Функция для создания иконок статусов для маркеров
function getStatusIconMarker(statusType) {
  const iconHtml = {
    'coffee': '☕',
    'walk': '🚶‍♀️',
    'travel': '✈️'
  };
  
  return L.divIcon({
    html: `<div style="
      background: white;
      border: 3px solid #4aa896;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    ">${iconHtml[statusType] || '📍'}</div>`,
    className: 'custom-div-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}

// Load profiles from API
async function loadProfiles() {
  try {
    const response = await fetch(`${window.APP_CONFIG.API_BASE}/api/profiles`);
    const profiles = await response.json();
    console.log('Profiles:', profiles); // Для теста
  } catch (error) {
    console.error('Error loading profiles:', error);
  }
}

// Сохранение статуса в Supabase без аутентификации
async function saveStatusToDatabase(latitude, longitude, statusIcon) {
  try {
    // Получаем user_id из локального профиля
    const profileData = JSON.parse(localStorage.getItem('onparkProfile') || '{}');
    const userId = profileData.user_id;
    
    if (!userId) {
      alert('Сначала создайте профиль');
      return;
    }
    
    const status = {
      user_id: userId,
      latitude: latitude,
      longitude: longitude,
      icon: statusIcon,
      message: getStatusMessage(statusIcon)
    };
    
    console.log('Сохраняем статус на выбранной локации:', status);
    
    // Сохраняем через API (основной способ для консистентности)
    await saveViaAPI(status);
    
    console.log('Status saved successfully!');
    
    // Убираем подсказку о размещении если она есть
    const hint = document.getElementById('status-placement-hint');
    if (hint) {
      document.body.removeChild(hint);
    }
    
    // Убираем анимацию с фильтров
    const filterIcons = document.querySelectorAll('.filter-icon');
    filterIcons.forEach(icon => {
      icon.style.animation = '';
      icon.style.border = '';
    });
    
    // Обновляем карту с новыми статусами быстро
    setTimeout(() => {
      loadStatuses();
    }, 500);
    
  } catch (error) {
    console.error('Error saving status:', error);
    alert('Ошибка при сохранении статуса');
  }
}

// Функция fallback для сохранения через API
async function saveViaAPI(status) {
  const response = await fetch(`${window.APP_CONFIG.API_BASE}/api/statuses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(status)
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('Status saved via API:', data);
  } else {
    throw new Error('API save failed');
  }
}

// Модалка для входа/регистрации
function showAuthModal() {
  const modal = document.createElement('div');
  modal.className = 'auth-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      padding: 30px;
      border-radius: 20px;
      text-align: center;
      max-width: 400px;
      width: 90%;
    ">
      <h2 style="margin: 0 0 20px 0; color: #333;">Вход требуется</h2>
      <p style="margin: 0 0 25px 0; color: #666;">
        Для размещения статуса на карте необходимо войти в аккаунт
      </p>
      
      <input type="email" id="authEmail" placeholder="Ваш email" style="
        width: 100%;
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 10px;
        margin-bottom: 15px;
        font-size: 16px;
        box-sizing: border-box;
      ">
      
      <div style="display: flex; gap: 10px;">
        <button onclick="sendMagicLink()" style="
          flex: 1;
          padding: 12px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          cursor: pointer;
        ">Отправить ссылку</button>
        
        <button onclick="closeAuthModal()" style="
          flex: 1;
          padding: 12px;
          background: #ff5757;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          cursor: pointer;
        ">Отмена</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function closeAuthModal() {
  const modal = document.querySelector('.auth-modal');
  if (modal) {
    document.body.removeChild(modal);
  }
}

async function sendMagicLink() {
  const email = document.getElementById('authEmail').value;
  if (!email) {
    alert('Введите email');
    return;
  }
  
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.href
      }
    });
    
    if (error) {
      alert('Ошибка отправки: ' + error.message);
      return;
    }
    
    alert('Ссылка для входа отправлена на ' + email);
    closeAuthModal();
  } catch (error) {
    console.error('Auth error:', error);
    alert('Ошибка аутентификации');
  }
}

// СТАРАЯ функция: автоматическое получение геолокации (НЕ используется больше)
async function sendStatus() {
  console.log('sendStatus() вызвана, но теперь статус сохраняется только при клике на карту');
}

let currentUserStatus = 'coffee'; // Default user status
let currentFilter = 'all'; // Current filter: 'all', 'coffee', 'walk', 'travel'
let myMarker = null; // User's own marker on map

// Функция для получения сообщения статуса
function getStatusMessage(statusIcon) {
  const statusMessages = {
    'coffee': 'Пью кофе ☕',
    'walk': 'Гуляю 🚶‍♀️', 
    'travel': 'Путешествую ✈️'
  };
  return statusMessages[statusIcon] || 'Активен';
}

// Обновление статуса (для смены типа статуса)
async function updateStatus(newStatusType) {
  const profileData = JSON.parse(localStorage.getItem('onparkProfile') || '{}');
  const userId = profileData.user_id;
  
  if (!userId) {
    alert('Сначала создайте профиль');
    return;
  }
  
  // Только меняем выбранный статус, НЕ сохраняем автоматически
  currentUserStatus = newStatusType;
  updateStatusButtons();
  console.log('Статус изменен на:', newStatusType, '. Теперь кликните на карту для сохранения.');
}

// Обновление внешнего вида кнопок статуса
function updateStatusButtons() {
  const filterButtons = document.querySelectorAll('.filter-icon');
  filterButtons.forEach(button => {
    const filter = button.dataset.filter;
    if (filter === currentUserStatus) {
      button.classList.add('active');
    } else if (filter !== 'all') {
      button.classList.remove('active');
    }
  });
}
let currentLanguage = 'ru'; // Default language
let currentUser = null; // Current user data
let confirmedProfiles = []; // List of confirmed profiles for messaging
let activeConnections = []; // Active connection requests
let allUsersData = []; // Store all users data for access in chat

// Translation dictionary
const translations = {
  ru: {
    'create-connections': 'Создавай связи',
    'make-day-brighter': 'Сделай свой день ярче!',
    'register-btn': 'Регистрация',
    'have-account': 'У вас есть аккаунт:',
    'login-link': 'Войдите',
    'registration-title': 'Регистрация',
    'name-label': 'Отображаемое имя',
    'age-label': 'Возраст',
    'gender-label': 'Пол',
    'male': 'Мужской',
    'female': 'Женский',
    'upload-photo': 'Загрузить фото',
    'continue-btn': 'Продолжить',
    'interests-title': 'Выбери свой интерес',
    'coffee-interest': 'Кофе',
    'walk-interest': 'Прогулки',
    'travel-interest': 'Путешествия',
    'finish-btn': 'Завершить',
    'map-select': 'Выбрать',
    'placement-title': 'Разместить себя на карте',
    'placement-coffee': 'Ищет компанию для кофе ☕',
    'placement-walk': 'Ищет компанию для прогулки 🚶‍♀️',
    'placement-travel': 'Ищет компанию для путешествий ✈️',
    'placement-instruction': 'Нажмите на карту, чтобы указать ваше местоположение и стать видимым для других пользователей.',
    'cancel-btn': 'Отмена',
    'select-place': 'Выбрать место',
    'map-click-instruction': 'Нажмите на карту, чтобы разместить себя',
    'you-here': 'Вы здесь! 👋',
    'placement-success': 'Отлично! Теперь вас видят другие пользователи',
    'profile-btn': '👤 Профиль',
    'join-company': 'Hi! Ready to join u!',
    'anonymous': 'Аноним',
    'show': 'Показать',
    'forgot-password': 'Забыли пароль?',
    'create-profile': 'Создать профиль',
    'select-from-gallery': 'Выбрать из галереи',
    'interests-title': 'Добавить интересы',
    'add-interests': 'Добавить интересы',
    'messages': 'Сообщения',
    'notifications': 'Уведомления',
    'no-confirmed-profiles': 'Нет подтвержденных профилей.',
    'send-request-from-map': 'Отправьте запрос на компанию с карты,',
    'they-will-appear-here': 'и они появятся здесь.',
    'message-placeholder': 'Написать сообщение...',
    'profile': 'Профиль',
    'name': 'Имя',
    'telegram': 'Telegram',
    'age': 'Возраст',
    'interests': 'Интересы',
    'password': 'Пароль'
  },
  en: {
    'create-connections': 'Create Connections',
    'make-day-brighter': 'Make your day brighter!',
    'register-btn': 'Register',
    'have-account': 'Have an account:',
    'login-link': 'Sign In',
    'registration-title': 'Registration',
    'name-label': 'Display Name',
    'age-label': 'Age',
    'gender-label': 'Gender',
    'male': 'Male',
    'female': 'Female',
    'upload-photo': 'Upload Photo',
    'continue-btn': 'Continue',
    'interests-title': 'Choose your interest',
    'coffee-interest': 'Coffee',
    'walk-interest': 'Walking',
    'travel-interest': 'Travel',
    'finish-btn': 'Finish',
    'map-select': 'Select',
    'placement-title': 'Place yourself on the map',
    'placement-coffee': 'Looking for coffee company ☕',
    'placement-walk': 'Looking for walking company 🚶‍♀️',
    'placement-travel': 'Looking for travel company ✈️',
    'placement-instruction': 'Click on the map to indicate your location and become visible to other users.',
    'cancel-btn': 'Cancel',
    'select-place': 'Select Place',
    'map-click-instruction': 'Click on the map to place yourself',
    'you-here': 'You are here! 👋',
    'placement-success': 'Great! Now other users can see you',
    'profile-btn': '👤 Profile',
    'join-company': 'Hi! Ready to join u!',
    'anonymous': 'Anonymous',
    'show': 'Show',
    'forgot-password': 'Forgot password?',
    'create-profile': 'Create Profile',
    'select-from-gallery': 'Select from Gallery',
    'interests-title': 'Add Interests',
    'add-interests': 'Add Interests',
    'messages': 'Messages',
    'notifications': 'Notifications',
    'no-confirmed-profiles': 'No confirmed profiles.',
    'send-request-from-map': 'Send a company request from the map,',
    'they-will-appear-here': 'and they will appear here.',
    'message-placeholder': 'Type a message...',
    'profile': 'Profile',
    'name': 'Name',
    'telegram': 'Telegram',
    'age': 'Age',
    'interests': 'Interests',
    'password': 'Password'
  }
}

function setupUserStatusFilters() {
  const filterIcons = document.querySelectorAll('.filter-icon');
  filterIcons.forEach(filter => {
    filter.addEventListener('click', function() {
      filterIcons.forEach(f => f.classList.remove('active'));
      this.classList.add('active');
      currentUserStatus = this.dataset.filter;
      
      // Show placement dialog
      showPlacementDialog(this.dataset.filter);
    });
  });
}

function showPlacementDialog(status) {
  const placementPopup = document.createElement('div');
  placementPopup.className = 'placement-popup';
  placementPopup.innerHTML = `
    <div class="placement-content">
      <h3>${t('placement-title')}</h3>
      <p>${t('placement-' + status)}</p>
      <p>${t('placement-instruction')}</p>
      <div class="placement-buttons">
        <button class="placement-btn cancel" onclick="cancelPlacement()">${t('cancel-btn')}</button>
        <button class="placement-btn place" onclick="enableMapPlacement('${status}')">${t('select-place')}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(placementPopup);
}

function cancelPlacement() {
  const popup = document.querySelector('.placement-popup');
  if (popup) {
    document.body.removeChild(popup);
  }
}

function enableMapPlacement(status) {
  cancelPlacement();
  
  // Show instruction message
  const instruction = document.createElement('div');
  instruction.className = 'map-instruction';
  instruction.innerHTML = t('map-click-instruction');
  document.body.appendChild(instruction);
  
  // Enable map click
  map.once('click', function(e) {
    placeUserOnMap(e.latlng, status);
    document.body.removeChild(instruction);
  });
}

function placeUserOnMap(latlng, status) {
  // Remove previous marker if exists
  if (myMarker) {
    map.removeLayer(myMarker);
  }
  
  // Create user's marker
  const userIcon = L.divIcon({
    html: `<div style="background: #FF6B6B; color: white; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); animation: pulse 2s infinite;">${getStatusIcon(status)}</div>`,
    iconSize: [45, 45],
    className: 'my-marker'
  });
  
  myMarker = L.marker([latlng.lat, latlng.lng], {icon: userIcon})
    .addTo(map)
    .bindPopup(t('you-here'))
    .openPopup();
    
  // ВАЖНО: Сохраняем статус в базу данных только после клика на карту
  saveStatusToDatabase(latlng.lat, latlng.lng, status);
    
  // Show success message
  showSuccessPlacement(status);
}

function getStatusIcon(status) {
  const icons = {
    coffee: '☕',
    walk: '🚶‍♀️',
    travel: '✈️'
  };
  return icons[status];
}

function showSuccessPlacement(status) {
  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #4CAF50;
    color: white;
    padding: 20px 30px;
    border-radius: 16px;
    font-size: 18px;
    z-index: 10000;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    text-align: center;
  `;
  message.innerHTML = `
    <div style="font-size: 40px; margin-bottom: 10px;">🎉</div>
    <div>${t('placement-success')}</div>
  `;
  
  document.body.appendChild(message);
  
  setTimeout(() => {
    document.body.removeChild(message);
  }, 3000);
}

function showStatusMessage(status) {
  const messages = {
    coffee: 'Вы ищете компанию для кофе ☕',
    walk: 'Вы ищете компанию для прогулки 🚶‍♀️',
    travel: 'Вы ищете компанию для путешествий ✈️'
  };
  
  // Create temporary message
  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #5CBAA8;
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-size: 16px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  message.textContent = messages[status];
  
  document.body.appendChild(message);
  
  setTimeout(() => {
    document.body.removeChild(message);
  }, 2000);
}

function centerOnUser() {
  // Center on Almaty
  map.setView([43.2220, 76.8512], 15);
}

async function addActiveUsers() {
  // Всегда используем фейковых пользователей для демо
  const mockUsers = getMockUsers();
  
  // Добавляем реальных пользователей если есть
  try {
    // Получаем статусы с координатами
    const statusResponse = await fetch(`${window.APP_CONFIG.API_BASE}/api/statuses`);
    const profilesResponse = await fetch(`${window.APP_CONFIG.API_BASE}/api/profiles`);
    
    if (statusResponse.ok && profilesResponse.ok) {
      const statuses = await statusResponse.json();
      const profiles = await profilesResponse.json();
      
      console.log('Loaded statuses:', statuses);
      console.log('Loaded profiles:', profiles);
      
      // Объединяем фейковых и реальных пользователей
      const allUsers = [...mockUsers];
      
      // Создаем карту профилей для быстрого поиска
      const profileMap = {};
      profiles.forEach(profile => {
        profileMap[profile.user_id] = profile;
      });
      
      // Добавляем реальных пользователей по статусам с координатами
      if (Array.isArray(statuses)) {
        statuses.forEach(status => {
          if (status.latitude && status.longitude && status.user_id) {
            const profile = profileMap[status.user_id];
            if (profile) {
              allUsers.push({
                id: `real-${status.user_id}`,
                lat: status.latitude,
                lng: status.longitude,
                display_name: profile.display_name || profile.name,
                age: profile.age,
                status: status.icon || 'coffee',
                interests: profile.interests ? profile.interests.split(',') : [],
                avatar_url: profile.avatar_url,
                telegram: profile.telegram
              });
            }
          }
        });
      }
      
      allUsersData = allUsers;
    } else {
      allUsersData = mockUsers;
    }
  } catch (error) {
    console.error('Error loading real profiles:', error);
    allUsersData = mockUsers;
  }
  
  // Отображаем всех пользователей
  displayFilteredUsers(allUsersData);
}

function getMockUsers() {
  return [
        {
          id: 'onpark-admin',
          lat: 43.2220, lng: 76.8510,
          display_name: 'OnPark Поддержка', age: 25, status: 'coffee',
          interests: ['помощь туристам и пользователям', 'тех поддержка', 'развитие онлайн парка'],
          avatar_url: '🎯',
          isAdmin: true,
          telegram: 'onpark.me@gmail.com',
          description: 'Ваш гид в onpark поможет найти попутчиков на каждый день;рада помочь вам.пишите на почту свои вопросы и предпочтения'
        },
        {
          id: 'user-1',
          lat: 43.2190, lng: 76.8480,  // Stefan - левее и ниже
          display_name: 'Stefan', age: 36, status: 'coffee',
          interests: ['hiking', 'co-travel'],
          avatar_url: 'attached_assets/Stefan-min_1756533746271.png'
        },
        {
          id: 'user-2',
          lat: 43.2250, lng: 76.8550,  // Asem - правее и выше
          display_name: 'Asem', age: 29, status: 'coffee',
          interests: ['coffee', 'photography'],
          avatar_url: 'attached_assets/Asem.png'
        },
        {
          id: 'user-3',
          lat: 43.2490, lng: 76.9150,  // Alice - пересечение Абая + Сейфуллина
          display_name: 'Alice', age: 27, status: 'walk',
          interests: ['walking', 'nature'],
          avatar_url: 'attached_assets/Alice .png'
        },
        {
          id: 'user-4',
          lat: 43.2510, lng: 76.9010,  // Sasha - пересечение Толе би + Калдаякова  
          display_name: 'Sasha', age: 40, status: 'travel',
          interests: ['business', 'travel'],
          avatar_url: 'attached_assets/Sasha.jpg'
        }
      ];
}

// Display users based on current filter
function displayFilteredUsers(users) {
  // Clear existing markers
  if (markersLayer) {
    markersLayer.clearLayers();
  }
  
  // Always show OnPark admin and all fake profiles regardless of filter
  const fakeProfiles = users.filter(user => ['onpark-admin', 'user-1', 'user-2', 'user-3', 'user-4'].includes(user.id));
  
  // Filter other users based on current filter
  const otherUsers = users.filter(user => !['onpark-admin', 'user-1', 'user-2', 'user-3', 'user-4'].includes(user.id));
  const filteredOtherUsers = currentFilter === 'all' 
    ? otherUsers 
    : otherUsers.filter(user => user.status === currentFilter);
  
  // Combine fake profiles (always visible) with filtered other users
  const allVisibleUsers = [...fakeProfiles, ...filteredOtherUsers];
  
  // Add markers for all visible users
  allVisibleUsers.forEach(user => {
    const icon = getUserIcon(user.status || 'coffee', user);
    const marker = L.marker([user.lat, user.lng], {icon: icon})
      .addTo(markersLayer);
      
    marker.on('click', function() {
      showUserProfile(user);
    });
  });
}

// Update map filter
function updateMapFilter(filter) {
  currentFilter = filter;
  
  // Update filter button states
  document.querySelectorAll('.filter-icon').forEach(btn => {
    btn.classList.remove('active');
  });
  const filterBtn = document.querySelector(`[data-filter="${filter}"]`);
  if (filterBtn) {
    filterBtn.classList.add('active');
  }
  
  // Re-display users with new filter
  displayFilteredUsers(allUsersData);
}

function showMessages() {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  // Show messages screen
  document.getElementById('messagesScreen').classList.add('active');
  
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Load confirmed profiles
  loadConfirmedProfiles();
}

function loadConfirmedProfiles() {
  const messagesList = document.getElementById('messagesList');
  
  // Получаем реальных пользователей из localStorage или глобальной переменной
  const realChats = window.realUserChats || [];
  const totalChats = confirmedProfiles.length + realChats.length;
  
  if (totalChats === 0) {
    messagesList.innerHTML = `
      <div class="empty-messages">
        <div class="empty-messages-icon">💬</div>
        <div class="empty-messages-text">
          ${t('no-confirmed-profiles')}<br>
          ${t('send-request-from-map')}<br>
          ${t('they-will-appear-here')}
        </div>
      </div>
    `;
    return;
  }
  
  messagesList.innerHTML = '';
  
  // Сначала добавляем реальных пользователей
  realChats.forEach(chat => {
    const messageItem = document.createElement('div');
    messageItem.className = 'message-item';
    messageItem.setAttribute('data-user-id', chat.userId);
    messageItem.onclick = () => showChat(chat.userId, chat.userName);
    
    const avatarContent = chat.userAvatar && chat.userAvatar.trim()
      ? `<img src="${chat.userAvatar}" alt="${chat.userName}" class="message-avatar" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" />`
      : `<div class="message-avatar" style="width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #f0f0f0; font-size: 20px;">👤</div>`;
    
    messageItem.innerHTML = `
      ${avatarContent}
      <div class="message-info">
        <div class="message-name">${chat.userName}</div>
        <div class="message-preview">Нажмите для начала чата</div>
      </div>
      <div class="message-time">Новый</div>
    `;
    
    messagesList.appendChild(messageItem);
  });
  
  // Затем добавляем фейковых пользователей
  confirmedProfiles.forEach(profile => {
    const messageItem = document.createElement('div');
    messageItem.className = 'message-item';
    messageItem.onclick = () => openIndividualChat(profile);
    
    // Исправляем отображение аватарки - берем правильную из профиля
    const avatarContent = profile.avatar_url && profile.avatar_url.includes('attached_assets')
      ? `<img src="${profile.avatar_url}" alt="${profile.display_name}" class="message-avatar" />`
      : `<div class="message-avatar" style="display: flex; align-items: center; justify-content: center; background: #f0f0f0; font-size: 20px;">${profile.avatar_url || '👤'}</div>`;
    
    messageItem.innerHTML = `
      ${avatarContent}
      <div class="message-info">
        <div class="message-name">${profile.display_name}, ${profile.age}</div>
        <div class="message-preview">Hi! Ready to join u!</div>
      </div>
      <div class="message-time">${formatTime(profile.confirmDate)}</div>
    `;
    
    messagesList.appendChild(messageItem);
  });
}

function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'сейчас';
  } else if (diffInHours < 24) {
    return `${diffInHours}ч назад`;
  } else {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }
}

function openChat(userId, userName) {
  if (typeof userId === 'object') {
    // Called from messages screen with profile object
    const profile = userId;
    showMessages();
    return;
  }
  
  // Called from notifications - remove from pending and show messages
  pendingConnections = pendingConnections.filter(c => c.from_user !== userId);
  renderNotifications();
  showMessages();
}

function addMockUsers() {
  const activeUsers = [
    {
      id: 'user-1',
      lat: 43.2380, lng: 76.8520,
      display_name: 'Айгуль', age: 24, status: 'coffee',
      interests: ['coffee', 'networking'],
      avatar_url: '👩‍💼'
    },
    {
      id: 'user-2',
      lat: 43.2200, lng: 76.8490,
      display_name: 'Stefan', age: 36, status: 'coffee',
      interests: ['hiking', 'co-travel'],
      avatar_url: 'attached_assets/Stefan-min_1756533746271.png'
    },
    {
      id: 'user-3',
      lat: 43.2385, lng: 76.8525,
      display_name: 'Асем', age: 29, status: 'coffee',
      interests: ['coffee', 'photography'],
      avatar_url: 'attached_assets/Asem.png'
    },
    {
      id: 'user-4',
      lat: 43.2382, lng: 76.8522,
      display_name: 'Нурлан', age: 30, status: 'travel',
      interests: ['travel', 'adventure'],
      avatar_url: '👨‍🔬'
    },
    {
      id: 'user-5',
      lat: 43.2300, lng: 76.8600,
      display_name: 'Алиса', age: 27, status: 'walk',
      interests: ['walking', 'nature'],
      avatar_url: 'attached_assets/Alice .png'
    },
    {
      id: 'user-6',
      lat: 43.2380, lng: 76.9080,
      display_name: 'Саша', age: 40, status: 'coffee',
      interests: ['business', 'events'],
      avatar_url: 'attached_assets/Sasha.jpg'
    }
  ];
  
  // Store users data globally  
  allUsersData = activeUsers;
  
  activeUsers.forEach(user => {
    const icon = getUserIcon(user.status, user);
    const marker = L.marker([user.lat, user.lng], {icon: icon})
      .addTo(markersLayer);
      
    marker.on('click', function() {
      showUserProfile(user);
    });
  });
}

function getUserIcon(status, user = null) {
  // Всегда показываем статусы как иконки, независимо от наличия фото
  const icons = {
    coffee: '☕',
    walk: '🚶‍♀️',
    travel: '✈️'
  };
  
  const iconEmoji = icons[status] || '☕'; // По умолчанию кофе
  
  return L.divIcon({
    html: `<div style="background: white; color: #333; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; border: 3px solid #5CBAA8; box-shadow: 0 3px 10px rgba(0,0,0,0.3); cursor: pointer;">${iconEmoji}</div>`,
    iconSize: [45, 45],
    className: 'user-marker'
  });
}

function showUserProfile(user) {
  const profilePopup = document.createElement('div');
  profilePopup.className = 'user-profile-popup';
  
  const interests = Array.isArray(user.interests) ? user.interests.join(', ') : user.interests || 'Не указано';
  
  // Check if user has a real photo or emoji avatar
  const isPhoto = user.avatar_url && user.avatar_url.includes('attached_assets');
  const avatarContent = isPhoto 
    ? `<img src="${user.avatar_url}" alt="${user.display_name}" class="profile-photo" />` 
    : `<span class="profile-emoji">${user.avatar_url || user.avatar || '👤'}</span>`;
  
  // Специальное описание для OnPark поддержки
  const aboutText = user.description || 'Активный пользователь OnPark';
  
  // Специальная кнопка для OnPark поддержки
  const actionButton = user.isAdmin
    ? `<button class="action-btn join-btn admin-btn" onclick="joinCompany('${user.id}', '${user.display_name || user.name}')">
         💬 Связаться с поддержкой
       </button>`
    : `<button class="action-btn join-btn" onclick="joinCompany('${user.id}', '${user.display_name || user.name}')">
         ${t('join-company')}
       </button>`;

  profilePopup.innerHTML = `
    <div class="profile-popup-content">
      <div class="profile-header">
        <div class="profile-avatar">${avatarContent}</div>
        <div class="profile-info">
          <h3>${user.display_name || user.name}, ${user.age}</h3>
          <p class="profile-status">${getStatusText(user.status)}</p>
          ${user.telegram ? `<p class="telegram-contact">📧 ${user.telegram}</p>` : ''}
        </div>
        <button class="close-profile" onclick="closeUserProfile()">×</button>
      </div>
      <div class="profile-bio">
        <p><strong>Интересы:</strong> ${interests}</p>
        <p><strong>О себе:</strong> ${aboutText}</p>
      </div>
      <div class="profile-actions">
        ${actionButton}
      </div>
    </div>
  `;
  
  document.body.appendChild(profilePopup);
}

function getStatusText(status) {
  const texts = {
    coffee: 'Ищет компанию для кофе ☕',
    walk: 'Ищет компанию для прогулки 🚶‍♀️',
    travel: 'Ищет компанию для путешествий ✈️'
  };
  return texts[status];
}

function closeUserProfile() {
  const popup = document.querySelector('.user-profile-popup');
  if (popup) {
    document.body.removeChild(popup);
  }
}

async function viewFullProfile(userId) {
  try {
    // Try to get full profile from Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      alert('Профиль недоступен');
      return;
    }
    
    closeUserProfile();
    
    // Show full profile modal
    const fullProfilePopup = document.createElement('div');
    fullProfilePopup.className = 'user-profile-popup';
    
    // Check if profile has a real photo or emoji avatar
    const isPhoto = profile.avatar_url && profile.avatar_url.includes('attached_assets');
    const avatarContent = isPhoto 
      ? `<img src="${profile.avatar_url}" alt="${profile.display_name}" class="profile-photo" />` 
      : `<span class="profile-emoji">${profile.avatar_url || '👤'}</span>`;
    
    fullProfilePopup.innerHTML = `
      <div class="profile-popup-content">
        <div class="profile-header">
          <div class="profile-avatar">${avatarContent}</div>
          <div class="profile-info">
            <h3>${profile.display_name}, ${profile.age}</h3>
            <p class="profile-status">${getStatusText(profile.status)}</p>
          </div>
          <button class="close-profile" onclick="closeUserProfile()">×</button>
        </div>
        <div class="profile-bio">
          <p><strong>Интересы:</strong> ${Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.interests || 'Не указано'}</p>
          <p><strong>О себе:</strong> Активный пользователь OnPark</p>
        </div>
        <div class="profile-actions">
          <button class="action-btn join-btn" onclick="joinCompany('${profile.id}', '${profile.display_name}')">
            ${t('join-company')}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(fullProfilePopup);
    
  } catch (error) {
    console.error('Error loading profile:', error);
    alert('Ошибка загрузки профиля');
  }
}

async function joinCompany(userId, userName) {
  try {
    closeUserProfile();
    
    // Специальная обработка для OnPark поддержки
    if (userId === 'onpark-admin') {
      // Прямое подключение к техническому лицу
      createOnParkAdminConnection(userId, userName);
      return;
    }
    
    // Check if connection already exists
    const { data: existingConnection, error: checkError } = await supabase
      .from('connections')
      .select('*')
      .eq('from_user_id', currentUser.id)
      .eq('to_user_id', userId)
      .single();
    
    if (existingConnection) {
      alert('Запрос уже отправлен!');
      return;
    }
    
    // Create new connection request
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .insert([
        {
          from_user_id: currentUser.id,
          to_user_id: userId,
          status: 'pending'
        }
      ])
      .select()
      .single();
    
    if (connectionError) {
      console.error('Connection error:', connectionError);
      // Fallback for demo
      createMockConnection(userId, userName);
      return;
    }
    
    // Add to active connections
    activeConnections.push({
      id: connection.id,
      to_user_id: userId,
      to_user_name: userName,
      status: 'pending'
    });
    
    // Send initial message
    await sendInitialMessage(userId, userName);
    
    // Show success and enable chat
    showConnectionSuccess(userName);
    
  } catch (error) {
    console.error('Error creating connection:', error);
    createMockConnection(userId, userName);
  }
}

function createOnParkAdminConnection(userId, userName) {
  // Добавляем OnPark поддержку в подтвержденные профили
  const adminUser = allUsersData.find(u => u.id === userId);
  if (adminUser && !confirmedProfiles.find(profile => profile.id === userId)) {
    confirmedProfiles.push({
      ...adminUser,
      confirmDate: new Date().toISOString(),
      chatEnabled: true
    });
  }
  
  // Показываем успешное подключение
  showConnectionSuccess(userName);
  
  // Автоматически включаем чат
  const chatBtn = document.querySelector('#chatBtn');
  if (chatBtn) {
    chatBtn.style.background = '#4CAF50';
    chatBtn.style.color = 'white';
    chatBtn.style.transform = 'scale(1.1)';
    chatBtn.onclick = () => showMessages();
  }
  
  // Добавляем приветственное сообщение от OnPark поддержки
  setTimeout(() => {
    if (!chatMessages.find(msg => msg.from_user_id === 'onpark-admin')) {
      chatMessages.push({
        id: Date.now(),
        from_user_id: 'onpark-admin',
        to_user_id: currentUser.id,
        message: 'Привет! Добро пожаловать в OnPark! 🎯 Я здесь чтобы помочь вам знакомиться и находить интересных людей поблизости. Задавайте любые вопросы!',
        created_at: new Date().toISOString()
      });
    }
  }, 1000);
}

function createMockConnection(userId, userName) {
  // Add user to confirmed profiles list
  const user = allUsersData.find(u => u.id === userId);
  if (user && !confirmedProfiles.find(profile => profile.id === userId)) {
    confirmedProfiles.push({
      ...user,
      confirmDate: new Date().toISOString()
    });
    console.log('Profile added to confirmed list:', user.display_name);
  }
  
  showMessage('sent');
  console.log(`Request sent to ${userName}: Hi! Ready to join u!`);
}

async function sendInitialMessage(userId, userName) {
  try {
    const initialMessage = currentLanguage === 'en' 
      ? 'Hi! I want to join your company!' 
      : 'Привет! Я хочу составить компанию!';
    
    const { data: message, error } = await supabase
      .from('messages')
      .insert([
        {
          from_user_id: currentUser.id,
          to_user_id: userId,
          message: initialMessage
        }
      ]);
    
    if (error) {
      console.error('Message error:', error);
    }
    
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

function sendMockInitialMessage(userId, userName) {
  // Mock message for demo
  console.log(`Mock message sent to ${userName}: Привет! Я хочу составить компанию!`);
}

function showConnectionSuccess(userName) {
  // Show success message
  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #4CAF50;
    color: white;
    padding: 20px 30px;
    border-radius: 16px;
    font-size: 18px;
    z-index: 10000;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    text-align: center;
  `;
  
  const successText = currentLanguage === 'en' 
    ? `Request sent to ${userName}!`
    : `Запрос отправлен ${userName}!`;
  
  message.innerHTML = `
    <div style="font-size: 40px; margin-bottom: 10px;">🤝</div>
    <div>${successText}</div>
  `;
  
  document.body.appendChild(message);
  
  setTimeout(() => {
    document.body.removeChild(message);
  }, 3000);
  
  // Enable chat icon
  enableChatIcon();
}

function enableChatIcon() {
  // Update chat icon to show active state
  const chatBtn = document.querySelector('#chatBtn');
  if (chatBtn) {
    chatBtn.style.background = '#4CAF50';
    chatBtn.style.color = 'white';
    chatBtn.style.transform = 'scale(1.1)';
    chatBtn.onclick = openChat;
  }
}

// Chat System
let currentChatUser = null;
let chatMessages = [];
let pendingConnections = []; // Store pending connection requests

// Mock pending connections for demo
function initializePendingConnections() {
  pendingConnections = [
    {
      id: 'conn-1',
      from_user: 'user-1',
      from_user_name: 'Stefan',
      from_user_avatar: 'attached_assets/Stefan-min_1756533746271.png',
      message: 'Hi! Ready to join u!',
      timestamp: new Date(Date.now() - 300000) // 5 minutes ago
    },
    {
      id: 'conn-2', 
      from_user: 'user-2',
      from_user_name: 'Asem',
      from_user_avatar: 'attached_assets/Asem.png',
      message: 'Hi! Ready to join u!',
      timestamp: new Date(Date.now() - 180000) // 3 minutes ago
    }
  ];
  
  // Call this function automatically
  setTimeout(() => {
    if (pendingConnections.length > 0) {
      console.log('Demo notifications initialized');
    }
  }, 1000);
}

// Initialize demo notifications on page load
setTimeout(initializePendingConnections, 2000);

function openIndividualChat(profile) {
  currentChatUser = profile;
  showScreen('chatScreen');
  
  // Update chat header with user info and photo
  updateChatHeader(profile);
  
  // Load chat messages for this user
  loadChatMessages();
}

function updateChatHeader(profile) {
  const chatUserName = document.getElementById('chatUserName');
  const chatAvatar = document.getElementById('chatAvatar');
  
  if (chatUserName) {
    chatUserName.textContent = `${profile.display_name}, ${profile.age}`;
  }
  
  // Update avatar in chat header with actual image
  if (chatAvatar && profile.avatar_url && profile.avatar_url.includes('attached_assets')) {
    // Replace the span with an img element
    const avatarImg = document.createElement('img');
    avatarImg.id = 'chatAvatar';
    avatarImg.className = 'chat-avatar';
    avatarImg.src = profile.avatar_url;
    avatarImg.style.cssText = 'width: 30px; height: 30px; border-radius: 50%; object-fit: cover;';
    chatAvatar.parentNode.replaceChild(avatarImg, chatAvatar);
  }
}

function openChat() {
  if (activeConnections.length === 0) {
    alert('Нет активных соединений для чата');
    return;
  }
  
  // Use first active connection for demo
  const connection = activeConnections[0];
  currentChatUser = {
    id: connection.to_user,
    name: connection.to_user_name
  };
  
  // Set chat header info
  const chatAvatarEl = document.getElementById('chatAvatar');
  const chatUserNameEl = document.getElementById('chatUserName');
  
  // Find the user data to get avatar
  const userData = allUsersData.find(u => u.id === currentChatUser.id);
  if (userData && userData.avatar_url && userData.avatar_url.includes('attached_assets')) {
    chatAvatarEl.innerHTML = `<img src="${userData.avatar_url}" alt="${currentChatUser.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
  } else {
    chatAvatarEl.textContent = '👤';
  }
  
  chatUserNameEl.textContent = currentChatUser.name;
  
  // Load existing messages
  loadChatMessages();
  
  // Show chat screen
  showScreen('chatScreen');
}

async function loadChatMessages() {
  try {
    // Используем API вместо прямого Supabase
    const response = await fetch(`${window.APP_CONFIG.API_BASE}/api/messages?user1=${currentUser.id}&user2=${currentChatUser.id}`);
    const messages = await response.json();
    
    if (response.ok) {
      chatMessages = messages || [];
      console.log('Loaded real messages:', chatMessages);
    } else {
      console.error('Error loading messages:', messages.error);
      // Use mock messages for demo
      loadMockMessages();
      return;
    }
    
    chatMessages = messages;
    renderChatMessages();
    
  } catch (error) {
    console.error('Error loading messages:', error);
    loadMockMessages();
  }
}

function loadMockMessages() {
  // Start with only the initial message from the other user
  chatMessages = [
    {
      id: 1,
      from_user_id: currentChatUser.id,
      to_user_id: currentUser.id,
      message: 'Hi! im ready to join u!',
      created_at: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
    }
  ];
  renderChatMessages();
}

function renderChatMessages() {
  const chatContainer = document.getElementById('chatMessages');
  chatContainer.innerHTML = '';
  
  chatMessages.forEach(msg => {
    const messageDiv = document.createElement('div');
    messageDiv.className = msg.from_user_id === currentUser.id ? 'message sent' : 'message received';
    
    const time = new Date(msg.created_at).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
      <div class="message-bubble">${msg.message}</div>
      <div class="message-time">${time}</div>
    `;
    
    chatContainer.appendChild(messageDiv);
  });
  
  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('messageInput');
  const messageText = input.value.trim();
  
  if (!messageText) return;
  
  // Clear input
  input.value = '';
  
  try {
    // Отправляем через API
    const response = await fetch(`${window.APP_CONFIG.API_BASE}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fromUserId: currentUser.id,
        toUserId: currentChatUser.id,
        message: messageText
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Добавляем сообщение в локальный массив
      const message = {
        from_user_id: currentUser.id,
        to_user_id: currentChatUser.id,
        message: messageText,
        created_at: new Date().toISOString()
      };
      
      chatMessages.push(message);
      renderChatMessages();
      
      // Simulate response after a delay
      setTimeout(() => {
        simulateResponse();
      }, 2000);
    } else {
      console.error('Error sending message:', result.error);
      // Fallback to mock message
      addMockMessage(messageText);
    }
    
  } catch (error) {
    console.error('Error sending message:', error);
    addMockMessage(messageText);
  }
}

function addMockMessage(messageText) {
  const mockMessage = {
    id: Date.now(),
    from_user_id: currentUser.id,
    to_user_id: currentChatUser.id,
    message: messageText,
    created_at: new Date().toISOString()
  };
  
  chatMessages.push(mockMessage);
  renderChatMessages();
  
  // Simulate response
  setTimeout(() => {
    simulateResponse();
  }, 2000);
}

function simulateResponse() {
  const responses = [
    'Отлично! Где встретимся?',
    'Согласен! Когда удобно?',
    'Хорошая идея! Я готов.',
    'Звучит здорово! Жду встречи.',
    'Давайте обсудим детали!'
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  const responseMessage = {
    id: Date.now() + 1,
    from_user_id: currentChatUser.id,
    to_user_id: currentUser.id,
    message: randomResponse,
    created_at: new Date().toISOString()
  };
  
  chatMessages.push(responseMessage);
  renderChatMessages();
}

// Notifications System
function showNotifications() {
  showScreen('notificationsScreen');
  renderNotifications();
}

function renderNotifications() {
  const container = document.getElementById('notificationsContent');
  container.innerHTML = '';
  
  if (pendingConnections.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <div style="font-size: 50px; margin-bottom: 20px;">📭</div>
        <p>Пока нет уведомлений</p>
      </div>
    `;
    return;
  }
  
  pendingConnections.forEach(connection => {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification-item';
    notificationDiv.innerHTML = `
      <div class="notification-avatar">
        <img src="${connection.from_user_avatar}" alt="${connection.from_user_name}" />
      </div>
      <div class="notification-info">
        <button class="profile-btn-small" onclick="viewUserProfile('${connection.from_user}')">profile</button>
        <div class="notification-message">${connection.message}</div>
        <div class="notification-actions">
          <button class="notification-btn accept-btn" onclick="acceptConnection('${connection.id}')">
            ✓
          </button>
          <button class="notification-btn reject-btn" onclick="rejectConnection('${connection.id}')">
            ✗
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(notificationDiv);
  });
}

function acceptConnection(connectionId) {
  const connection = pendingConnections.find(c => c.id === connectionId);
  if (!connection) return;
  
  // Find user data
  const user = allUsersData.find(u => u.id === connection.from_user);
  if (user) {
    // Add to confirmed profiles for messages
    if (!confirmedProfiles.find(profile => profile.id === user.id)) {
      confirmedProfiles.push({
        ...user,
        confirmDate: new Date().toISOString(),
        chatEnabled: true
      });
    }
  }
  
  // Remove from pending connections (buttons disappear for 24 hours)
  pendingConnections = pendingConnections.filter(c => c.id !== connectionId);
  
  // Re-render notifications
  renderNotifications();
  
  // Show success message and redirect to messages
  showConnectionAccepted(connection.from_user_name);
  
  // Auto-redirect to messages after 2 seconds
  setTimeout(() => {
    showMessages();
  }, 2000);
}

function rejectConnection(connectionId) {
  // Remove from pending
  pendingConnections = pendingConnections.filter(c => c.id !== connectionId);
  
  // Re-render notifications
  renderNotifications();
}

function showConnectionAccepted(userName) {
  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #4CAF50;
    color: white;
    padding: 20px 30px;
    border-radius: 16px;
    font-size: 18px;
    z-index: 10000;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    text-align: center;
  `;
  
  message.innerHTML = `
    <div style="font-size: 40px; margin-bottom: 10px;">🤝</div>
    <div>Соединение с ${userName} принято!</div>
  `;
  
  document.body.appendChild(message);
  
  setTimeout(() => {
    document.body.removeChild(message);
  }, 3000);
}

function viewUserProfile(userId) {
  // Map user IDs to their specific profile screens
  const profileScreens = {
    'user-2': 'stefanProfileScreen',     // Stefan
    'user-5': 'aliceProfileScreen',      // Алиса
    'user-3': 'asemProfileScreen',       // Асем
    'user-4': 'sashaProfileScreen'       // Саша
  };
  
  const screenId = profileScreens[userId];
  if (screenId) {
    showScreen(screenId);
  } else {
    // Fallback to regular profile popup
    const user = allUsersData.find(u => u.id === userId);
    if (user) {
      showUserProfile(user);
    }
  }
}

function openChatFromNotifications() {
  if (activeConnections.length === 0) {
    alert('Нет активных соединений для чата');
    return;
  }
  
  openChat();
}

// Allow sending message with Enter key
document.addEventListener('DOMContentLoaded', function() {
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
  
  // Set up messages button in notifications
  const messagesBtn = document.getElementById('messagesBtn');
  if (messagesBtn) {
    messagesBtn.onclick = openChatFromNotifications;
  }
  
  // Set up send status button (now the "Открыть" filter button)
  const sendButton = document.getElementById('sendButton');
  if (sendButton) {
    sendButton.addEventListener('click', sendStatus);
  }
  
  // Настройка обработчиков кнопок статуса
  const filterButtons = document.querySelectorAll('.filter-icon');
  filterButtons.forEach(button => {
    const filter = button.dataset.filter;
    if (filter !== 'all') {
      button.addEventListener('click', function() {
        // Если у пользователя уже есть статус, обновляем его
        const profileData = JSON.parse(localStorage.getItem('onparkProfile') || '{}');
        if (profileData.user_id) {
          updateStatus(filter);
        } else {
          // Если профиля нет, просто меняем выбранный статус
          currentUserStatus = filter;
          updateStatusButtons();
        }
      });
    }
  });
  
  // Инициализируем внешний вид кнопок
  updateStatusButtons();
});

function showSuccessMessage() {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '<div class="success-message">Успешно!<br>Мы вам отправляем ссылку, ожидайте.</div>';
}

function showPhotoSuccess() {
  const photoActions = document.querySelector('.photo-actions');
  photoActions.innerHTML = `
    <div style="text-align: center; color: #007AFF; font-weight: 600; margin-bottom: 16px;">
      Фото успешно загружено
    </div>
    <button class="photo-btn" onclick="selectPhoto()">Изменить фото</button>
    <button class="primary-btn" onclick="showInterests()">Дальше</button>
  `;
}

// Upload photo to Object Storage
async function uploadPhotoToObjectStorage(file) {
  try {
    // Получаем presigned URL для загрузки
    const response = await fetch(`${window.APP_CONFIG.API_BASE}/api/objects/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const { uploadURL } = await response.json();
    
    // Загружаем файл через presigned URL
    const uploadResponse = await fetch(uploadURL, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });
    
    if (uploadResponse.ok) {
      // Формируем URL для доступа к загруженному файлу
      const fileName = uploadURL.split('/').pop().split('?')[0];
      const avatarUrl = `/objects/uploads/${fileName}`;
      console.log('Photo uploaded to Object Storage:', avatarUrl);
      return avatarUrl;
    } else {
      console.error('Failed to upload photo to Object Storage');
      return null;
    }
  } catch (error) {
    console.error('Error uploading to Object Storage:', error);
    return null;
  }
}

function loadProfileData() {
  const savedData = localStorage.getItem('onparkProfile');
  if (savedData) {
    const profile = JSON.parse(savedData);
    
    // Update profile screen
    const profileName = document.getElementById('profileName');
    const profileAge = document.getElementById('profileAge');
    const profileInterests = document.getElementById('profileInterests');
    const profileImage = document.getElementById('profileImage');
    
    if (profileName) profileName.textContent = profile.display_name || profile.name || 'Ая';
    if (profileAge) profileAge.textContent = profile.age || '32';
    
    // Показать email если есть
    const profileEmail = document.getElementById('profileEmail');
    if (profileEmail) profileEmail.textContent = profile.email || 'Не указан';
    
    // Показать реальный пароль пользователя
    const profilePassword = document.getElementById('profilePassword');
    if (profilePassword) profilePassword.textContent = profile.password || '2025AyaS';
    
    // Load uploaded photo if available
    if (profileImage && profile.avatar_url) {
      console.log('Setting profile image:', profile.avatar_url);
      profileImage.src = profile.avatar_url;
      profileImage.onerror = function() {
        console.error('Failed to load profile image:', profile.avatar_url);
      };
      profileImage.onload = function() {
        console.log('Profile image loaded successfully:', profile.avatar_url);
      };
    } else {
      console.log('No profile image to load. profileImage element:', !!profileImage, 'avatar_url:', profile.avatar_url);
    }
    
    if (selectedInterests.length > 0) {
      if (profileInterests) profileInterests.textContent = selectedInterests.join(' ');
    } else if (profile.interests) {
      if (profileInterests) profileInterests.textContent = Array.isArray(profile.interests) ? profile.interests.join(' ') : profile.interests;
    }
  }
}

// Auto-save interests when changed
setInterval(() => {
  const savedData = localStorage.getItem('onparkProfile');
  if (savedData && selectedInterests.length > 0) {
    const profile = JSON.parse(savedData);
    profile.interests = selectedInterests;
    localStorage.setItem('onparkProfile', JSON.stringify(profile));
    loadProfileData();
  }
}, 1000);

// Функция для показа экрана входа
function showLoginScreen() {
  showScreen('loginScreen');
}

// Функция для показа экрана восстановления пароля
function showForgotPassword() {
  showScreen('forgotPasswordScreen');
}

// Функция для показа экрана восстановления пароля с нового экрана
function showForgotPasswordScreen() {
  showScreen('forgotPasswordScreen');
}

// Функция для переключения видимости пароля
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const button = input.nextElementSibling;
  
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = 'Hide';
  } else {
    input.type = 'password';
    button.textContent = 'Show';
  }
}

// Обработчик формы входа
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      
      if (!email || !password) {
        alert('Пожалуйста, заполните все поля');
        return;
      }
      
      await loginUser(email, password);
    });
  }
});

// Функция входа существующего пользователя из главной формы
async function loginExistingUser(email, password) {
  try {
    const response = await fetch(`${window.APP_CONFIG.API_BASE}/api/profiles?email=${encodeURIComponent(email)}`);
    
    if (response.ok) {
      const userData = await response.json();
      
      if (userData.password === password) {
        // Успешный вход
        const profileData = {
          user_id: userData.user_id,
          display_name: userData.display_name,
          name: userData.display_name,
          email: userData.email,
          password: userData.password,
          age: userData.age,
          avatar_url: userData.avatar_url,
          interests: userData.interests || ''
        };
        localStorage.setItem('onparkProfile', JSON.stringify(profileData));
        
        console.log('Successful login for existing user:', userData.display_name);
        showMap(); // Переходим на карту
      } else {
        alert('Неверный пароль');
      }
    } else {
      alert('Пользователь с таким email не найден. Пожалуйста, заполните имя для создания нового профиля.');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Ошибка входа');
  }
}

// Функция входа пользователя
async function loginUser(email, password) {
  try {
    const response = await fetch(`${window.APP_CONFIG.API_BASE}/api/profiles?email=${encodeURIComponent(email)}`);
    
    if (response.ok) {
      const userData = await response.json();
      
      if (userData.password === password) {
        // Успешный вход
        const profileData = {
          user_id: userData.user_id,
          display_name: userData.display_name,
          name: userData.display_name,
          email: userData.email,
          password: userData.password,
          age: userData.age,
          avatar_url: userData.avatar_url,
          interests: userData.interests || ''
        };
        localStorage.setItem('onparkProfile', JSON.stringify(profileData));
        
        console.log('Successful login for user:', userData.display_name);
        showMap(); // Переходим на карту
      } else {
        alert('Неверный пароль');
      }
    } else {
      alert('Пользователь с таким email не найден');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Ошибка входа');
  }
}

// Обработчик формы восстановления пароля
document.addEventListener('DOMContentLoaded', function() {
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('recoveryEmail').value;
      
      if (!email) {
        alert('Пожалуйста, введите email');
        return;
      }
      
      // Ищем пользователя по email в Supabase
      searchUserByEmail(email);
    });
  }
});

// Функция поиска пользователя по email
async function searchUserByEmail(email) {
  try {
    const response = await fetch(`${window.APP_CONFIG.API_BASE}/api/profiles?email=${encodeURIComponent(email)}`);
    
    if (response.ok) {
      const userData = await response.json();
      
      // Показываем пароль пользователя
      showPasswordRecovery(userData.display_name, userData.password);
      
      // Также сохраняем данные для автоматического входа
      const profileData = {
        user_id: userData.user_id,
        display_name: userData.display_name,
        name: userData.display_name,
        email: userData.email,
        password: userData.password,
        age: userData.age,
        avatar_url: userData.avatar_url,
        interests: userData.interests || ''
      };
      localStorage.setItem('onparkProfile', JSON.stringify(profileData));
      
    } else {
      alert('Пользователь с таким email не найден');
    }
  } catch (error) {
    console.error('Error searching user:', error);
    alert('Ошибка поиска пользователя');
  }
}

// Функция показа восстановленного пароля
function showPasswordRecovery(displayName, password) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 2px solid #4CAF50;
    color: black;
    padding: 30px;
    border-radius: 16px;
    font-size: 16px;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    text-align: center;
    max-width: 300px;
  `;
  notification.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #4CAF50;">Пароль найден!</h3>
    <p style="margin: 0 0 10px 0;"><strong>Пользователь:</strong> ${displayName}</p>
    <p style="margin: 0 0 20px 0;"><strong>Пароль:</strong> ${password}</p>
    <button onclick="this.parentElement.remove(); showMap();" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Войти</button>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 10000);
}

// Функция показа уведомления о восстановлении пароля
function showRecoveryNotification() {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #4CAF50;
    color: white;
    padding: 20px 30px;
    border-radius: 16px;
    font-size: 16px;
    z-index: 10000;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    text-align: center;
    max-width: 300px;
  `;
  
  notification.innerHTML = `
    <div style="font-size: 40px; margin-bottom: 10px;">📧</div>
    <div>Ссылка для восстановления пароля отправлена на ваш email</div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    document.body.removeChild(notification);
    // Вернуться на экран регистрации
    showRegistration();
  }, 3000);
}