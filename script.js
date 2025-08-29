// Mock Supabase client for demo purposes
const supabase = {
  storage: {
    from: () => ({
      upload: async () => ({ data: { path: 'demo.jpg' }, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://via.placeholder.com/150' } })
    })
  },
  from: () => ({
    insert: async () => ({ error: null })
  })
};

// Avatar preview functionality
document.addEventListener('DOMContentLoaded', function() {
  const avatarInput = document.getElementById('avatar');
  const avatarPreview = document.getElementById('avatarPreview');

  avatarInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        avatarPreview.innerHTML = `<img src="${e.target.result}" alt="Avatar preview">`;
      };
      reader.readAsDataURL(file);
    }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = document.querySelector('.save-btn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const btnText = document.querySelector('.btn-text');
    
    loadingSpinner.style.display = 'inline-block';
    btnText.style.display = 'none';
    submitBtn.disabled = true;

  const displayName = document.getElementById('display_name').value;
  const age = parseInt(document.getElementById('age').value);
  const status = document.getElementById('status').value;
  const interests = document.getElementById('interests').value;
  const avatarFile = document.getElementById('avatar').files[0];

  let avatarUrl = '';

  // Загрузка фото в Supabase Storage
  if (avatarFile) {
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('Avatars') // имя bucket
      .upload(fileName, avatarFile);

    if (error) {
      console.error('Ошибка загрузки изображения:', error.message);
      return;
    }

    const { data: publicUrlData } = supabase
      .storage
      .from('Avatars')
      .getPublicUrl(fileName);

    avatarUrl = publicUrlData.publicUrl;
  }

  // Сохранение данных профиля
  const { error: insertError } = await supabase
    .from('profiles')
    .insert([
      {
        display_name: displayName,
        age: age,
        status: status,
        interests: interests,
        avatar_url: avatarUrl,
      },
    ]);

    const resultDiv = document.getElementById('result');
    
    // Hide loading state
    loadingSpinner.style.display = 'none';
    btnText.style.display = 'inline';
    submitBtn.disabled = false;
    
    if (insertError) {
      console.error('Ошибка сохранения профиля:', insertError.message);
      resultDiv.innerHTML = '<div class="error-message">Ошибка при сохранении профиля!</div>';
    } else {
      resultDiv.innerHTML = '<div class="success-message">Профиль успешно создан!</div>';
      document.getElementById('profileForm').reset();
      const avatarPreview = document.getElementById('avatarPreview');
      avatarPreview.innerHTML = `<div class="camera-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="#9CA3AF"/></svg></div>`;
    }
  });
});
