// Ads Section Loader
// Loads ads from ads-section.html file dynamically

(function() {
  async function loadAdsSection() {
    try {
      const placeholder = document.getElementById('ads-placeholder');
      if (!placeholder) return;

      const response = await fetch('ads-section.html');
      if (!response.ok) {
        console.error('Failed to load ads-section.html:', response.status);
        return;
      }

      const html = await response.text();
      placeholder.innerHTML = html;
      
      // Dispatch custom event to notify that ads have been loaded
      document.dispatchEvent(new CustomEvent('ads-loaded'));
    } catch (error) {
      console.error('Error loading ads section:', error);
    }
  }

  // Load ads when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAdsSection);
  } else {
    loadAdsSection();
  }

  // Expose function globally for manual reload
  window.reloadAds = loadAdsSection;
})();
