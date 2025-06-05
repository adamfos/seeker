document.addEventListener('DOMContentLoaded', async () => {
  const user = JSON.parse(localStorage.getItem('seeker_user'));
  if (!user || !user.user_id) {
    alert("You must be logged in to view your saved searches");
    window.location.href = 'index.html';
    return;
  }

  try {
    const response = await fetch(`/api/saved-searches/${user.user_id}`);
    const result = await response.json();

    const container = document.querySelector('.search-card-grid');
    container.innerHTML = '';

    if (result.success && result.saved_searches.length > 0) {
      result.saved_searches.forEach(search => {
        const card = document.createElement('div');
        card.className = 'search-card';

        card.innerHTML = `
          <div>
            <h2 class="search-title">
  <a href="#" class="search-link" data-query="${search.original_query}">
    ${search.original_query}
  </a>
</h2>
           
             <p class="search-date"><strong> Saved on: </strong>${new Date(search.saved_date).toLocaleDateString()}</p>
             <p class="search-goal"><strong> Engine: </strong> ${search.search_engine}</p>
          </div>
          <div class="search-card-actions">
            <button class="btn revisit" data-query="${search.original_query}">
              <i class="fas fa-redo"></i> Revisit
            </button>
            <button class="btn secondary"><i class="fas fa-pencil-alt"></i></button>
            <button class="btn danger"><i class="fas fa-trash"></i></button>
          </div>
        `;

        container.appendChild(card);
      });

      // Event listeners för revisit-knappar och länk-titlar
      document.querySelectorAll('.btn.revisit, .search-link').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const query = el.dataset.query;
          localStorage.setItem('revisitSearch', query);
          window.location.href = 'index.html';
        });
      });

    } else {
      container.innerHTML = '<p>You don’t have any saved searches yet.</p>';
    }

  } catch (error) {
    console.error("Failed to fetch data:", error);
    alert("Could not retrieve your saved searches.");
  }
});
