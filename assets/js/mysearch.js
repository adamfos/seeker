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

        console.log("Search object:", search);
        card.innerHTML = `
          <div>
            <h2 class="search-title">
              <a href="#" class="search-link" data-query="${search.original_query}">
                ${search.original_query}
              </a>
            </h2>
            <p class="search-date"><strong>Saved on: </strong>${new Date(search.saved_date).toLocaleDateString()}</p>
            <p class="search-goal"><strong>Engine: </strong>${search.search_engine}</p>
          </div>
          <div class="search-card-actions">
            <button class="btn revisit" data-query="${search.original_query}">
              <i class="fas fa-redo"></i> Revisit
            </button>
            <button type="button" class="btn primary delete-search-btn" data-id="${search.saved_search_id}">
              <i class="fas fa-trash"></i>Delete
              </button>

          </div>
        `;

        container.appendChild(card);
      });

      // Revisit
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

  // Delete functionality
  document.querySelector('.search-card-grid').addEventListener('click', async (e) => {
    if (e.target.closest('.delete-search-btn')) {
      const btn = e.target.closest('.delete-search-btn');
      const id = btn.dataset.id;
      if (confirm('Are you sure you want to delete this search?')) {
        const res = await fetch(`/api/delete-search/${id}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        console.log("Svar från /api/delete-search:", data);

        if (data.success) {
          btn.closest('.search-card').remove();
        } else {
          alert('Kunde inte radera sökningen.');
        }
      }
    }
  });
});
