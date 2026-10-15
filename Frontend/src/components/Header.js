import { state } from '../services/state.js';
import { navigate } from '../router.js';

export function renderHeader() {
  const { cartItemCount, currentCategory } = state;
  return `
  <header class="header">
    <div class="container header-inner">
      <div class="header-left">
        <!-- Mobile Hamburger Button -->
        <button id="mobileMenuBtn" class="menu-btn" aria-label="Open Navigation Menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <h1 class="header-logo" style="cursor: pointer;" onclick="window.location.hash='#/'">LUXE</h1>
        
        <!-- Desktop Nav -->
        <nav class="nav">
          <button class="nav-link ${!currentCategory ? 'active' : ''}" onclick="window.handleCatClick('')">All</button>
          <button class="nav-link ${currentCategory === 'men' ? 'active' : ''}" onclick="window.handleCatClick('men')">Men</button>
          <button class="nav-link ${currentCategory === 'women' ? 'active' : ''}" onclick="window.handleCatClick('women')">Women</button>
          <button class="nav-link ${currentCategory === 'kids' ? 'active' : ''}" onclick="window.handleCatClick('kids')">Kids</button>
        </nav>
      </div>

      <div class="header-right">
        <!-- Desktop Add Products Button -->
        <a href="#/add-products" class="btn btn-primary nav-desktop-btn">Add Products</a>

        <!-- Cart Button -->
        <button id="cartBtn" class="icon-btn relative cart-header-btn" onclick="window.location.hash='#/cart'" aria-label="View Shopping Cart">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          ${cartItemCount > 0 ? `<span class="cart-badge">${cartItemCount}</span>` : ''}
        </button>
      </div>
    </div>
  </header>

  <!-- Mobile Drawer Backdrop and Panel -->
  <div id="mobileDrawerBackdrop" class="mobile-drawer-backdrop"></div>
  <aside id="mobileDrawer" class="mobile-drawer" aria-label="Mobile Navigation Drawer">
    <div class="mobile-drawer-header">
      <h2 class="mobile-drawer-logo" onclick="window.location.hash='#/'; window.closeMobileDrawer();">LUXE</h2>
      <button id="closeDrawerBtn" class="drawer-close-btn" aria-label="Close navigation menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <div class="mobile-drawer-section">
      <span class="mobile-drawer-subtitle">Categories</span>
      <div class="mobile-drawer-nav">
        <button class="mobile-nav-item ${!currentCategory ? 'active' : ''}" onclick="window.handleCatClick(''); window.closeMobileDrawer();">
          <span>🛍️ All Collections</span>
        </button>
        <button class="mobile-nav-item ${currentCategory === 'men' ? 'active' : ''}" onclick="window.handleCatClick('men'); window.closeMobileDrawer();">
          <span>👔 Men's Fashion</span>
        </button>
        <button class="mobile-nav-item ${currentCategory === 'women' ? 'active' : ''}" onclick="window.handleCatClick('women'); window.closeMobileDrawer();">
          <span>👗 Women's Fashion</span>
        </button>
        <button class="mobile-nav-item ${currentCategory === 'kids' ? 'active' : ''}" onclick="window.handleCatClick('kids'); window.closeMobileDrawer();">
          <span>👶 Kids' Collection</span>
        </button>
      </div>
    </div>

    <div class="mobile-drawer-section">
      <span class="mobile-drawer-subtitle">Quick Actions</span>
      <div class="mobile-drawer-nav">
        <button class="mobile-nav-item" onclick="window.location.hash='#/cart'; window.closeMobileDrawer();">
          <span>🛒 My Cart</span>
          ${cartItemCount > 0 ? `<span class="drawer-badge">${cartItemCount} items</span>` : ''}
        </button>
        <button class="mobile-nav-item" onclick="window.location.hash='#/add-products'; window.closeMobileDrawer();">
          <span>📦 Manage / Add Products</span>
        </button>
      </div>
    </div>

    <div class="mobile-drawer-footer">
      <p class="drawer-user-info">Logged in as:</p>
      <p class="drawer-user-email">${state.sessionId}</p>
    </div>
  </aside>
`;
}

// Global mobile drawer control functions
window.openMobileDrawer = function() {
  document.getElementById('mobileDrawer')?.classList.add('is-open');
  document.getElementById('mobileDrawerBackdrop')?.classList.add('is-open');
  document.body.style.overflow = 'hidden'; // prevent scrolling behind drawer
};

window.closeMobileDrawer = function() {
  document.getElementById('mobileDrawer')?.classList.remove('is-open');
  document.getElementById('mobileDrawerBackdrop')?.classList.remove('is-open');
  document.body.style.overflow = '';
};

export function setupHeaderEvents() {
  document.getElementById('mobileMenuBtn')?.addEventListener('click', window.openMobileDrawer);
  document.getElementById('closeDrawerBtn')?.addEventListener('click', window.closeMobileDrawer);
  document.getElementById('mobileDrawerBackdrop')?.addEventListener('click', window.closeMobileDrawer);
}
