(function () {
  const STORAGE_KEYS = {
    REVIEW_REQUESTS: 'reviewLinkRequests',
    MANUFACTURER_SETTINGS: 'manufacturerSettings',
    PRODUCT_FEEDBACK_EMAILS: 'productFeedbackEmails'
  };

  const REVIEW_REQUEST_STATUS = {
    PENDING: 'Pending Review Link',
    SENT: 'Sent',
    COMPLETED: 'Completed',
    EXPIRED: 'Expired'
  };

  function loadRequests() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEW_REQUESTS) || '[]');
  }

  function saveRequests(requests) {
    localStorage.setItem(STORAGE_KEYS.REVIEW_REQUESTS, JSON.stringify(requests));
  }

  function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function createReviewRequest(payload) {
    const now = new Date().toISOString();
    const request = {
      id: generateId(),
      customerName: payload.customerName || '',
      customerEmail: payload.customerEmail || '',
      whatsAppNumber: payload.whatsAppNumber || '',
      preferredDeliveryMethod: payload.preferredDeliveryMethod || '',
      productId: payload.productId || null,
      productName: payload.productName || '',
      productType: payload.productType || '',
      productImage: payload.productImage || '',
      manufacturerId: payload.manufacturerId || 'manufacturer-default',
      manufacturerName: payload.manufacturerName || '',
      verificationCode: payload.verificationCode || null,
      productDescription: payload.productDescription || '',
      warrantyInformation: payload.warrantyInformation || '',
      verificationStatus: payload.verificationStatus || 'Verified',
      verificationDate: payload.verificationDate || '',
      verificationTime: payload.verificationTime || '',
      customerScanLocation: payload.customerScanLocation || '',
      status: REVIEW_REQUEST_STATUS.PENDING,
      productFeedbackEmail: getProductFeedbackEmail(payload.productId),
      createdAt: now,
      updatedAt: now
    };

    const requests = loadRequests();
    requests.push(request);
    saveRequests(requests);
    return Promise.resolve(request);
  }

  function getProductFeedbackEmail(productId) {
    const feedbackMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_FEEDBACK_EMAILS) || '{}');
    return feedbackMap[String(productId)] || '';
  }

  function buildReviewMailto(reviewData) {
    const manufacturerSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.MANUFACTURER_SETTINGS) || '{}');
    const destination = manufacturerSettings.customerFeedbackEmail || '';
    const subject = `Review: ${reviewData.productName || 'Verified Product'}`;
    const bodyLines = [
      `Product Name: ${reviewData.productName || ''}`,
      `Manufacturer Name: ${reviewData.manufacturerName || ''}`,
      `Verification Code: ${reviewData.verificationCode || ''}`,
      `Rating: ${reviewData.rating || ''}`,
      `Review: ${reviewData.review || ''}`,
      `Customer Name: ${reviewData.customerName || ''}`,
      `Customer Email: ${reviewData.customerEmail || ''}`,
      `WhatsApp Number: ${reviewData.whatsAppNumber || ''}`,
      `Contact Permission: ${reviewData.contactPermission ? 'Yes' : 'No'}`,
      `Submission Date & Time: ${reviewData.submittedAt || new Date().toISOString()}`
    ];

    return `mailto:${encodeURIComponent(destination)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
  }

  window.ReviewService = {
    REVIEW_REQUEST_STATUS,
    createReviewRequest,
    getProductFeedbackEmail,
    buildReviewMailto
  };
})();
