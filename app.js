/* ==========================================================================
   NESCAFÉ Gold Interactive & Animation Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- State & Constants ---
    const TOTAL_FRAMES = 240;
    const images = [];
    let imagesLoaded = 0;
    let targetFrame = 1;
    let currentFrame = 1;
    let isAppReady = false;

    // --- DOM Elements ---
    const preloader = document.getElementById('preloader');
    const progressBar = document.getElementById('loader-progress');
    const progressPct = document.getElementById('loader-pct');
    const progressMsg = document.getElementById('loader-msg');
    
    const canvas = document.getElementById('animation-canvas');
    const ctx = canvas.getContext('2d');
    const scrollSection = document.getElementById('scroll-container');

    const slides = {
        slide1: document.querySelector('#slide-1 .slide-content'),
        slide2: document.querySelector('#slide-2 .slide-content'),
        slide3: document.querySelector('#slide-3 .slide-content'),
        slide4: document.querySelector('#slide-4 .slide-content'),
    };

    // --- Loading Messages for premium feel ---
    const loadingMessages = [
        "Selecting the finest Arabica beans...",
        "Perfecting the golden roasting curve...",
        "Locking in signature rich aromas...",
        "Preparing your golden coffee moment..."
    ];

    // --- Helper: Get Frame Image Path ---
    const getFramePath = (index) => {
        const paddedIndex = String(index).padStart(3, '0');
        return `frames/ezgif-frame-${paddedIndex}.jpg`;
    };

    // --- 1. Preload Animation Frames ---
    const preloadImages = () => {
        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = getFramePath(i);
            img.onload = () => {
                imagesLoaded++;
                const percentage = Math.round((imagesLoaded / TOTAL_FRAMES) * 100);
                
                // Update Progress Bar & Percentage
                progressBar.style.width = `${percentage}%`;
                progressPct.textContent = `${percentage}%`;
                
                // Update Message periodically
                if (percentage % 25 === 0 && percentage < 100) {
                    const msgIndex = Math.floor(percentage / 25) % loadingMessages.length;
                    progressMsg.textContent = loadingMessages[msgIndex];
                }

                // If all frames loaded, initialize application
                if (imagesLoaded === TOTAL_FRAMES) {
                    initApp();
                }
            };
            
            // Handle loading error gracefully
            img.onerror = () => {
                console.warn(`Failed to load frame ${i}`);
                imagesLoaded++; // count it anyway to not block the loader
                if (imagesLoaded === TOTAL_FRAMES) {
                    initApp();
                }
            };
            
            images.push(img);
        }
    };

    // --- 2. Initialize Application ---
    const initApp = () => {
        isAppReady = true;
        progressMsg.textContent = "Your blend is ready.";
        progressPct.textContent = "100%";
        progressBar.style.width = "100%";

        // Fade out preloader elegantly
        setTimeout(() => {
            preloader.classList.add('fade-out');
            
            // Initialize canvas size and draw first frame
            resizeCanvas();
            renderCanvas(images[0]);

            // Reveal hero elements
            document.querySelectorAll('#slide-1 .fade-in-up').forEach((el) => {
                el.classList.add('active');
            });

            // Start animation loops
            requestAnimationFrame(updateAnimationLoop);
        }, 600);
    };

    // --- 3. Canvas Sizing & Rendering (CSS object-fit: cover behavior) ---
    const resizeCanvas = () => {
        canvas.width = window.innerWidth * window.devicePixelRatio;
        canvas.height = window.innerHeight * window.devicePixelRatio;
        
        // Scale canvas drawing area to fit screen size
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        
        // Redraw current frame on resize
        const currentFrameIndex = Math.round(currentFrame);
        const img = images[currentFrameIndex - 1];
        if (img && img.complete) {
            renderCanvas(img);
        }
    };

    const renderCanvas = (img) => {
        // Clear canvas
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        // Aspect ratios
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;
        const imgWidth = img.width;
        const imgHeight = img.height;
        
        const canvasRatio = canvasWidth / canvasHeight;
        const imgRatio = imgWidth / imgHeight;

        let drawWidth, drawHeight, xOffset, yOffset;

        // Draw image covering the entire canvas (aspect-fill)
        if (canvasRatio > imgRatio) {
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imgRatio;
            xOffset = 0;
            yOffset = (canvasHeight - drawHeight) / 2;
        } else {
            drawWidth = canvasHeight * imgRatio;
            drawHeight = canvasHeight;
            xOffset = (canvasWidth - drawWidth) / 2;
            yOffset = 0;
        }

        ctx.drawImage(img, xOffset, yOffset, drawWidth, drawHeight);
    };

    window.addEventListener('resize', resizeCanvas);

    // --- 4. Scroll Tracking ---
    const handleScroll = () => {
        if (!isAppReady) return;
        
        const scrollTop = window.scrollY;
        // Total scrollable height of the scroll container
        const maxScroll = scrollSection.clientHeight - window.innerHeight;
        
        if (maxScroll <= 0) return;

        // Clamped scroll fraction between 0 and 1
        const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScroll));
        
        // Calculate target frame index (1 to TOTAL_FRAMES)
        targetFrame = Math.floor(scrollFraction * (TOTAL_FRAMES - 1)) + 1;
    };

    window.addEventListener('scroll', handleScroll);

    // --- 5. Smooth Scroll-to-Frame Loop (Lerping) ---
    const updateAnimationLoop = () => {
        if (!isAppReady) return;

        // Linear interpolation (lerp) for frame transition
        const diff = targetFrame - currentFrame;
        // 0.12 provides a sleek decelerating slide effect
        currentFrame = currentFrame + diff * 0.12;

        // Avoid infinite tiny fractions
        if (Math.abs(diff) < 0.01) {
            currentFrame = targetFrame;
        }

        const frameIndex = Math.round(currentFrame);
        const img = images[frameIndex - 1];

        if (img && img.complete) {
            renderCanvas(img);
        }

        // Handle dynamic opacity & slide transitions for text slides
        updateTextOverlays(currentFrame);

        requestAnimationFrame(updateAnimationLoop);
    };

    // --- 6. Dynamic Text Overlay Fade & Slide Manager ---
    // Helper to calculate opacity with smooth bounds
    const getOpacity = (frame, startIn, endIn, startOut, endOut) => {
        if (frame < startIn) return 0;
        if (frame >= startIn && frame <= endIn) {
            if (endIn === startIn) return 1;
            return (frame - startIn) / (endIn - startIn); // Fade In
        }
        if (frame > endIn && frame < startOut) return 1; // Solid
        if (frame >= startOut && frame <= endOut) {
            if (endOut === startOut) return 0;
            return 1 - (frame - startOut) / (endOut - startOut); // Fade Out
        }
        return 0;
    };

    const updateTextOverlays = (frame) => {
        // Define frame ranges for text slide fades
        // Slide 1: Hero title
        const op1 = getOpacity(frame, 1, 1, 35, 60);
        
        // Slide 2: Arabica / Robusta (origin)
        const op2 = getOpacity(frame, 50, 75, 105, 125);
        
        // Slide 3: Roasting process
        const op3 = getOpacity(frame, 115, 140, 170, 190);
        
        // Slide 4: Finishing aroma
        const op4 = getOpacity(frame, 180, 205, 999, 999); // Never fades out

        // Apply opacity and subtle translate offset to create parallax-like entries
        applySlideStyle(slides.slide1, op1);
        applySlideStyle(slides.slide2, op2);
        applySlideStyle(slides.slide3, op3);
        applySlideStyle(slides.slide4, op4);
    };

    const applySlideStyle = (element, opacity) => {
        if (!element) return;
        
        // If completely invisible, hide to optimize rendering
        if (opacity === 0) {
            element.style.opacity = '0';
            element.style.visibility = 'hidden';
            element.style.transform = 'translateY(30px)';
            return;
        }

        element.style.visibility = 'visible';
        element.style.opacity = opacity;
        
        // Translate from 30px (invisible) to 0px (full opacity)
        const translateY = (1 - opacity) * 30;
        element.style.transform = `translateY(${translateY}px)`;
    };

    // --- 7. Intersection Observer for Scroll Reveals (Below Canvas) ---
    const revealElements = document.querySelectorAll('.feature-card, .brew-step, .section-header .section-label, .section-header h2, .section-header p, .cta-card h2, .cta-card p, .cta-buttons');
    
    // Add fade-in-up class to reveal elements that aren't already classed
    revealElements.forEach(el => {
        if (!el.classList.contains('fade-in-up')) {
            el.classList.add('fade-in-up');
        }
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Reveal only once
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px" // triggers slightly before entering full view
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // --- 9. Responsive Navigation Drawer Controls ---
    const burgerBtn = document.getElementById('burger-btn');
    const closeDrawerBtn = document.getElementById('close-drawer');
    const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    const toggleDrawer = () => {
        burgerBtn.classList.toggle('active');
        mobileNavDrawer.classList.toggle('active');
    };

    const closeDrawer = () => {
        burgerBtn.classList.remove('active');
        mobileNavDrawer.classList.remove('active');
    };

    if (burgerBtn && mobileNavDrawer) {
        burgerBtn.addEventListener('click', toggleDrawer);
    }
    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', closeDrawer);
    }
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    // --- 10. Multi-step Order Modal & Form Controls ---
    const orderModal = document.getElementById('order-modal');
    const closeOrderModalBtn = document.getElementById('close-order-modal');
    const successModal = document.getElementById('success-modal');
    const closeSuccessBtn = document.getElementById('close-success-btn');
    const orderForm = document.getElementById('order-form');
    
    const orderTriggers = document.querySelectorAll('.btn-order-trigger');
    const productCards = document.querySelectorAll('.product-card');
    const selectedProductInput = document.getElementById('selected-product');
    
    const qtyMinusBtn = document.getElementById('qty-minus');
    const qtyPlusBtn = document.getElementById('qty-plus');
    const qtyInput = document.getElementById('order-quantity');

    // Multi-step panels and indicator elements
    const step1Panel = document.getElementById('step-panel-1');
    const step2Panel = document.getElementById('step-panel-2');
    const nextStepBtn = document.getElementById('next-step-btn');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const checkoutProgress = document.querySelector('.checkout-progress');

    const resetModalSteps = () => {
        if (step1Panel && step2Panel) {
            step1Panel.classList.add('active');
            step2Panel.classList.remove('active');
        }
        if (checkoutProgress) {
            checkoutProgress.classList.remove('step-2-active');
        }
    };

    const goToStep2 = () => {
        if (step1Panel && step2Panel) {
            step1Panel.classList.remove('active');
            step2Panel.classList.add('active');
        }
        if (checkoutProgress) {
            checkoutProgress.classList.add('step-2-active');
        }
    };

    const goToStep1 = () => {
        if (step1Panel && step2Panel) {
            step2Panel.classList.remove('active');
            step1Panel.classList.add('active');
        }
        if (checkoutProgress) {
            checkoutProgress.classList.remove('step-2-active');
        }
    };

    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', goToStep2);
    }
    if (prevStepBtn) {
        prevStepBtn.addEventListener('click', goToStep1);
    }

    // Open Order Modal
    const openOrderModal = () => {
        resetModalSteps();
        orderModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // prevent page scroll
    };

    // Close Order Modal
    const closeOrderModal = () => {
        orderModal.classList.remove('active');
        document.body.style.overflow = ''; // restore scroll
    };

    // Open Success Modal
    const openSuccessModal = (order) => {
        document.getElementById('display-order-id').textContent = order.orderId;
        document.getElementById('display-product').textContent = order.product;
        document.getElementById('display-qty').textContent = `${order.quantity} Jar${order.quantity > 1 ? 's' : ''}`;
        document.getElementById('display-name').textContent = order.name;

        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // Close Success Modal
    const closeSuccessModal = () => {
        successModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    // Bind triggers to open modal
    orderTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            closeDrawer();
            openOrderModal();
        });
    });

    // Close on button click
    if (closeOrderModalBtn) {
        closeOrderModalBtn.addEventListener('click', closeOrderModal);
    }
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', closeSuccessModal);
    }

    // Close modal on clicking overlay background
    window.addEventListener('click', (e) => {
        if (e.target === orderModal) {
            closeOrderModal();
        }
        if (e.target === successModal) {
            closeSuccessModal();
        }
    });

    // Product Selection Handling
    productCards.forEach(card => {
        card.addEventListener('click', () => {
            productCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const productVal = card.getAttribute('data-product');
            selectedProductInput.value = productVal;
        });
    });

    // Quantity Selector Logic
    if (qtyMinusBtn && qtyPlusBtn && qtyInput) {
        qtyMinusBtn.addEventListener('click', () => {
            let val = parseInt(qtyInput.value) || 1;
            if (val > 1) {
                qtyInput.value = val - 1;
            }
        });

        qtyPlusBtn.addEventListener('click', () => {
            let val = parseInt(qtyInput.value) || 1;
            if (val < 10) {
                qtyInput.value = val + 1;
            }
        });
    }

    // Form Submit Handler (Backend Order API Integration)
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validate inputs in Step 2 before submitting
            const nameVal = document.getElementById('customer-name').value.trim();
            const emailVal = document.getElementById('customer-email').value.trim();
            const addressVal = document.getElementById('customer-address').value.trim();

            if (!nameVal || !emailVal || !addressVal) {
                alert('Please fill out all shipping details.');
                return;
            }

            const submitBtn = document.getElementById('submit-order-btn');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');

            // Set loading state
            submitBtn.disabled = true;
            if (btnText) btnText.textContent = "Processing...";
            if (btnLoader) btnLoader.style.display = "inline-block";

            // Gather order data
            const orderData = {
                product: selectedProductInput.value,
                quantity: qtyInput.value,
                name: nameVal,
                email: emailVal,
                address: addressVal
            };

            // Post request to local backend
            fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to process your order.');
                }
                return response.json();
            })
            .then(data => {
                // Success path
                if (data.success && data.order) {
                    // Reset form and UI states
                    orderForm.reset();
                    productCards.forEach(c => c.classList.remove('active'));
                    productCards[0].classList.add('active'); // reset to default active
                    selectedProductInput.value = "NESCAFÉ Gold Blend";
                    qtyInput.value = 1;
                    resetModalSteps();

                    // Swap modals
                    closeOrderModal();
                    setTimeout(() => {
                        openSuccessModal(data.order);
                    }, 400); // smooth modal swap transition
                }
            })
            .catch(error => {
                console.error(error);
                alert('Order failed. Please try again.');
            })
            .finally(() => {
                // Reset submit button state
                submitBtn.disabled = false;
                if (btnText) btnText.textContent = "Confirm Order";
                if (btnLoader) btnLoader.style.display = "none";
            });
        });
    }

    // --- Kickstart Preloading ---
    preloadImages();
});
