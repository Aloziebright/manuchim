(function () {
  const secondaryNav = document.querySelector('.secondary-nav');
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const hamburgerContent = document.querySelector('.hamburger-content');
  const generatorLink = document.getElementById('generator-link');
  const generatorSection = document.getElementById('generator-section');
  const verifyBtn = document.querySelector('.verify-btn');
  const verificationInput = document.querySelector('.verification-input');
  const scanBtn = document.querySelector('.scan-btn');
  const generateBtn = document.querySelector('.generate-btn');
  const generatedCode = document.querySelector('.generated-code');
  const generatedCodeValue = document.getElementById('generated-code-value');
  const copyCodeBtn = document.querySelector('.copy-code-btn');
  const cameraModal = document.querySelector('.camera-modal');
  const cameraPreview = document.querySelector('.camera-preview');
  const cameraStatus = document.querySelector('.camera-status');
  const closeCamera = document.querySelector('.close-camera');
  const cancelCamera = document.querySelector('.cancel-btn');
  const captureBtn = document.querySelector('.capture-btn');
  const copyBtns = document.querySelectorAll('.copy-btn');
  const verificationPopup = document.getElementById('verification-popup');
  const verificationPopupCard = document.getElementById('verification-popup-card');
  const verificationPopupIcon = document.getElementById('verification-popup-icon');
  const additionalInformationBtn = document.getElementById('additional-information-btn');
  const additionalInformationPanel = document.getElementById('additional-information-panel');
  const verificationPopupTitle = document.getElementById('verification-popup-title');
  const verificationPopupSubtitle = document.getElementById('verification-popup-subtitle');
  const verificationPopupDetails = document.getElementById('verification-popup-details');
  const verificationPopupActions = document.getElementById('verification-popup-actions');
  const verificationPopupFeedback = document.getElementById('verification-popup-feedback');
  const reportProductBtn = document.getElementById('report-product-btn');
  const downloadProductPdfBtn = document.getElementById('download-product-pdf-btn');
  const downloadProductPdfNote = document.getElementById('download-product-pdf-note');
  const leaveReviewBtn = document.getElementById('leave-review-btn');
  const verificationPopupClose = document.getElementById('verification-popup-close');
  const reportConfirmationModal = document.getElementById('report-confirmation-modal');
  const reportConfirmationClose = document.getElementById('report-confirmation-close');
  const reportConfirmationCancel = document.getElementById('report-confirmation-cancel');
  const reportConfirmationContinue = document.getElementById('report-confirmation-continue');
  const reviewRequestModal = document.getElementById('review-request-modal');
  const reviewRequestClose = document.getElementById('review-request-close');
  const reviewRequestCancel = document.getElementById('review-request-cancel');
  const reviewRequestSubmit = document.getElementById('review-request-submit');
  const reviewRequestName = document.getElementById('review-request-name');
  const reviewRequestEmail = document.getElementById('review-request-email');
  const reviewRequestWhatsapp = document.getElementById('review-request-whatsapp');
  const reviewRequestEmailGroup = document.getElementById('review-request-email-group');
  const reviewRequestWhatsappGroup = document.getElementById('review-request-whatsapp-group');
  const reviewDeliveryMethodInputs = document.querySelectorAll('input[name="review-delivery-method"]');
  const successAlert = { type: 'success' };
  const errorAlert = { type: 'error' };
  let verificationPopupTimer = null;
  let pendingReviewContext = null;
  let pendingPdfContext = null;
  let pendingReportContext = null;
  let activeCameraStream = null;
  let cameraVideo = null;
  let cameraScanFrame = null;
  let cameraDetector = null;
  let cameraScanInProgress = false;

  function setCameraStatus(message, isError = false) {
    if (!cameraStatus) return;
    cameraStatus.textContent = message;
    cameraStatus.classList.toggle('error', isError);
  }

  function getDefaultProductPdfSettings() {
    return {
      manufacturerName: '',
      manufacturerWebsite: '',
      manufacturerContact: '',
      customerSupportInfo: '',
      quickInstructions: '',
      storageInstructions: '',
      publicFields: {
        productImage: true,
        manufacturerName: true,
        manufacturerWebsite: false,
        manufacturerContact: false,
        customerSupportInfo: false,
        quickInstructions: false,
        storageInstructions: false,
        verificationReference: true
      }
    };
  }

  function getProductPdfSettings(rawSettings) {
    const defaults = getDefaultProductPdfSettings();
    const configured = rawSettings?.productPdf || {};
    return {
      ...defaults,
      ...configured,
      publicFields: {
        ...defaults.publicFields,
        ...(configured.publicFields || {})
      }
    };
  }

  function setPdfDownloadState({ visible = false, disabled = false, note = '', error = false } = {}) {
    if (!verificationPopupActions || !downloadProductPdfBtn || !downloadProductPdfNote) return;
    verificationPopupActions.style.display = visible ? 'flex' : 'none';
    downloadProductPdfBtn.disabled = disabled;
    downloadProductPdfBtn.textContent = disabled ? 'Generating PDF...' : 'Download Product Information (PDF)';
    downloadProductPdfNote.textContent = note || 'Only manufacturer-approved product information will be included.';
    downloadProductPdfNote.classList.toggle('error', Boolean(error));
  }

  function buildPdfFilename(context) {
    const parts = [context.manufacturerName, context.productName, 'Verify', new Date().toISOString().slice(0, 10)]
      .filter(Boolean)
      .map((part) => String(part).replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, ''))
      .filter(Boolean);
    return `${parts.join('_') || 'product_information'}.pdf`;
  }

  function buildPdfRows(context) {
    const settings = context.pdfSettings || getDefaultProductPdfSettings();
    const isPremium = String(context.productType || '').toLowerCase() === 'premium product' || String(context.productType || '').toLowerCase() === 'premium';
    const rows = [
      { label: 'Product Name', value: context.productName },
      settings.publicFields.manufacturerName ? { label: 'Manufacturer Name', value: context.manufacturerName } : null,
      { label: 'Verification Status', value: context.verificationStatus },
      { label: 'Verification Date', value: context.verificationDate },
      { label: 'Verification Time', value: context.verificationTime },
      settings.publicFields.verificationReference ? { label: 'Verification Code', value: context.verificationCode } : null,
      context.batchLotNumber ? { label: 'Batch / Lot Number', value: context.batchLotNumber } : null,
      context.manufacturingDate ? { label: 'Manufacturing Date', value: context.manufacturingDate } : null,
      context.expiryDate ? { label: 'Expiry Date', value: context.expiryDate } : null,
      context.productCategory ? { label: 'Product Category', value: context.productCategory } : null,
      context.netWeightSize ? { label: 'Net Weight/Size', value: context.netWeightSize } : null,
      context.warrantyInformation ? { label: 'Warranty Information', value: context.warrantyInformation } : null,
      ...(isPremium && Array.isArray(context.additionalInformation)
        ? context.additionalInformation.map((field) => ({ label: field.name, value: field.value }))
        : []),
      isPremium ? { label: 'Premium Benefits', value: 'Warranty coverage, verified reviews, product registration support, and premium customer care.' } : null,
      context.productDescription ? { label: 'Product Description', value: context.productDescription } : null,
      settings.publicFields.quickInstructions && settings.quickInstructions ? { label: 'Quick Product Instructions', value: settings.quickInstructions } : null,
      settings.publicFields.storageInstructions && settings.storageInstructions ? { label: 'Storage Instructions', value: settings.storageInstructions } : null,
      settings.publicFields.manufacturerContact && settings.manufacturerContact ? { label: 'Manufacturer Contact Information', value: settings.manufacturerContact } : null,
      settings.publicFields.manufacturerWebsite && settings.manufacturerWebsite ? { label: 'Manufacturer Website', value: settings.manufacturerWebsite } : null,
      settings.publicFields.customerSupportInfo && settings.customerSupportInfo ? { label: 'Customer Support Information', value: settings.customerSupportInfo } : null,
      context.customerScanLocation ? { label: 'Verification Location', value: context.customerScanLocation } : null
    ];

    return rows.filter((row) => row && row.value);
  }

  async function loadImageAsDataUrl(url) {
    if (!url) return null;
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d');
          if (!context) {
            resolve(null);
            return;
          }
          context.drawImage(image, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } catch (error) {
          console.warn('Unable to embed image in PDF:', error);
          resolve(null);
        }
      };
      image.onerror = () => resolve(null);
      image.src = url;
    });
  }

  async function generateProductInformationPdf(context) {
    const jsPdfApi = window.jspdf?.jsPDF;
    if (!jsPdfApi) {
      throw new Error('PDF generator is unavailable right now.');
    }

    const doc = new jsPdfApi({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    let cursorY = margin;
    const isPremium = String(context.productType || '').toLowerCase() === 'premium product' || String(context.productType || '').toLowerCase() === 'premium';

    const ensureSpace = (needed = 24) => {
      if (cursorY + needed <= pageHeight - margin) return;
      doc.addPage();
      cursorY = margin;
    };

    if (isPremium) {
      doc.setFillColor(255, 196, 92);
      doc.roundedRect(margin, cursorY, contentWidth, 84, 14, 14, 'F');
      doc.setTextColor(54, 34, 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('Premium Product Information', margin + 22, cursorY + 34);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Verified premium summary generated for customer download.', margin + 22, cursorY + 56);
    } else {
      doc.setFillColor(15, 106, 47);
      doc.roundedRect(margin, cursorY, contentWidth, 84, 14, 14, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('Verifi Product Information', margin + 22, cursorY + 34);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Verified product summary generated for customer download.', margin + 22, cursorY + 56);
    }
    cursorY += 110;

    const settings = context.pdfSettings || getDefaultProductPdfSettings();
    if (settings.publicFields.productImage && context.productImage) {
      const productImageData = await loadImageAsDataUrl(context.productImage);
      if (productImageData) {
        ensureSpace(180);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, cursorY, contentWidth, 170, 12, 12);
        doc.addImage(productImageData, 'JPEG', margin + 18, cursorY + 18, 134, 134, undefined, 'FAST');
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text(context.productName || 'Verified Product', margin + 172, cursorY + 46);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const imageSummary = doc.splitTextToSize(
          `${context.productCategory || 'Product category unavailable'}${context.productDescription ? `\n\n${context.productDescription}` : ''}${isPremium ? `\n\nPremium coverage includes warranty support, verified review access, product registration, and premium customer care.` : ''}`,
          contentWidth - 196
        );
        doc.text(imageSummary, margin + 172, cursorY + 70);
        cursorY += 190;
      }
    }

    const rows = buildPdfRows(context);
    doc.setTextColor(15, 23, 42);
    rows.forEach((row) => {
      const bodyLines = doc.splitTextToSize(String(row.value), contentWidth - 120);
      const rowHeight = Math.max(42, bodyLines.length * 14 + 18);
      ensureSpace(rowHeight + 10);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, cursorY, contentWidth, rowHeight, 10, 10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(String(row.label), margin + 16, cursorY + 22);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.text(bodyLines, margin + 16, cursorY + 40);
      cursorY += rowHeight + 10;
    });

    ensureSpace(40);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text('This document includes only information approved for public sharing by the manufacturer.', margin, pageHeight - margin + 4);
    doc.save(buildPdfFilename(context));
  }

  function escapeHtml(value) {
    const text = String(value ?? '');
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function closeVerificationPopup() {
    if (!verificationPopup) return;
    verificationPopup.classList.remove('show');
    verificationPopup.setAttribute('aria-hidden', 'true');
    pendingPdfContext = null;
    setPdfDownloadState({ visible: false });
  }

  function updateReviewDeliveryFields() {
    const selected = document.querySelector('input[name="review-delivery-method"]:checked')?.value || '';
    if (reviewRequestEmailGroup) {
      reviewRequestEmailGroup.style.display = selected === 'email' || selected === 'both' ? 'block' : 'none';
    }
    if (reviewRequestWhatsappGroup) {
      reviewRequestWhatsappGroup.style.display = selected === 'whatsapp' || selected === 'both' ? 'block' : 'none';
    }
  }

  function getSelectedDeliveryMethod() {
    return document.querySelector('input[name="review-delivery-method"]:checked')?.value || '';
  }

  function setReportButtonVisibility(show = false, context = null) {
    if (!reportProductBtn) return;
    reportProductBtn.style.display = show ? 'inline-flex' : 'none';
    pendingReportContext = show ? context : null;
  }

  function closeReportConfirmationModal() {
    if (!reportConfirmationModal) return;
    reportConfirmationModal.classList.remove('show');
    reportConfirmationModal.setAttribute('aria-hidden', 'true');
  }

  function openReportConfirmationModal() {
    if (!reportConfirmationModal || !pendingReportContext) return;
    reportConfirmationModal.classList.add('show');
    reportConfirmationModal.setAttribute('aria-hidden', 'false');
  }

  function buildReportMailto(reportContext) {
    const productName = reportContext?.productName || 'Unknown product';
    const verificationCode = reportContext?.verificationCode || 'Unknown';
    const manufacturerName = reportContext?.manufacturerName || 'Unknown manufacturer';
    const verificationDate = reportContext?.verificationDate || new Date().toLocaleDateString('en-US');
    const verificationTime = reportContext?.verificationTime || new Date().toLocaleTimeString('en-US');
    const displayDateTime = `${verificationDate} ${verificationTime}`;
    const subject = `Product Report - ${productName} - ${verificationCode}`;
    const body = [
      'Hello Verify Team,',
      '',
      'I would like to report an issue concerning this product.',
      '',
      `Product Name: ${productName}`,
      `Verification Code: ${verificationCode}`,
      `Manufacturer: ${manufacturerName}`,
      'Product Type: Premium Product',
      `Date/Time Verified: ${displayDateTime}`,
      '',
      'Reason for Report:',
      '',
      'Additional Information:',
      '',
      'I confirm that this report is submitted truthfully and in good faith.',
      '',
      'Regards,',
      '[Consumer Email]'
    ].join('\n');

    const reportEmail = 'support@verifi.com';
    return `mailto:${reportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function openReviewRequestModal() {
    if (!reviewRequestModal) return;
    reviewRequestModal.classList.add('show');
    updateReviewDeliveryFields();
    if (reviewRequestName) {
      reviewRequestName.focus();
    }
  }

  function closeReviewRequestModal() {
    if (!reviewRequestModal || !reviewRequestSubmit) return;
    reviewRequestModal.classList.remove('show');
    if (reviewRequestName) reviewRequestName.value = '';
    if (reviewRequestEmail) reviewRequestEmail.value = '';
    if (reviewRequestWhatsapp) reviewRequestWhatsapp.value = '';
    reviewDeliveryMethodInputs.forEach((input) => {
      input.checked = false;
    });
    updateReviewDeliveryFields();
    reviewRequestSubmit.disabled = false;
    reviewRequestSubmit.textContent = 'Submit Review Request';
  }

  function setValuedFeedbackVisibility(showFeedback) {
    if (!verificationPopupFeedback) return;
    verificationPopupFeedback.style.display = showFeedback ? 'block' : 'none';
  }

  function getProductLookup() {
    const stored = JSON.parse(localStorage.getItem('adminProducts') || '[]');
    return stored.map((product) => ({
      ...product,
      verificationMode: product.verificationMode || 'regular'
    }));
  }

  function resolveProductFromCodeRecord(codeRecord) {
    const products = getProductLookup();
    const byId = products.find((p) => String(p.id) === String(codeRecord.productId));
    if (byId) return byId;
    return products.find((p) => p.name === codeRecord.productName) || null;
  }

  function stopCameraStream() {
    if (cameraScanFrame) {
      cancelAnimationFrame(cameraScanFrame);
      cameraScanFrame = null;
    }
    cameraDetector = null;
    cameraScanInProgress = false;

    if (activeCameraStream) {
      activeCameraStream.getTracks().forEach((track) => track.stop());
      activeCameraStream = null;
    }

    if (cameraPreview) {
      cameraPreview.innerHTML = '<i class="fas fa-camera fa-3x"></i>';
    }

    cameraVideo = null;
  }

  function completeCameraScan(code) {
    const normalizedCode = String(code || '').trim();
    if (!normalizedCode || !cameraModal || !verificationInput) return false;
    verificationInput.value = normalizedCode;
    cameraModal.classList.remove('show');
    stopCameraStream();
    verificationInput.focus();
    return true;
  }

  async function scanCameraFrame() {
    if (!cameraVideo || !cameraModal?.classList.contains('show') || cameraScanInProgress) return;
    cameraScanInProgress = true;
    try {
      if (cameraDetector) {
        const results = await cameraDetector.detect(cameraVideo);
        const detected = results.find((result) => result.rawValue)?.rawValue;
        if (detected && completeCameraScan(detected)) return;
      } else if (window.jsQR && cameraVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const canvas = document.createElement('canvas');
        canvas.width = cameraVideo.videoWidth;
        canvas.height = cameraVideo.videoHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (context && canvas.width && canvas.height) {
          context.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
          const result = window.jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
          if (result?.data && completeCameraScan(result.data)) return;
        }
      }
    } catch (error) {
      console.warn('Camera scan failed:', error);
    } finally {
      cameraScanInProgress = false;
    }
    if (cameraVideo && cameraModal?.classList.contains('show')) {
      cameraScanFrame = requestAnimationFrame(scanCameraFrame);
    }
  }

  async function startCameraStream() {
    if (!cameraPreview) return false;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showAlert(errorAlert, '<strong>Error!</strong> Camera is not supported in this browser.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });

      activeCameraStream = stream;
      cameraVideo = document.createElement('video');
      cameraVideo.setAttribute('playsinline', 'true');
      cameraVideo.autoplay = true;
      cameraVideo.muted = true;
      cameraVideo.srcObject = stream;
      cameraVideo.style.width = '100%';
      cameraVideo.style.height = '100%';
      cameraVideo.style.objectFit = 'cover';

      cameraPreview.innerHTML = '';
      cameraPreview.appendChild(cameraVideo);

      await cameraVideo.play();
      if ('BarcodeDetector' in window) {
        try {
          cameraDetector = new BarcodeDetector({
            formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
          });
        } catch (error) {
          console.warn('Native barcode detection is unavailable:', error);
          cameraDetector = null;
        }
      }
      setCameraStatus(cameraDetector || window.jsQR
        ? 'Scanning... hold the code inside the frame.'
        : 'Live decoding is unavailable. Enter the code manually.');
      if (cameraDetector || window.jsQR) scanCameraFrame();
      return true;
    } catch (error) {
      console.error('Camera access failed:', error);
      showAlert(errorAlert, '<strong>Error!</strong> Unable to access camera. Check permissions and try again.');
      stopCameraStream();
      return false;
    }
  }

  function positionHamburgerMenu() {
    if (!hamburgerContent) return;

    const topOffset = (secondaryNav ? secondaryNav.getBoundingClientRect().bottom : 84) + 12;
    hamburgerContent.style.top = `${topOffset}px`;
    hamburgerContent.style.borderRadius = '12px';

    if (window.innerWidth <= 576) {
      hamburgerContent.style.left = '13px';
      hamburgerContent.style.right = '13px';
      hamburgerContent.style.width = 'calc(100vw - 26px)';
      hamburgerContent.style.maxWidth = 'calc(100vw - 26px)';
      hamburgerContent.style.bottom = '';
      hamburgerContent.style.height = 'auto';
      hamburgerContent.style.maxHeight = 'min(500px, calc(100vh - 110px))';
      hamburgerContent.style.overflow = 'hidden';
      hamburgerContent.style.overflowY = 'auto';
    } else {
      hamburgerContent.style.left = 'auto';
      hamburgerContent.style.right = '12px';
      hamburgerContent.style.width = 'min(317px, calc(100vw - 24px))';
      hamburgerContent.style.maxWidth = 'min(317px, calc(100vw - 24px))';
      hamburgerContent.style.bottom = '';
      hamburgerContent.style.height = 'auto';
      hamburgerContent.style.maxHeight = '';
      hamburgerContent.style.overflow = 'hidden';
      hamburgerContent.style.overflowY = '';
    }
  }

  if (hamburgerBtn && hamburgerContent) {
    if (hamburgerBtn.dataset.menuBound === 'true') return;
    hamburgerBtn.dataset.menuBound = 'true';

    const hamburgerIcon = hamburgerBtn.querySelector('i');
    const updateHamburgerState = () => {
      const isOpen = hamburgerContent.classList.contains('show');
      hamburgerBtn.classList.toggle('active', isOpen);
      if (hamburgerIcon) {
        hamburgerIcon.classList.toggle('fa-bars', !isOpen);
        hamburgerIcon.classList.toggle('fa-times', isOpen);
      }
    };

    hamburgerBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      positionHamburgerMenu();
      hamburgerContent.classList.toggle('show');
      updateHamburgerState();
    });

    document.addEventListener('click', (event) => {
      if (!hamburgerBtn.contains(event.target) && !hamburgerContent.contains(event.target)) {
        hamburgerContent.classList.remove('show');
        updateHamburgerState();
      }
    });

    hamburgerContent.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        hamburgerContent.classList.remove('show');
      });
    });

    window.addEventListener('resize', positionHamburgerMenu);
    window.addEventListener('scroll', positionHamburgerMenu, { passive: true });
  }

  additionalInformationBtn?.addEventListener('click', () => {
    if (!additionalInformationPanel) return;
    additionalInformationPanel.hidden = !additionalInformationPanel.hidden;
    additionalInformationBtn.setAttribute('aria-expanded', String(!additionalInformationPanel.hidden));
  });

  if (generatorLink && generatorSection) {
    generatorLink.addEventListener('click', (event) => {
      event.preventDefault();
      generatorSection.style.display = 'block';
      generatorSection.scrollIntoView({ behavior: 'smooth' });
      hamburgerContent?.classList.remove('show');
    });
  }

  function renderAds() {
    document.querySelectorAll('.ad-box').forEach((box, index) => {
      const image = box.querySelector('.ad-image');
      if (!image || image.querySelector('.ad-fallback')) return;

      const fallback = document.createElement('div');
      fallback.className = 'ad-fallback';
      fallback.innerHTML = `
        <div class="ad-fallback__badge">Local promotion</div>
        <div class="ad-fallback__title">Upload your ad image</div>
        <div class="ad-fallback__text">Replace this area with your own local ad photo.</div>
      `;

      image.innerHTML = '';
      image.appendChild(fallback);
    });
  }

  function initTestimonials() {
    const quoteEl = document.getElementById('testimonial-quote');
    const metaEl = document.getElementById('testimonial-meta');
    const dotsEl = document.getElementById('testimonial-dots');

    if (!quoteEl || !metaEl) return;

    const testimonials = [
      {
        quote: '“V.com helped us reclaim our supply chain and stop fake products from reaching our customers. Sales are up 40% since launch.”',
        name: 'Sarah M.',
        role: 'Founder, Northstar Apparel'
      },
      {
        quote: '“The verification system gave our customers instant trust and helped our brand scale confidently into five new markets.”',
        name: 'Daniel K.',
        role: 'Operations Lead, BrightGear'
      },
      {
        quote: '“With V.com, counterfeit returns dropped by over 80%. Our customers now know every product is genuinely ours.”',
        name: 'Amara T.',
        role: 'Brand Director, Luma Studio'
      },
      {
        quote: '“Implementing V.com was the single best decision we made for protecting our brand and growing customer loyalty.”',
        name: 'James O.',
        role: 'CEO, PureEdge Foods'
      }
    ];

    let current = 0;

    if (dotsEl) {
      testimonials.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'testimonial-strip__dot' + (i === 0 ? ' active' : '');
        dotsEl.appendChild(dot);
      });
    }

    function updateDots(index) {
      if (!dotsEl) return;
      dotsEl.querySelectorAll('.testimonial-strip__dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
    }

    function showNext() {
      current = (current + 1) % testimonials.length;
      const item = testimonials[current];

      quoteEl.classList.add('fade-out');
      metaEl.classList.add('fade-out');

      setTimeout(() => {
        quoteEl.textContent = item.quote;
        metaEl.innerHTML = `<strong>${item.name}</strong><span>${item.role}</span>`;
        quoteEl.classList.remove('fade-out');
        metaEl.classList.remove('fade-out');
        updateDots(current);
      }, 500);
    }

    setInterval(showNext, 30000);
  }

  function updateDateTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

    const currentDate = document.getElementById('current-date');
    const currentTime = document.getElementById('current-time');

    if (currentDate) currentDate.textContent = now.toLocaleDateString('en-US', dateOptions);
    if (currentTime) currentTime.textContent = now.toLocaleTimeString('en-US', timeOptions);
  }

  function getUserLocation() {
    const userLocation = document.getElementById('user-location');
    if (!userLocation) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then((response) => response.json())
            .then((data) => {
              userLocation.textContent = data.display_name || 'Location detected';
            })
            .catch(() => {
              userLocation.textContent = `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            });
        },
        () => {
          userLocation.textContent = 'Location access denied';
        }
      );
    } else {
      userLocation.textContent = 'Geolocation not supported';
    }
  }

  function generateVerificationCode(prefix) {
    const length = Math.floor(Math.random() * 4) + 8;
    let code = '';

    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }

    return prefix ? `${prefix}-${code}` : code;
  }

  function showAlert(alertType, message = '') {
    if (!verificationPopup || !verificationPopupCard || !verificationPopupTitle || !verificationPopupSubtitle || !verificationPopupDetails || !verificationPopupIcon) return;

    const isError = alertType?.type === 'error';
    const premiumProduct = Boolean(
      (message && typeof message === 'object' && /premium/i.test(String(message.feedback?.context?.productType || message.productType || ''))) ||
      (message && typeof message === 'object' && message.feedback?.context?.productType === 'Premium Product')
    );
    const iconClass = isError ? 'fas fa-exclamation-circle' : premiumProduct ? 'fas fa-crown' : 'fas fa-check-circle';
    verificationPopupCard.classList.toggle('error', isError);
    verificationPopupCard.classList.toggle('success', !isError && !premiumProduct);
    verificationPopupCard.classList.toggle('premium-product', premiumProduct && !isError);
    verificationPopupIcon.innerHTML = `<i class="${iconClass}"></i>`;

    let title = isError ? 'Verification Failed' : 'Product Verified';
    let subtitle = isError ? 'Please review the issue below.' : 'Verification details are shown below.';
    let rows = [];
    let showFeedback = false;
    let feedbackContext = null;

    if (typeof message === 'string' && message.trim()) {
      const parsed = document.createElement('div');
      parsed.innerHTML = message;
      const text = parsed.textContent?.trim() || message;
      rows = [{ label: 'Details', value: text, full: true }];
    } else if (message && typeof message === 'object') {
      title = message.title || title;
      subtitle = message.subtitle || subtitle;
      rows = Array.isArray(message.rows) ? message.rows : [];
      showFeedback = Boolean(message.feedback?.enabled);
      feedbackContext = message.feedback?.context || null;
      if (premiumProduct && feedbackContext?.productName) {
        title = feedbackContext.productName;
        subtitle = 'Premium verified product';
      }
    }

    const premiumAdditionalInformation = premiumProduct
      ? (feedbackContext?.additionalInformation || message?.additionalInformation || [])
        .filter((field) => field && field.name && field.value)
      : [];

    const premiumHeaderBadges = premiumProduct
      ? '<div class="verification-popup__header-badges"><span class="verification-popup__badge verification-popup__badge--premium"><i class="fas fa-crown"></i> Premium</span><span class="verification-popup__badge verification-popup__badge--verified"><i class="fas fa-shield-check"></i> Verified Manufacturer</span></div>'
      : '';

    verificationPopupTitle.textContent = title;
    verificationPopupSubtitle.textContent = subtitle;
    const existingBadges = verificationPopupSubtitle.parentElement.querySelector('.verification-popup__header-badges');
    if (existingBadges) existingBadges.remove();
    if (premiumHeaderBadges) {
      verificationPopupSubtitle.insertAdjacentHTML('afterend', premiumHeaderBadges);
    }

    const premiumFeatures = premiumProduct
      ? `
        <div class="verification-popup__premium-section">
          <div class="verification-popup__premium-section-header"><i class="fas fa-crown"></i> Premium Benefits</div>
          <div class="verification-popup__premium-features">
            <div class="verification-popup__premium-feature"><span class="verification-popup__premium-icon"><i class="fas fa-shield-alt"></i></span><div><strong>Warranty</strong><small>Coverage details and protection included.</small></div></div>
            <div class="verification-popup__premium-feature"><span class="verification-popup__premium-icon"><i class="fas fa-star"></i></span><div><strong>Customer Reviews</strong><small>Verified consumer experiences and quality signals.</small></div></div>
            <div class="verification-popup__premium-feature"><span class="verification-popup__premium-icon"><i class="fas fa-clipboard-check"></i></span><div><strong>Product Registration</strong><small>Traceable product ownership and registration support.</small></div></div>
            <div class="verification-popup__premium-feature"><span class="verification-popup__premium-icon"><i class="fas fa-headset"></i></span><div><strong>Premium Services</strong><small>Priority support and manufacturer service access.</small></div></div>
          </div>
        </div>
      `
      : '';

    verificationPopupDetails.innerHTML = rows
      .map((row) => {
        const isFull = row.full ? ' verification-popup__row--full' : '';
        return `<div class="verification-popup__row${isFull}"><span class="verification-popup__label">${escapeHtml(row.label || 'Info')}</span><span class="verification-popup__value">${escapeHtml(row.value || '-')}</span></div>`;
      })
      .join('') + premiumFeatures;

    if (additionalInformationBtn && additionalInformationPanel) {
      additionalInformationBtn.hidden = !premiumAdditionalInformation.length;
      additionalInformationPanel.hidden = true;
      additionalInformationPanel.innerHTML = premiumAdditionalInformation
        .map((field) => `<div class="verification-popup__additional-item"><span>${escapeHtml(field.name)}</span><strong>${escapeHtml(field.value)}</strong></div>`)
        .join('');
    }

    if (!rows.length) {
      verificationPopupDetails.innerHTML = `<div class="verification-popup__row verification-popup__row--full"><span class="verification-popup__label">Info</span><span class="verification-popup__value">No additional details available.</span></div>${premiumFeatures}`;
    }

    pendingReviewContext = feedbackContext;
    setValuedFeedbackVisibility(showFeedback);
    pendingPdfContext = message?.pdf?.enabled ? message.pdf.context || null : null;
    setReportButtonVisibility(Boolean(feedbackContext && feedbackContext.productType && feedbackContext.productType !== 'Regular Product'), feedbackContext || null);
    setPdfDownloadState({
      visible: Boolean(pendingPdfContext),
      disabled: false,
      note: pendingPdfContext ? 'Only manufacturer-approved product information will be included.' : '',
      error: false
    });

    if (verificationPopupTimer) {
      clearTimeout(verificationPopupTimer);
    }

    verificationPopup.classList.add('show');
    verificationPopup.setAttribute('aria-hidden', 'false');

    verificationPopupTimer = setTimeout(() => {
      closeVerificationPopup();
    }, 60000);
  }

  function copyToClipboard(text) {
    if (!text) return;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch((error) => {
        console.error('Failed to copy text:', error);
      });
    }
  }

  const verificationDatabase = new Map();
  verificationDatabase.set("Mark's Chocolate Drinks-12345678901", {
    message: "This product is directly from Mark's Chocolate Drinks and is 100% authentic.",
    prefix: "Mark's Chocolate Drinks"
  });
  verificationDatabase.set("Mark's Chocolate Drinks-98765432109", {
    message: "This product is directly from Mark's Chocolate Drinks and is 100% authentic.",
    prefix: "Mark's Chocolate Drinks"
  });
  verificationDatabase.set("TechGadgets-55512345678", {
    message: "Genuine TechGadgets product with full manufacturer warranty.",
    prefix: "TechGadgets"
  });
  verificationDatabase.set("PremiumWear-88877665544", {
    message: "Authentic PremiumWear clothing item with quality guarantee.",
    prefix: "PremiumWear"
  });

  if (verifyBtn && verificationInput) {
    verifyBtn.addEventListener('click', () => {
      const code = verificationInput.value.trim();

      if (!code) {
        verificationInput.focus();
        showAlert(errorAlert, {
          title: 'Product Code Required',
          subtitle: 'A verification code is needed before checking authenticity.',
          rows: [
            { label: 'Action', value: 'Enter a product verification code and tap Verify.', full: true }
          ]
        });
        return;
      }

      // Check localStorage first (codes generated from admin)
      let adminCodes = JSON.parse(localStorage.getItem('adminCodes') || '[]');
      let codeRecord = adminCodes.find(c => c.code === code);

      if (codeRecord) {
        if (codeRecord.status === 'disabled') {
          showAlert(errorAlert, {
            title: 'Code Disabled',
            subtitle: 'This code cannot be used for verification.',
            rows: [
              { label: 'Product', value: codeRecord.productName || 'Unknown product' },
              { label: 'Status', value: 'Disabled by manufacturer' },
              { label: 'Code', value: code },
              { label: 'What to do', value: 'Contact support or the original seller for help.', full: true }
            ]
          });
          verificationInput.value = '';
          return;
        }

        codeRecord.timesVerified = (codeRecord.timesVerified || 0) + 1;
        localStorage.setItem('adminCodes', JSON.stringify(adminCodes));

        const matchedProduct = resolveProductFromCodeRecord(codeRecord);
        const verificationMode = matchedProduct?.verificationMode || 'regular';
        const manufacturerSettings = JSON.parse(localStorage.getItem('manufacturerSettings') || '{}');
        const productPdfSettings = getProductPdfSettings(manufacturerSettings);
        const verificationDate = new Date().toLocaleDateString('en-US');
        const verificationTime = new Date().toLocaleTimeString('en-US');
        const valuedProductRows = verificationMode === 'valued'
          ? [
              { label: 'Manufactured By', value: matchedProduct?.manufacturerName || manufacturerSettings.companyName || 'Not set' },
              { label: 'Product Category', value: matchedProduct?.category || 'Not set' },
              { label: 'Net Weight/Size', value: matchedProduct?.netWeightSize || 'Not set' },
              { label: 'Warranty', value: matchedProduct?.warranty || 'Not set' },
              { label: 'Manufacturing Date', value: matchedProduct?.mfgDate || 'Not set' },
              { label: 'Product Description', value: matchedProduct?.description || 'Not set', full: true }
            ]
          : [];
        
        showAlert(successAlert, {
          title: 'Product Verified Successfully',
          subtitle: 'The product is authentic and recognized in the system.',
          rows: [
            { label: 'Product', value: codeRecord.productName || 'Unknown product' },
            { label: 'Code', value: code },
            { label: 'Expiring Date', value: matchedProduct?.expiryDate || 'Not set' },
            ...valuedProductRows,
            { label: 'Verification Count', value: codeRecord.timesVerified === 1 ? 'First successful verification' : `${codeRecord.timesVerified} successful verifications` },
            { label: 'Status', value: 'Valid and active' }
          ],
          feedback: {
            enabled: verificationMode === 'valued',
            context: {
              productId: matchedProduct?.id || codeRecord.productId || null,
              productName: codeRecord.productName || matchedProduct?.name || 'Unknown product',
              productType: verificationMode === 'valued' ? 'Premium Product' : 'Regular Product',
              productImage: matchedProduct?.image || '',
              productDescription: matchedProduct?.description || '',
              warrantyInformation: matchedProduct?.warranty || '',
              manufacturerName: manufacturerSettings.companyName || 'Creator',
              manufacturerId: codeRecord.manufacturerId || manufacturerSettings.manufacturerId || 'manufacturer-default',
              verificationCode: code,
              verificationStatus: 'Verified',
              verificationDate,
              verificationTime,
              customerScanLocation: document.getElementById('user-location')?.textContent || '',
              additionalInformation: verificationMode === 'valued' ? (matchedProduct?.additionalInformation || []) : []
            }
          },
          pdf: {
            enabled: verificationMode === 'valued' && Boolean(matchedProduct),
            context: verificationMode === 'valued' && matchedProduct ? {
              productName: codeRecord.productName || matchedProduct?.name || 'Unknown product',
              productType: 'Premium Product',
              productImage: matchedProduct?.image || '',
              manufacturerName: productPdfSettings.manufacturerName || manufacturerSettings.companyName || 'Creator',
              verificationStatus: 'Verified',
              verificationDate,
              verificationTime,
              verificationCode: code,
              batchLotNumber: matchedProduct?.lotNumber || matchedProduct?.batchNumber || matchedProduct?.sku || '',
              manufacturingDate: matchedProduct?.mfgDate || '',
              expiryDate: matchedProduct?.expiryDate || '',
              productCategory: matchedProduct?.category || '',
              productDescription: matchedProduct?.description || '',
              additionalInformation: matchedProduct?.additionalInformation || [],
              customerScanLocation: document.getElementById('user-location')?.textContent || '',
              pdfSettings: productPdfSettings
            } : null
          }
        });
      } else if (verificationDatabase.has(code)) {
        const productInfo = verificationDatabase.get(code);
        verificationDatabase.delete(code);
        showAlert(successAlert, {
          title: 'Product Verified Successfully',
          subtitle: 'This code matches a valued product record.',
          rows: [
            { label: 'Product', value: productInfo.prefix || 'Verified product' },
            { label: 'Code', value: code },
            { label: 'Verification Message', value: productInfo.message || 'Authenticity confirmed.', full: true }
          ]
        });
      } else {
        showAlert(errorAlert, {
          title: 'Product Not Verified',
          subtitle: 'The submitted code was not found.',
          rows: [
            { label: 'Code Entered', value: code },
            { label: 'Status', value: 'Not found in verification database' },
            { label: 'Recommendation', value: 'Double-check the code or contact support for assistance.', full: true }
          ]
        });
      }

      verificationInput.value = '';
    });

    verificationInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        verifyBtn.click();
      }
    });
  }

  if (generateBtn && generatedCode && generatedCodeValue) {
    generateBtn.addEventListener('click', () => {
      const count = parseInt(document.getElementById('code-count')?.value || '1', 10) || 1;
      const prefix = document.getElementById('prefix')?.value.trim() || '';
      const message = document.getElementById('message')?.value.trim() || '';

      if (count > 10) {
        alert('Maximum 10 codes per day allowed');
        return;
      }

      if (!prefix) {
        alert('Please enter a product prefix');
        return;
      }

      if (!message) {
        alert('Please enter a verification message');
        return;
      }

      const codes = [];
      for (let i = 0; i < count; i++) {
        const newCode = generateVerificationCode(prefix);
        codes.push(newCode);
        verificationDatabase.set(newCode, { message, prefix });
      }

      generatedCodeValue.textContent = codes.join(', ');
      generatedCode.classList.add('show');
      generatedCode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (copyCodeBtn && generatedCodeValue) {
    copyCodeBtn.addEventListener('click', () => {
      copyToClipboard(generatedCodeValue.textContent);
    });
  }

  if (scanBtn && cameraModal) {
    scanBtn.addEventListener('click', async () => {
      cameraModal.classList.add('show');
      const started = await startCameraStream();

      if (!started) {
        cameraModal.classList.remove('show');
      }
    });
  }

  if (captureBtn && cameraModal && verificationInput) {
    captureBtn.addEventListener('click', async () => {
      if (cameraDetector && cameraVideo) {
        try {
          const results = await cameraDetector.detect(cameraVideo);
          const capturedCode = results.find((result) => result.rawValue)?.rawValue;
          if (completeCameraScan(capturedCode)) return;
        } catch (error) {
          console.warn('Barcode detection failed:', error);
        }
      }
      setCameraStatus('No code detected yet. Keep it inside the frame or enter it manually.', true);
    });
  }

  if (closeCamera && cameraModal) {
    closeCamera.addEventListener('click', () => {
      cameraModal.classList.remove('show');
      stopCameraStream();
    });
  }

  if (cancelCamera && cameraModal) {
    cancelCamera.addEventListener('click', () => {
      cameraModal.classList.remove('show');
      stopCameraStream();
    });
  }

  if (leaveReviewBtn) {
    leaveReviewBtn.addEventListener('click', () => {
      if (!pendingReviewContext) {
        return;
      }
      closeVerificationPopup();
      openReviewRequestModal();
    });
  }

  if (reportProductBtn) {
    reportProductBtn.addEventListener('click', () => {
      if (!pendingReportContext) {
        return;
      }
      openReportConfirmationModal();
    });
  }

  if (reportConfirmationClose) {
    reportConfirmationClose.addEventListener('click', closeReportConfirmationModal);
  }

  if (reportConfirmationCancel) {
    reportConfirmationCancel.addEventListener('click', closeReportConfirmationModal);
  }

  if (reportConfirmationContinue) {
    reportConfirmationContinue.addEventListener('click', () => {
      if (!pendingReportContext) {
        closeReportConfirmationModal();
        return;
      }

      const mailtoUri = buildReportMailto(pendingReportContext);
      closeReportConfirmationModal();
      window.location.href = mailtoUri;
    });
  }

  if (reportConfirmationModal) {
    reportConfirmationModal.addEventListener('click', (event) => {
      if (event.target.classList.contains('report-confirmation-modal__backdrop')) {
        closeReportConfirmationModal();
      }
    });
  }

  if (downloadProductPdfBtn) {
    downloadProductPdfBtn.addEventListener('click', async () => {
      if (!pendingPdfContext) return;

      try {
        setPdfDownloadState({
          visible: true,
          disabled: true,
          note: 'Preparing your PDF download...',
          error: false
        });
        await generateProductInformationPdf(pendingPdfContext);
        setPdfDownloadState({
          visible: true,
          disabled: false,
          note: 'PDF downloaded successfully.',
          error: false
        });
      } catch (error) {
        console.error('PDF generation failed:', error);
        setPdfDownloadState({
          visible: true,
          disabled: false,
          note: error?.message || 'Unable to generate the PDF right now.',
          error: true
        });
      }
    });
  }

  if (reviewRequestClose) {
    reviewRequestClose.addEventListener('click', closeReviewRequestModal);
  }

  if (reviewRequestCancel) {
    reviewRequestCancel.addEventListener('click', closeReviewRequestModal);
  }

  if (reviewRequestModal) {
    reviewRequestModal.addEventListener('click', (event) => {
      if (event.target.classList.contains('camera-modal')) {
        closeReviewRequestModal();
      }
    });
  }

  reviewDeliveryMethodInputs.forEach((input) => {
    input.addEventListener('change', updateReviewDeliveryFields);
  });

  if (reviewRequestSubmit) {
    reviewRequestSubmit.addEventListener('click', async () => {
      if (!pendingReviewContext) {
        return;
      }

      const preferredDeliveryMethod = getSelectedDeliveryMethod();
      if (!preferredDeliveryMethod) {
        showAlert(errorAlert, {
          title: 'Delivery Method Required',
          subtitle: 'Please select how you want to receive the review link.',
          rows: [
            { label: 'Action', value: 'Choose Email, WhatsApp, or Email & WhatsApp.', full: true }
          ]
        });
        return;
      }

      const customerName = reviewRequestName?.value.trim() || '';
      const customerEmail = reviewRequestEmail?.value.trim() || '';
      const whatsAppNumber = reviewRequestWhatsapp?.value.trim() || '';

      const needsEmail = preferredDeliveryMethod === 'email' || preferredDeliveryMethod === 'both';
      const needsWhatsApp = preferredDeliveryMethod === 'whatsapp' || preferredDeliveryMethod === 'both';

      if (needsEmail && !customerEmail) {
        reviewRequestEmail?.reportValidity();
        return;
      }
      if (needsEmail && reviewRequestEmail && !reviewRequestEmail.checkValidity()) {
        reviewRequestEmail.reportValidity();
        return;
      }

      if (needsWhatsApp && !whatsAppNumber) {
        reviewRequestWhatsapp?.focus();
        return;
      }

      if (needsWhatsApp && whatsAppNumber.length < 6) {
        reviewRequestWhatsapp?.focus();
        return;
      }

      reviewRequestSubmit.disabled = true;
      reviewRequestSubmit.textContent = 'Processing...';

      try {
        if (!window.ReviewService || typeof window.ReviewService.createReviewRequest !== 'function') {
          throw new Error('Review service unavailable');
        }

        await window.ReviewService.createReviewRequest({
          customerName,
          customerEmail,
          whatsAppNumber,
          preferredDeliveryMethod,
          productId: pendingReviewContext.productId,
          productName: pendingReviewContext.productName,
          productType: pendingReviewContext.productType,
          productImage: pendingReviewContext.productImage,
          manufacturerId: pendingReviewContext.manufacturerId,
          manufacturerName: pendingReviewContext.manufacturerName,
          verificationCode: pendingReviewContext.verificationCode,
          productDescription: pendingReviewContext.productDescription,
          warrantyInformation: pendingReviewContext.warrantyInformation,
          verificationStatus: pendingReviewContext.verificationStatus,
          verificationDate: pendingReviewContext.verificationDate,
          verificationTime: pendingReviewContext.verificationTime,
          customerScanLocation: pendingReviewContext.customerScanLocation
        });

        closeReviewRequestModal();
        showAlert(successAlert, {
          title: '✅ Thank You',
          subtitle: 'Your request has been received.',
          rows: [
            { label: 'Next Step', value: 'Your review request has been saved for the manufacturer.', full: true },
            { label: 'Delivery Method', value: preferredDeliveryMethod === 'both' ? 'Email & WhatsApp' : preferredDeliveryMethod === 'email' ? 'Email' : 'WhatsApp' },
            { label: 'Status', value: 'Pending Review Link' }
          ]
        });
      } catch (error) {
        console.error('Failed to create review request:', error);
        reviewRequestSubmit.disabled = false;
        reviewRequestSubmit.textContent = 'Submit Review Request';
        showAlert(errorAlert, {
          title: 'Request Failed',
          subtitle: 'Unable to save your review request right now.',
          rows: [
            { label: 'Action', value: 'Please try again in a moment.', full: true }
          ]
        });
      }
    });
  }

  window.addEventListener('beforeunload', stopCameraStream);

  if (verificationPopupClose) {
    verificationPopupClose.addEventListener('click', closeVerificationPopup);
  }

  if (verificationPopup) {
    verificationPopup.addEventListener('click', (event) => {
      if (event.target.classList.contains('verification-popup__backdrop')) {
        closeVerificationPopup();
      }
    });
  }

  copyBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const dataType = btn.getAttribute('data-text');
      let textToCopy = '';

      switch (dataType) {
        case 'date':
          textToCopy = document.getElementById('current-date')?.textContent || '';
          break;
        case 'time':
          textToCopy = document.getElementById('current-time')?.textContent || '';
          break;
        case 'location':
          textToCopy = document.getElementById('user-location')?.textContent || '';
          break;
      }

      copyToClipboard(textToCopy);
    });
  });

  updateDateTime();
  renderAds();
  initTestimonials();
  window.setTimeout(renderAds, 1500);
  setInterval(updateDateTime, 1000);
  getUserLocation();
})();
