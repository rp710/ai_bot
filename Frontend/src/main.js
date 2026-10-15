import { router } from './router.js';
import { initChatbot } from './components/Chatbot.js';

// Initialize application - listen for hash changes to navigate pages
window.addEventListener('hashchange', () => {
  router();
});

window.addEventListener('DOMContentLoaded', () => {
  // Mount the persistent AI Chatbot assistant once
  initChatbot();

  // Kick off the router immediately on page load
  router();
});