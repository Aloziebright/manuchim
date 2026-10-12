// Admin-managed featured ads seeding utility
// Manufacturers do not upload ads directly in the customer interface.

(function () {
  const STORAGE_KEY = 'verifyAdminFeaturedAds';
  const MAX_ADS = 20;

  const BRIGHT_PRODUCT_IMAGES = [
    'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1503602642458-232111445657?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=760&fit=crop',
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&h=760&fit=crop'
  ];

  const MANUFACTURER_LOGOS = [
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=180&h=180&fit=crop',
    'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=180&h=180&fit=crop',
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=180&h=180&fit=crop',
    'https://images.unsplash.com/photo-1611095566888-49f2f4f34f34?w=180&h=180&fit=crop'
  ];

  const PRODUCT_NAMES = [
    'Smartphone X1', 'UltraBook Pro', 'AudioMax 500', 'Tablet Plus', 'Aero Sneaker V2',
    'Pulse Runner', 'Nova Tee Signature', 'Glow Serum+', 'Eco Bottle Prime', 'Hydra Flask Mini',
    'SoundWave Earbuds', 'Chrono Watch S', 'Flex Sofa Lite', 'Petra Backpack', 'Vision Camera Go',
    'SunShade Classic', 'Studio Lamp Air', 'Active Smart Band', 'Luxe Weekend Bag', 'Breeze Polo'
  ];

  const MANUFACTURERS = [
    'BrightGear Mobile', 'Northstar Compute', 'Luma Audio Labs', 'Verde Devices', 'AeroMotion Footwear',
    'PulseFit Sports', 'Nova Apparel', 'GlowCare Labs', 'EcoHydrate Co.', 'HydraWorks',
    'SoundWave Digital', 'ChronoCraft', 'FlexLiving Home', 'Petra Travel Co.', 'Visionary Optics',
    'SunShade Studio', 'StudioNova Light', 'ActiveCore Health', 'LuxeCarry', 'BreezeWear'
  ];

  function buildDefaultAds() {
    return PRODUCT_NAMES.map((productName, index) => {
      const manufacturerName = MANUFACTURERS[index] || `Official Manufacturer ${index + 1}`;
      const websiteSlug = manufacturerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const hasWhatsApp = index % 2 === 0;
      const hasEmail = index % 3 !== 0;
      const hasFacebook = index % 4 === 0;
      const hasInstagram = index % 5 !== 0;

      return {
        id: `admin-featured-${index + 1}`,
        productName,
        promoText: `${productName} is a bright featured product curated by Verify admin for official manufacturer discovery.`,
        productImage: BRIGHT_PRODUCT_IMAGES[index % BRIGHT_PRODUCT_IMAGES.length],
        manufacturerName,
        manufacturerLogo: MANUFACTURER_LOGOS[index % MANUFACTURER_LOGOS.length],
        contacts: {
          website: `https://example.com/${websiteSlug}`,
          whatsapp: hasWhatsApp ? `+2567000000${String(index + 1).padStart(2, '0')}` : '',
          email: hasEmail ? `contact${index + 1}@${websiteSlug}.example` : '',
          facebook: hasFacebook ? 'https://facebook.com/' : '',
          instagram: hasInstagram ? 'https://instagram.com/' : ''
        }
      };
    }).slice(0, MAX_ADS);
  }

  const ADMIN_MANAGED_SAMPLE_ADS = buildDefaultAds();
  window.VerifyFeaturedAds = {
    getSampleAds() {
      return ADMIN_MANAGED_SAMPLE_ADS.map((ad) => ({ ...ad, contacts: { ...ad.contacts } }));
    }
  };

  function normalizeAds(rawList) {
    if (!Array.isArray(rawList)) return [];
    return rawList.filter((item) => item && typeof item === 'object');
  }

  const PopulateAds = {
    seedOrUpgrade() {
      try {
        const existingRaw = localStorage.getItem(STORAGE_KEY);
        if (!existingRaw) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(ADMIN_MANAGED_SAMPLE_ADS));
          return true;
        }

        const parsed = normalizeAds(JSON.parse(existingRaw));
        if (parsed.length >= MAX_ADS) return false;

        const seenIds = new Set(parsed.map((item) => String(item.id || '')));
        const additions = ADMIN_MANAGED_SAMPLE_ADS.filter((item) => !seenIds.has(String(item.id || '')));
        const upgraded = parsed.concat(additions).slice(0, MAX_ADS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded));
        return true;
      } catch (error) {
        console.error('Failed to seed admin managed featured ads:', error);
        return false;
      }
    },

    replaceAll(adList) {
      if (!Array.isArray(adList)) return false;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(adList));
        return true;
      } catch (error) {
        console.error('Failed to replace admin managed featured ads:', error);
        return false;
      }
    }
  };

  window.PopulateAds = PopulateAds;
  PopulateAds.seedOrUpgrade();
})();
