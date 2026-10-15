import { state } from '../services/state.js';
import { getCart, placeOrder, clearCart, fetchProducts } from '../services/api_v2.js';
import { renderHeader, setupHeaderEvents } from '../components/Header.js';

export async function renderCart() {
  document.getElementById('app').innerHTML = `
    ${renderHeader()}
    <div class="container cart-page-container">
      <h1 class="cart-page-title">Shopping Cart</h1>
      <div id="cartContent">
        <p class="loading">Loading your cart...</p>
      </div>
    </div>
  `;

  setupHeaderEvents();

  try {
    const rawCartItems = await getCart(state.sessionId);
    
    // The cart only saves names/quantities, fetch products to display images/prices
    const productsDB = await fetchProducts(); 
    
    // Map items to rich data
    const cartItems = rawCartItems.map(item => {
      const match = productsDB.find(p => p.name === item.product_name) || {};
      return {
        ...item,
        price: match.price || 0,
        image: match.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80',
        description: match.description || 'No description available',
      };
    });

    const contentDiv = document.getElementById('cartContent');
    
    if (!cartItems.length) {
      contentDiv.innerHTML = `
        <div class="cart-empty-card">
          <div class="cart-empty-icon">🛒</div>
          <h2 class="cart-empty-title">Your cart is empty!</h2>
          <p class="cart-empty-subtitle">Explore our fashion collections and add your favorite items.</p>
          <a href="#/" class="btn btn-primary cart-shop-btn">Continue Shopping</a>
        </div>
      `;
      state.cartItemCount = 0;
      return;
    }

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    state.cartItemCount = cartItems.length; // sync state

    contentDiv.innerHTML = `
      <div class="cart-card">
        <div class="cart-items-list">
          ${cartItems.map(item => `
            <div class="cart-item-row">
              <img src="${item.image}" alt="${item.product_name}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80';" class="cart-item-img" />
              <div class="cart-item-details">
                <h3 class="cart-item-name">${item.product_name}</h3>
                <p class="cart-item-qty">Quantity: ${item.quantity}</p>
                <div class="cart-item-price-mobile">₹${item.price} each</div>
              </div>
              <div class="cart-item-subtotal">₹${item.price * item.quantity}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="cart-total-row">
          <h2 class="cart-total-label">Total Amount:</h2>
          <span class="cart-total-price">₹${total}</span>
        </div>
        
        <div class="cart-actions-row">
          <a href="#/" class="btn btn-outline cart-btn-action">Keep Shopping</a>
          <button id="clearCartBtn" class="btn btn-outline cart-btn-danger">Clear Cart 🗑️</button>
          <button id="buyAllBtn" class="btn btn-primary cart-btn-checkout">
            <span>Buy All Now</span>
            <span>🚀</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('clearCartBtn')?.addEventListener('click', async (e) => {
      if (!confirm('Are you sure you want to clear your cart?')) return;
      
      const btn = e.target.closest('button');
      btn.disabled = true;
      btn.innerHTML = 'Clearing... ⏳';
      
      try {
        await clearCart(state.sessionId);
        state.cartItemCount = 0;
        
        // Re-render the cart right away
        renderCart();
      } catch (err) {
        alert('Failed to clear cart.');
        btn.disabled = false;
        btn.innerHTML = 'Clear Cart 🗑️';
      }
    });

    document.getElementById('buyAllBtn')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      btn.disabled = true;
      btn.innerHTML = `<span>Processing Order... ⏳</span>`;
      
      try {
        // Place individual orders for every item in the cart
        const promises = cartItems.map(item => placeOrder(state.sessionId, item.product_name, item.quantity));
        await Promise.all(promises);
        
        // Wipe the cart
        await clearCart(state.sessionId);
        
        // Reset state
        state.cartItemCount = 0;
        
        btn.innerHTML = `<span>Order Successful! 🎉</span>`;
        btn.style.backgroundColor = '#16a34a';
        btn.style.color = 'white';
        
        setTimeout(() => {
          window.location.hash = '#/';
        }, 1800);
        
      } catch(err) {
        alert('Failed to process bulk order.');
        btn.disabled = false;
        btn.innerHTML = `<span>Buy All Now 🚀</span>`;
      }
    });

  } catch(err) {
    document.getElementById('cartContent').innerHTML = `
      <div style="color: #ef4444; text-align: center; padding: 2rem;">Error loading cart. Please try again.</div>
    `;
  }
}
