import { state } from '../services/state.js';
import { fetchProducts, addToCart } from '../services/api_v2.js';
import { renderHeader, setupHeaderEvents } from '../components/Header.js';
import { renderHero } from '../components/Hero.js';
import { navigate } from '../router.js';

// Price range options shown in the filter bar
const PRICE_RANGES = [
  { label: 'All Prices', min: null, max: null },
  { label: 'Under ₹500',  min: null, max: 500 },
  { label: '₹500–₹1000',  min: 500,  max: 1000 },
  { label: '₹1000–₹2000', min: 1000, max: 2000 },
  { label: '₹2000–₹5000', min: 2000, max: 5000 },
  { label: 'Above ₹5000', min: 5000, max: null },
];

export async function renderHome() {
  const { min, max } = state.priceFilter;
  const data = await fetchProducts(state.currentCategory, min, max);
  state.products = data;

  document.getElementById('app').innerHTML = `
    ${renderHeader()}
    ${renderHero()}
    <div class="products-section container">
      <div class="products-header-row">
        <div>
          <h2 class="section-title">Our Collections</h2>
          <p class="section-subtitle">Handpicked luxury fashion tailored for you</p>
        </div>
      </div>

      <!-- Price Range Filter Bar (Touch horizontal scroll on mobile) -->
      <div class="price-filter-bar" id="price-filter-container">
        ${PRICE_RANGES.map((r) => {
          const isActive = state.priceFilter.min === r.min && state.priceFilter.max === r.max;
          return `<button
            class="price-filter-btn ${isActive ? 'active' : ''}"
            data-min="${r.min ?? ''}"
            data-max="${r.max ?? ''}"
          >${r.label}</button>`;
        }).join('')}
      </div>

      <div class="products-grid">
        ${state.products.length === 0
          ? `<div class="no-products-state">
              <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">🔍</span>
              <p>No products found for this filter.</p>
              <button class="btn btn-outline" style="margin-top: 1rem;" onclick="window.handleCatClick('')">View All Products</button>
            </div>`
          : state.products.map(p => `
            <div class="product-card" data-id="${p.id}">
              <div class="product-image">
                ${p.image
                  ? `<img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80';" />`
                  : `<span class="product-placeholder">Product Image</span>`}
                <span class="product-card-badge">${p.category}</span>
              </div>
              <div class="product-info">
                <h3 class="product-name">${p.name}</h3>
                <p class="product-desc">${p.description}</p>
                <div class="product-footer">
                  <span class="product-price">₹${p.price}</span>
                </div>
                <button class="add-to-cart-btn" data-id="${p.id}">Add to Cart</button>
              </div>
            </div>
          `).join('')}
      </div>
    </div>
  `;

  setupHomeEvents();
}

/** Called by navbar buttons, drawer items, and inline onclick attributes */
window.handleCatClick = async function(cat) {
  state.currentCategory = cat;
  state.priceFilter = { min: null, max: null }; // reset price filter on category change
  renderHome();
};

function setupHomeEvents() {
  setupHeaderEvents();

  // Price filter buttons
  document.querySelectorAll('#price-filter-container .price-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const min = btn.dataset.min !== '' ? Number(btn.dataset.min) : null;
      const max = btn.dataset.max !== '' ? Number(btn.dataset.max) : null;
      state.priceFilter = { min, max };
      renderHome();
    });
  });

  // Product cards and Add to Cart
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', async (e) => {
      if (e.target.classList.contains('add-to-cart-btn')) {
        e.stopPropagation();
        
        try {
          const product = state.products.find(p => p.id === card.dataset.id || String(p.id) === card.dataset.id) || { name: 'Unknown Product' };
          const btn = e.target;
          btn.disabled = true;
          btn.textContent = 'Adding...';
          
          await addToCart(state.sessionId, product.name, 1);
          
          state.cartItemCount++;
          btn.textContent = 'Added! ✅';
          
          // Re-render header to update cart count badge
          const cartBtn = document.getElementById('cartBtn');
          if (cartBtn) {
            cartBtn.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              ${state.cartItemCount > 0 ? `<span class="cart-badge">${state.cartItemCount}</span>` : ''}
            `;
          }

          setTimeout(() => {
            btn.disabled = false;
            btn.textContent = 'Add to Cart';
          }, 1200);
        } catch (err) {
          console.error('Failed to add to cart:', err);
          alert('Failed to add to cart.');
          e.target.disabled = false;
          e.target.textContent = 'Add to Cart';
        }
      } else {
        navigate(`#/product/${card.dataset.id}`);
      }
    });
  });
}
