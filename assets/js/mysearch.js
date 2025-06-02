document.addEventListener('DOMContentLoaded', async () => {
  const user = JSON.parse(localStorage.getItem('seeker_user'));
  console.log("Hämtad användare från localStorage:", user);

  if (!user || !user.user_id) {
    alert("Du måste vara inloggad för att se dina sparade sökningar.");
    window.location.href = 'index.html';
    return;
  }

  try {
    console.log(`Försöker hämta från /api/saved-searches/${user.user_id}`);
    const response = await fetch(`/api/saved-searches/${user.user_id}`);
    const result = await response.json();
    console.log("Svar från API:", result);

    const container = document.querySelector('.search-card-grid');
    container.innerHTML = '';

    if (result.success && result.saved_searches.length > 0) {
      result.saved_searches.forEach(search => {
        const card = document.createElement('div');
        card.className = 'search-card';
        card.innerHTML = `
          <div>
            <h2 class="search-title">${search.title}</h2>
            <p class="search-date">Sparad: ${new Date(search.saved_date).toLocaleDateString()}</p>
            <p class="search-description">${search.original_query}</p>
            <p class="search-goal">Sökmotor: ${search.search_engine}</p>
            <p class="search-notes">Anteckning: ${search.notes || '—'}</p>
          </div>
          <div class="search-card-actions">
            <button class="btn secondary"><i class="fas fa-pencil-alt"></i></button>
            <button class="btn danger"><i class="fas fa-trash"></i></button>
          </div>
        `;
        container.appendChild(card);
      });
    } else {
      container.innerHTML = '<p>Du har inga sparade sökningar än.</p>';
    }
  } catch (error) {
    console.error("Fel vid hämtning:", error);
    alert("Kunde inte hämta dina sparade sökningar.");
  }
});
