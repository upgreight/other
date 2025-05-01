/******************************************************************************
 * ZENTRALE SWIPER ANIMATION KONFIGURATION
 *****************************************************************************/
const swiperAnimationConfig = {
    speed: 700,
    on: {
      init: function() {
        this.slides.forEach(slide => {
          slide.style.transitionTimingFunction = 'cubic-bezier(0.34, 1.8, 0.64, 1)';
        });
      }
    }
  };
    
    
/******************************************************************************
* DATE PICKER & FORM SETUP
*****************************************************************************/
document.addEventListener('DOMContentLoaded', function() {
  
    function debounce(func, wait) {
      let timeout;
      return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
          func.apply(context, args);
        }, wait);
      };
    }
  
    (function customValidationSetup() {
      const myForm = document.querySelector('form');
      if (!myForm) return;
      
      function showElement(el, displayType = "block") {
        el.style.display = displayType;
        el.style.visibility = "visible";
      }
      function hideElement(el) {
        el.style.display = "none";
        el.style.visibility = "hidden";
      }
      function validateRequiredFields(showErrors = false) {
        let isFormValid = true;
        let firstErrorElement = null;
        document.querySelectorAll("[data-required]").forEach((requiredGroup) => {
          const inputs = requiredGroup.querySelectorAll("input, select, textarea");
          let isGroupValid = true;
          inputs.forEach((input) => {
            if (input.type === "checkbox" || input.type === "radio") {
            } else {
              if (input.value.trim() === "") {
                isGroupValid = false;
              }
            }
          });
          const checkable = Array.from(inputs).filter(input => input.type === "checkbox" || input.type === "radio");
          if (checkable.length > 0) {
            if (!checkable.some(input => input.checked)) {
              isGroupValid = false;
            }
          }
          const errorElement = requiredGroup.querySelector('.form_error');
          if (!isGroupValid) {
            isFormValid = false;
            if (showErrors && errorElement) {
              showElement(errorElement, "block");
              errorElement.setAttribute("aria-live", "polite");
            }
            if (!firstErrorElement) firstErrorElement = errorElement;
          } else {
            if (errorElement) {
              hideElement(errorElement);
              errorElement.removeAttribute("aria-live");
            }
          }
        });
        return { isFormValid, firstErrorElement };
      }

      // URL aus Data-Attribut ziehen, Fail-Fast wenn fehlt
      const taxiUrl = myForm.dataset.formTaxiUrl;
      if (!taxiUrl) {
        console.error('⚠️ data-form-taxi-url fehlt am <form>!');
        const errorEl = document.createElement('div');
        errorEl.className = 'form_error form-taxi-config-error';
        errorEl.textContent =
          'Dieses Formular ist nicht richtig konfiguriert. Bitte kontaktieren Sie den Betreiber.';
        myForm.parentNode.insertBefore(errorEl, myForm);
        myForm.style.display = 'none';
        return;
      }
      myForm.action = taxiUrl;

      const thankYouURL = window.location.origin + "/danke";
      myForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const { isFormValid, firstErrorElement } = validateRequiredFields(true);
        if (!isFormValid) {
          if (firstErrorElement) {
            firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return;
        }
        const submitButton = myForm.querySelector('button[type="submit"], #submit-button');
        let originalText = "";
        if (submitButton) {
          originalText = submitButton.textContent;
          submitButton.disabled = true;
          submitButton.textContent = "Bitte warten...";
        }
        fetch(myForm.action, {
          method: myForm.method || "POST",
          body: new FormData(myForm),
          headers: { "Accept": "application/json" }
        })
        .then(response => {
          if (response.ok) {
            window.location.href = thankYouURL;
          } else {
            throw new Error("Fehler beim Absenden des Formulars.");
          }
        })
        .catch(error => {
          console.error(error);
          const errorMessage = myForm.querySelector(".form_error-message");
          if (errorMessage) {
            showElement(errorMessage, "block");
          }
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
          }
        });
      });
      document.querySelectorAll("[data-required]").forEach((requiredGroup) => {
        const inputs = requiredGroup.querySelectorAll("input, select, textarea");
        inputs.forEach((input) => {
          input.addEventListener("change", () => {
            let isValidNow = true;
            if (input.type === "checkbox" || input.type === "radio") {
              const checkable = Array.from(requiredGroup.querySelectorAll("input[type='checkbox'], input[type='radio']"));
              if (!checkable.some(inp => inp.checked)) {
                isValidNow = false;
              }
            } else {
              if (input.value.trim() === "") {
                isValidNow = false;
              }
            }
            if (isValidNow) {
              const errorElement = requiredGroup.querySelector('.form_error');
              if (errorElement) hideElement(errorElement);
            }
          });
        });
      });
    })();
});
    
    
  /******************************************************************************
   * TOPIC BUTTONS & DEFAULT SETUP
   *****************************************************************************/
  document.addEventListener('DOMContentLoaded', function() {
      // Trigger-Elemente (Ebene 3) - diese enthalten eigentlich die Klickfunktionalität
      const topicTriggers = document.querySelectorAll('.topic_button[data-topic]');
      
      // Tab-Elemente (Ebene 2) - diese sollten role="tab" haben
      const topicTabItems = Array.from(topicTriggers).map(trigger => trigger.closest('.swiper-slide'));
      
      topicTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
          // Visuelles Feedback für Trigger zurücksetzen
          topicTriggers.forEach(btn => {
            btn.classList.remove('is-active');
          });
          
          // ARIA-Attribute auf Tab-Elementen zurücksetzen
          topicTabItems.forEach(tabItem => {
            if (tabItem) {
              tabItem.setAttribute('aria-selected', 'false');
            }
          });
          
          // Visuelles Feedback für aktiven Trigger
          trigger.classList.add('is-active');
          
          // ARIA-Attribute für übergeordnetes Tab-Element setzen
          const parentTabItem = trigger.closest('.swiper-slide');
          if (parentTabItem) {
            parentTabItem.setAttribute('aria-selected', 'true');
          }
          
          const topic = trigger.getAttribute('data-topic').toLowerCase();
          const evt = new CustomEvent('topicChange', { detail: { topic, manual: true } });
          document.dispatchEvent(evt);
          
          if (window.topicSwiper) {
            const index = Array.from(topicTriggers).findIndex(btn => btn === trigger);
            window.topicSwiper.slideTo(index);
          }
        });
      });
      
      // Default-Topic aus URL oder erstes Element
      const urlParams = new URLSearchParams(window.location.search);
      const urlTopic = urlParams.get('topic');
      let defaultTopic = urlTopic ? urlTopic.toLowerCase() : null;
      
      if (!defaultTopic && topicTriggers.length > 0) {
        defaultTopic = topicTriggers[0].getAttribute('data-topic').toLowerCase();
      }
      
      topicTriggers.forEach((trigger, index) => {
        const triggerTopic = trigger.getAttribute('data-topic').toLowerCase();
        const isActive = triggerTopic === defaultTopic;
        
        // Visuelles Feedback
        if (isActive) {
          trigger.classList.add('is-active');
        } else {
          trigger.classList.remove('is-active');
        }
        
        // ARIA-Attribute auf Tab-Element setzen
        const parentTabItem = trigger.closest('.swiper-slide');
        if (parentTabItem) {
          parentTabItem.setAttribute('aria-selected', isActive ? 'true' : 'false');
        }
        
        if (isActive) {
          const evt = new CustomEvent('topicChange', { detail: { topic: defaultTopic, manual: false } });
          document.dispatchEvent(evt);
          
          setTimeout(() => {
            if (window.topicSwiper) {
              window.topicSwiper.slideTo(index);
            }
          }, 100);
        }
      });
    });
    
  /******************************************************************************
   * TOPIC BANNER ANIMATION
   *****************************************************************************/
  let topicBannerTl;
  document.addEventListener('topicChange', function(e) {
      if (!e.detail.manual) return;
      if (topicBannerTl) topicBannerTl.kill();
      const bannerEl = document.querySelector('.topic_banner');
      if (!bannerEl) return;
      const newTopic = e.detail.topic;
      const bannerText = document.getElementById('topic-banner-text');
      if (bannerText) {
        bannerText.textContent = newTopic;
      }
      topicBannerTl = gsap.timeline();
      topicBannerTl.set(bannerEl, {
        y: '-20vh',
        opacity: 0,
        filter: 'blur(40px)',
        display: 'block'
      });
      topicBannerTl.to(bannerEl, {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.4,
        ease: 'power2.out'
      });
      topicBannerTl.to(bannerEl, { duration: 2 });
      topicBannerTl.to(bannerEl, {
        y: '-20vh',
        opacity: 0,
        filter: 'blur(40px)',
        duration: 0.3,
        onComplete: function() {
          bannerEl.style.display = 'none';
        }
      });
    });
    
    
  /******************************************************************************
   * TOPIC SWIPER
   *****************************************************************************/
  document.addEventListener("DOMContentLoaded", function () {
      // ARIA-Rollen für alle Swiper korrigieren
      function correctSwiperARIARoles() {
        // Korrektur für den Topic-Filter (Tabs)
        const topicWrapper = document.querySelector('.swiper-wrapper.is-topic');
        if (topicWrapper) {
          // Topic Filter braucht ein Tablist/Tab Modell
          topicWrapper.setAttribute('role', 'tablist');
          
          // Die Slides selbst sind jetzt die Tabs (nicht mehr presentation)
          const topicSlides = topicWrapper.querySelectorAll('.swiper-slide');
          topicSlides.forEach(slide => {
            slide.setAttribute('role', 'tab');
            // Initialen aria-selected Zustand setzen, falls nicht schon gesetzt
            if (!slide.hasAttribute('aria-selected')) {
              slide.setAttribute('aria-selected', 'false');
            }
          });
          
          // Setze das erste Slide als selected, falls keines selected ist
          const anySelected = Array.from(topicSlides).some(slide => 
            slide.getAttribute('aria-selected') === 'true');
          if (!anySelected && topicSlides.length > 0) {
            topicSlides[0].setAttribute('aria-selected', 'true');
          }
        }
      }
  
      window.topicSwiper = new Swiper('.swiper.is-topic', {
        slidesPerView: 1.5,
        spaceBetween: 0,
        rewind: true,
        navigation: {
          nextEl: '.topic_next-btn',
          prevEl: '.topic_prev-btn',
        },
        keyboard: {
          enabled: true,
          onlyInViewport: true,
        },
        breakpoints: {
          389: {
            slidesPerView: 2.5,
          },
          480: {
            slidesPerView: 2.5,
          },
          768: {
            slidesPerView: 3,
          },
        },
        on: {
          init: correctSwiperARIARoles,
          // Falls Swiper die Rollen bei Updates zurücksetzt
          update: correctSwiperARIARoles
        }
      });
      
      // Verzögerter Check für den Fall, dass Swiper die Attribute nach der Initialisierung überschreibt
      setTimeout(correctSwiperARIARoles, 1000);
    });
    
    
  /******************************************************************************
   * TOPIC CHANGE LISTENER FOR HERO_IMG
   *****************************************************************************/
  document.addEventListener("DOMContentLoaded", function() {
      const heroDataEls = document.querySelectorAll('.hero_cms-data[data-topic][data-hero-url]');
      const topicToImageMap = {};
      heroDataEls.forEach(el => {
        const key = el.getAttribute('data-topic').toLowerCase();
        const url = el.getAttribute('data-hero-url');
        topicToImageMap[key] = url;
      });
      const heroImg = document.querySelector('.hero_img');
      if (!heroImg) return;
      const urlParams = new URLSearchParams(window.location.search);
      const paramTopic = urlParams.get('topic');
    
      if (paramTopic && heroImg && topicToImageMap[paramTopic.toLowerCase()]) {
        const newUrl = topicToImageMap[paramTopic.toLowerCase()];
        const tempImg = new Image();
        tempImg.src = newUrl;
        tempImg.onload = function() {
          heroImg.removeAttribute("srcset");
          heroImg.removeAttribute("sizes");
          heroImg.src = newUrl;
          // topic hero img visibility
          heroImg.style.visibility = "visible";
          heroImg.style.opacity = "1";
        };
      } else {
        // default hero img visibility
        heroImg.style.visibility = "visible";
        heroImg.style.opacity = "1";
      }
    
      document.addEventListener('topicChange', function(e) {
        const sel = e.detail.topic.toLowerCase();
        if (topicToImageMap[sel] && heroImg) {
          const temp = new Image();
          temp.src = topicToImageMap[sel];
          temp.onload = function() {
            heroImg.removeAttribute("srcset");
            heroImg.removeAttribute("sizes");
            heroImg.src = temp.src;
            heroImg.classList.remove("scaleup");
            void heroImg.offsetWidth;
            heroImg.classList.add("scaleup");
          };
        }
      });
    });
    
    
  /******************************************************************************
   * TOPIC CHANGE LISTENER FOR QUOTE_IMG
   *****************************************************************************/
  document.addEventListener("DOMContentLoaded", function() {
      const quoteDataEls = document.querySelectorAll('.quote_cms-data[data-topic][data-quote-url]');
      const topicToQuoteMap = {};
      quoteDataEls.forEach(el => {
        const key = el.getAttribute('data-topic').toLowerCase();
        const url = el.getAttribute('data-quote-url');
        topicToQuoteMap[key] = url;
      });
    
      const quoteImg = document.querySelector('.quote_img');
      if (!quoteImg) return;
    
      const urlParams = new URLSearchParams(window.location.search);
      const paramTopic = urlParams.get('topic');
      if (paramTopic && topicToQuoteMap[paramTopic.toLowerCase()]) {
        const newUrl = topicToQuoteMap[paramTopic.toLowerCase()];
        const tempImg = new Image();
        tempImg.src = newUrl;
        tempImg.onload = function() {
          quoteImg.removeAttribute("srcset");
          quoteImg.removeAttribute("sizes");
          quoteImg.src = newUrl;
        };
      }
    
      document.addEventListener('topicChange', function(e) {
        const sel = e.detail.topic.toLowerCase();
        if (topicToQuoteMap[sel]) {
          const temp = new Image();
          temp.src = topicToQuoteMap[sel];
          temp.onload = function() {
            quoteImg.removeAttribute("srcset");
            quoteImg.removeAttribute("sizes");
            quoteImg.src = temp.src;
          };
        }
      });
    });
    
    
  /******************************************************************************
   * TOPIC CHANGE LISTENER FOR GALLERY
   *****************************************************************************/
  document.addEventListener('topicChange', function(e) {
      const selectedTopic = e.detail.topic;
      function applyTopicFilter() {
        if (!window.gallerySwiper) return false;
        let targetIndex = 0;
        window.gallerySwiper.slides.forEach((slide, idx) => {
          const slideTopic = (slide.getAttribute('data-topic-target') || slide.getAttribute('data-gallery-id') || "").toLowerCase();
          if (slideTopic === selectedTopic && targetIndex === 0) {
            targetIndex = idx;
          }
        });
        window.gallerySwiper.slideTo(targetIndex);
        
        // Verbesserte Handling von gallery_tabs Elementen
        const galleryTabs = document.querySelectorAll('.gallery_tabs');
        galleryTabs.forEach(tab => {
          // Visuelles Feedback - is-custom-current Klasse
          tab.classList.remove('is-custom-current');
          const tabTopic = (tab.getAttribute('data-topic-target') || tab.getAttribute('data-gallery-id') || "").toLowerCase();
          if (tabTopic === selectedTopic) {
            tab.classList.add('is-custom-current');
          }
          
          // Suche das übergeordnete Element mit role="tab", falls vorhanden
          const parentTab = tab.closest('[role="tab"]');
          if (parentTab) {
            // Setze aria-selected auf dem korrekten Tab-Element
            parentTab.setAttribute('aria-selected', tabTopic === selectedTopic ? 'true' : 'false');
            // Entferne aria-selected vom Kind-Element, um Konflikte zu vermeiden
            tab.removeAttribute('aria-selected');
          } else {
            // Fallback: Wenn kein übergeordnetes Tab-Element gefunden wurde
            tab.setAttribute('aria-selected', tabTopic === selectedTopic ? 'true' : 'false');
          }
        });
        return true;
      }
      if (!applyTopicFilter()) {
        setTimeout(applyTopicFilter, 300);
      }
    });
    
    
  /******************************************************************************
   * NAV SHOW/HIDE
   *****************************************************************************/
  (function () {
      /**
       * Optimierte Throttle-Funktion für Scroll-Events
       * - Garantiert erste und letzte Ausführung
       * - Nutzt requestAnimationFrame für Browser-Optimierung
       * 
       * @param {Function} fn Auszuführende Funktion
       * @param {Number} limit Zeit zwischen Aufrufen in ms
       * @return {Function} Throttled Funktion
       */
      function createThrottledFunction(fn, limit = 100) {
        let lastFunc;
        let lastRan;
        let ticking = false;
        
        return function() {
          const context = this;
          const args = arguments;
          
          // rAF für Browser-Optimierung
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(() => {
              ticking = false;
            });
          } else {
            return;
          }
          
          // Erste Ausführung sofort
          if (!lastRan) {
            fn.apply(context, args);
            lastRan = Date.now();
            return;
          }
          
          clearTimeout(lastFunc);
          
          const delta = Date.now() - lastRan;
          
          // Verzögerte oder sofortige Ausführung
          if (delta < limit) {
            lastFunc = setTimeout(() => {
              fn.apply(context, args);
              lastRan = Date.now();
            }, limit - delta);
          } else {
            fn.apply(context, args);
            lastRan = Date.now();
          }
        };
      }
  
      // Anfängliches Einblenden der Navbar-Komponente (die im CSS ausgeblendet ist)
      const navbarComponent = document.querySelector(".navbar_component");
      if (navbarComponent) {
        // Nach einem kurzen Delay einblenden (nach dem Hero-Heading)
        setTimeout(() => {
          // Transition hinzufügen, bevor Werte geändert werden
          navbarComponent.style.transition = "opacity 300ms ease-out, visibility 300ms ease-out";
          navbarComponent.style.visibility = "visible";
          navbarComponent.style.opacity = "1";
        }, 200); // Etwas verzögert nach der Hero-Animation
      }
    
      // Ursprüngliche Scroll-Funktionalität für das Ein-/Ausblenden der Nav-Elemente
      const navBg = document.querySelector(".navbar_bg-layer");
      const navMenu = document.querySelector(".navbar_menu");
      const hero = document.querySelector("#hero");
      
      // Logo-Elemente für Farbänderung
      const logoLink = document.querySelector(".navbar_logo-link");
      const logoElement = document.querySelector(".navbar_logo");
      const logoSvg = document.querySelector(".navbar_logo-svg");
      
      if (!navBg || !navMenu || !hero) return;
    
      // Farbvariable aus dem data-Attribut des Logo-Links auslesen
      const heroLogoColorAttr = logoLink ? logoLink.getAttribute("data-logo-color-at-hero") : null;
      let navVisible = false;
      let logoIsCustomColor = false;
    
      // Hilfsfunktionen für die Logo-Farbe
      function setLogoHeroColor() {
        if (!heroLogoColorAttr || logoIsCustomColor) return;
        
        // Wir ändern nur die Farbe der sichtbaren Elemente, nicht des Link-Wrappers
        // Die vollständige CSS-Variable aus dem Attribut verwenden
        if (logoElement) {
          logoElement.style.transition = "color 300ms ease-out"; // Gleiche Transitions wie die Navbar
          logoElement.style.color = heroLogoColorAttr; // Direkt den Wert verwenden
        }
        
        if (logoSvg) {
          logoSvg.style.transition = "color 300ms ease-out";
          logoSvg.style.color = heroLogoColorAttr; // Direkt den Wert verwenden
        }
        
        logoIsCustomColor = true;
      }
    
      function resetLogoColor() {
        if (!logoIsCustomColor) return;
        
        if (logoElement) logoElement.style.color = "";
        if (logoSvg) logoSvg.style.color = "";
        
        logoIsCustomColor = false;
      }
    
      function showNav() {
        navBg.classList.add('is-active');
        navMenu.classList.add('is-active');
        resetLogoColor(); // Logo auf Standardfarbe zurücksetzen wenn Nav eingeblendet wird
      }
    
      function hideNav() {
        navBg.classList.remove('is-active');
        navMenu.classList.remove('is-active');
        setLogoHeroColor(); // Spezielle Hero-Farbe wenn Nav ausgeblendet ist
      }
    
      function checkNavVisibility() {
        const isMobile = window.innerWidth < 992;
        const threshold = window.innerHeight * (isMobile ? 0.4 : 0.8);
        const shouldShow = window.scrollY >= threshold;
        if (shouldShow !== navVisible) {
          if (shouldShow) {
            showNav();
          } else {
            hideNav();
          }
          navVisible = shouldShow;
        }
      }
    
      // Optimierte Scroll-Event-Registrierung mit Throttling (66ms ≈ 15fps)
      // Dies reduziert die CPU-Last erheblich, ohne wahrnehmbare Verzögerung zu verursachen
      const throttledCheckNavVisibility = createThrottledFunction(checkNavVisibility, 66);
      window.addEventListener("scroll", throttledCheckNavVisibility, { passive: true });
      
      // Initialisierung
      checkNavVisibility(); // Hier unthrottled für sofortige initiale Prüfung
      
      // Initiale Farbeinstellung für das Logo im Hero-Bereich
      if (!navVisible && heroLogoColorAttr) {
        setLogoHeroColor();
      }
    })();
    
    
  /******************************************************************************
   * POPUP-SKRIPT MIT ATTRIBUTEN
   *****************************************************************************/
  document.addEventListener("DOMContentLoaded", function () {
    
      function openPopup(targetPopup) {
        if (!targetPopup) return;
        
        const previouslyFocused = document.activeElement;
        targetPopup.setAttribute('data-previous-focus', previouslyFocused ? previouslyFocused.id || 'document.body' : 'document.body');
        
        targetPopup.setAttribute("aria-hidden", "false");
        targetPopup.setAttribute("aria-modal", "true");
        
        targetPopup.removeAttribute("inert");
        
        document.body.classList.add("scroll-disable");
        
        targetPopup.classList.remove("hide");
        
        targetPopup.style.opacity = "0";
        targetPopup.style.transition = "opacity 300ms ease-in-out";
        
        requestAnimationFrame(() => {
          targetPopup.style.opacity = "1";
          
          setTimeout(() => {
            const closeButton = targetPopup.querySelector('[data-close-popup="true"] button');
            if (closeButton) {
              closeButton.focus();
            } else {
              const focusableElements = targetPopup.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
              if (focusableElements.length > 0) {
                focusableElements[0].focus();
              }
            }
          }, 100);
        });
      }
    
      function closePopup(targetPopup) {
        if (!targetPopup) return;
        
        const focusedElement = document.activeElement;
        if (focusedElement && targetPopup.contains(focusedElement)) {
          focusedElement.blur();
        }
        
        targetPopup.setAttribute("aria-hidden", "true");
        targetPopup.removeAttribute("aria-modal");
        
        targetPopup.setAttribute("inert", "");
        
        document.body.classList.remove("scroll-disable");
        
        targetPopup.style.opacity = "0";
        targetPopup.addEventListener("transitionend", () => {
          targetPopup.classList.add("hide");
          
          setTimeout(() => {
            const previousFocusId = targetPopup.getAttribute('data-previous-focus');
            if (previousFocusId) {
              if (previousFocusId === 'document.body') {
                document.body.focus();
              } else {
                const previousElement = document.getElementById(previousFocusId);
                if (previousElement) {
                  previousElement.focus();
                }
              }
            }
          }, 10);
        }, { once: true });
      }
    
      function bindPopupTriggers() {
        const triggers = document.querySelectorAll("[data-open-popup]");
        triggers.forEach((trigger) => {
          const clone = trigger.cloneNode(true);
          trigger.replaceWith(clone);
        });
    
        const freshTriggers = document.querySelectorAll("[data-open-popup]");
        freshTriggers.forEach((trigger) => {
          trigger.addEventListener("click", function (event) {
            // Ignoriere diesen Klick, wenn es über ein Delete-Element kommt
            if (event.target.closest('[data-room-delete]') || event.target.closest('[data-offer-delete]')) {
              return;
            }
            
            const popupName = this.getAttribute("data-open-popup");
            const targetPopup = document.querySelector(`[data-popup="${popupName}"]`);
            if (targetPopup) {
              event.preventDefault();
              openPopup(targetPopup);
            }
          });
        });
      }
    
      bindPopupTriggers();
    
      if (window.fsAttributes) {
        window.fsAttributes.push([
          "cmsnest",
          () => {
            bindPopupTriggers();
          },
        ]);
      }
    
      document.querySelectorAll("[data-close-popup='true']").forEach((closer) => {
        closer.addEventListener("click", function (e) {
          const targetPopup = this.closest("[data-popup]");
          if (targetPopup) {
            closePopup(targetPopup);
          }
        });
      });
    
      document.addEventListener('click', function(e) {
        const linkElement = e.target.closest('a[href^="#"]');
        if (linkElement && linkElement.closest('[data-close-popup="true"]')) {
          const targetPopup = linkElement.closest("[data-popup]");
          if (targetPopup) {
            closePopup(targetPopup);
            const href = linkElement.getAttribute('href');
            setTimeout(() => {
              const targetElement = document.querySelector(href);
              if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
              }
            }, 310); 
            e.preventDefault();
          }
        }
      }, true);
    
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          const activePopup = document.querySelector('[aria-modal="true"]');
          if (activePopup) {
            closePopup(activePopup);
          }
        }
      });
    });
    
    
  /******************************************************************************
   * MAIN BILDERGALERIE MIT SWIPER
   *****************************************************************************/
  document.addEventListener("DOMContentLoaded", function () {
      const sliderEl = document.querySelector('.swiper.is-gallery');
      if (!sliderEl) return;
      
      const wrapper = sliderEl.querySelector('.swiper-wrapper.is-gallery');
      if (!wrapper) return;
    
      const templateSlide = wrapper.querySelector('.swiper-slide.is-gallery');
      if (templateSlide) templateSlide.remove();
    
      const categoriesData = document.querySelectorAll('.gallery_collection-item .gallery_data');
      
      // "triggerElements" (Ebene 3)
      // Diese Elemente sind nicht die eigentlichen Tabs, sondern nur Trigger
      const triggerElements = document.querySelectorAll('.gallery_tabs');
      
      // Finde die tatsächlichen Tab-Elemente (Ebene 2)
      const tabItems = document.querySelectorAll('.gallery_tabs-collection-item');
  
      categoriesData.forEach((categoryEl) => {
        const categoryId = categoryEl.getAttribute('data-gallery-id');
        const imageEls = categoryEl.querySelectorAll('.gallery_img-url[data-img-url]');
        imageEls.forEach((imgEl) => {
          const imgURL = imgEl.getAttribute('data-img-url');
          if (imgURL) {
            const slide = document.createElement('div');
            slide.classList.add('swiper-slide', 'is-gallery', 'swiper-backface-hidden');
            slide.setAttribute('data-gallery-id', categoryId);
            slide.setAttribute('data-topic-target', categoryId.toLowerCase());
            const img = document.createElement('img');
            img.src = imgURL;
            img.loading = "lazy";
            img.classList.add('gallery_img');
            slide.appendChild(img);
            wrapper.appendChild(slide);
          }
        });
      });
    
      window.gallerySwiper = new Swiper('.swiper.is-gallery', {
        ...swiperAnimationConfig,
        slidesPerView: 1.2,
        spaceBetween: 16,
        centeredSlides: false,
        initialSlide: 0,
        rewind: true,
        navigation: {
          nextEl: '.gallery_next-btn',
          prevEl: '.gallery_prev-btn',
        },
        keyboard: { enabled: true, onlyInViewport: true },
        breakpoints: {
          480: {
            slidesPerView: 2.2,
            spaceBetween: 16,
            centeredSlides: false,
            initialSlide: 0
          },
          992: {
            slidesPerView: 2,
            spaceBetween: 32,
            centeredSlides: true,
            initialSlide: 1
          },
        },
      });
    
      function updateActiveTab() {
        const activeSlide = window.gallerySwiper.slides[window.gallerySwiper.activeIndex];
        const activeCategory = activeSlide.getAttribute('data-gallery-id');
        
        // Zuerst alle visuellen Hervorhebungen zurücksetzen
        triggerElements.forEach(trigger => trigger.classList.remove('is-custom-current'));
        
        // Dann das entsprechende Trigger-Element visuell hervorheben
        const activeTrigger = document.querySelector(`.gallery_tabs[data-gallery-id="${activeCategory}"]`);
        if (activeTrigger) {
          activeTrigger.classList.add('is-custom-current');
        }
        
        // ARIA-Attribute korrekt auf den tatsächlichen Tab-Elementen (Ebene 2) setzen
        tabItems.forEach(tabItem => {
          const childTrigger = tabItem.querySelector(`.gallery_tabs[data-gallery-id]`);
          if (childTrigger) {
            const tabCategory = childTrigger.getAttribute('data-gallery-id');
            const isActive = tabCategory === activeCategory;
            
            // ARIA nur auf dem Tab-Element (Ebene 2) setzen
            tabItem.setAttribute('aria-selected', isActive ? 'true' : 'false');
            
            // Sicherstellen, dass das Trigger-Element (Ebene 3) kein aria-selected hat
            childTrigger.removeAttribute('aria-selected');
          }
        });
      }
    
      // Event-Listener für Klicks auf Trigger-Elemente
      triggerElements.forEach((trigger) => {
        trigger.addEventListener('click', function () {
          const targetCategory = trigger.getAttribute('data-gallery-id');
          const allSlides = wrapper.querySelectorAll('.swiper-slide.is-gallery');
          let targetIndex = 0;
          
          allSlides.forEach((slide, idx) => {
            if (slide.getAttribute('data-gallery-id') === targetCategory && targetIndex === 0) {
              targetIndex = idx;
            }
          });
          
          window.gallerySwiper.slideTo(targetIndex);
          
          // ARIA-Fix: Setze ARIA-Attribute NUR auf Ebene 2-Elementen (Tab-Items)
          // Finde zuerst das übergeordnete Tab-Element für diesen Trigger
          const parentTabItem = trigger.closest('[role="tab"]') || trigger.closest('.gallery_tabs-collection-item');
          
          if (parentTabItem) {
            // Alle Tab-Elemente zurücksetzen
            tabItems.forEach(item => {
              item.setAttribute('aria-selected', 'false');
            });
            
            // Das aktive Tab-Element auf true setzen
            parentTabItem.setAttribute('aria-selected', 'true');
            
            // Sicherstellen, dass Trigger-Elemente kein aria-selected haben
            triggerElements.forEach(t => t.removeAttribute('aria-selected'));
          }
          
          updateActiveTab();
        });
      });
      
      window.gallerySwiper.on('slideChange', updateActiveTab);
      updateActiveTab();
    });
    
    
  /******************************************************************************
   * SWIPER Testimonials
   *****************************************************************************/
  document.addEventListener("DOMContentLoaded", function () {
      const swiper = new Swiper('.swiper.is-reviews', {
        effect: 'fade',
        fadeEffect: {
          crossFade: true,
        },
        autoHeight: true,
        slidesPerView: 1,
        spaceBetween: 32,
        rewind: true,
        navigation: {
          nextEl: '.reviews_next-btn',
          prevEl: '.reviews_prev-btn',
        },
        pagination: {
          el: '.reviews_bullets-wrapper',
          clickable: true,
          bulletClass: 'reviews_bullet',
          bulletActiveClass: 'is-current',
        },
        keyboard: {
          enabled: true,
          onlyInViewport: true,
        },
        breakpoints: {
          992: {
            slidesPerView: 1,
            spaceBetween: 32,
          },
        },
      });
    });
    
    
  /******************************************************************************
   * OFFERS TABS & SWIPER
   *****************************************************************************/
  document.addEventListener('DOMContentLoaded', () => {
      const offersSection = document.querySelector('.section_offers');
      if (!offersSection) return;
    
      // Tablist (Ebene 1)
      const tabList = offersSection.querySelector('[data-tab-list]');
      
      // Tab-Items (Ebene 2) - diese sollten role="tab" haben
      const tabItems = offersSection.querySelectorAll('.offers_tabs-collection-item');
      
      // Trigger-Elemente (Ebene 3) - diese sollten KEINE ARIA-Attribute haben
      const triggerElements = offersSection.querySelectorAll('[data-tab]');
      
      // Inhalte der Tabs
      const tabContents = offersSection.querySelectorAll('[data-target-tab]');
      
      // Prüfe auf leere Tabs und blende sie aus
      function hideEmptyTabs() {
        let visibleTabCount = 0;
        let firstVisibleTabId = null;
        
        // Durchlaufe alle Tab-Trigger und prüfe die zugehörigen Inhalte
        triggerElements.forEach(trigger => {
          const tabId = trigger.getAttribute('data-tab');
          if (!tabId) return;
          
          const tabContent = offersSection.querySelector(`[data-target-tab="${tabId}"]`);
          if (!tabContent) return;
          
          const tabPane = tabContent.querySelector('.w-dyn-list');
          if (!tabPane) return;
          
          // Prüfe, ob "No items found" Text vorhanden ist oder keine Items in der Liste sind
          const emptyMessage = tabPane.querySelector('.w-dyn-empty');
          const hasItems = tabPane.querySelector('.w-dyn-items')?.children.length > 0;
          
          const isEmpty = (emptyMessage && getComputedStyle(emptyMessage).display !== 'none') || !hasItems;
          
          if (isEmpty) {
            // Verstecke den Tab-Trigger (und sein übergeordnetes Element)
            const tabItem = trigger.closest('.offers_tabs-collection-item');
            if (tabItem) tabItem.style.display = 'none';
          } else {
            visibleTabCount++;
            if (!firstVisibleTabId) firstVisibleTabId = tabId;
          }
        });
        
        // Wenn es keine sichtbaren Tabs gibt, gesamte Sektion ausblenden
        if (visibleTabCount === 0) {
          offersSection.style.display = 'none';
        } else if (firstVisibleTabId) {
          // Setze den ersten sichtbaren Tab als aktiv
          setActiveTab(firstVisibleTabId);
          initSwiper(firstVisibleTabId);
        }
        
        return { visibleTabCount, firstVisibleTabId };
      }
  
      // Setze role="tablist" auf das Tablist-Element
      if (tabList) {
        tabList.setAttribute('role', 'tablist');
      }
  
      let currentSwiper = null;
  
      function setActiveTab(tabId) {
        // Visuelles Feedback für Trigger-Elemente zurücksetzen
        triggerElements.forEach(trigger => {
          trigger.classList.remove('is-custom-current');
        });
        
        // ARIA-Attribute auf Tab-Elementen (Ebene 2) zurücksetzen
        tabItems.forEach(tabItem => {
          // Das tatsächliche Tab-Element erhält aria-selected="false"
          tabItem.setAttribute('aria-selected', 'false');
          
          // Sicherstellen, dass eventuell vorhandene Trigger-Elemente kein aria-selected haben
          const childTrigger = tabItem.querySelector('[data-tab]');
          if (childTrigger) {
            childTrigger.removeAttribute('aria-selected');
          }
        });
        
        // Tab-Inhalte ausblenden
        tabContents.forEach(content => {
          content.classList.add('hide');
          content.setAttribute('aria-hidden', 'true');
        });
  
        // Aktiven Trigger finden
        const activeTrigger = offersSection.querySelector(`[data-tab="${tabId}"]`);
        if (!activeTrigger) return;
        
        // Visuelles Feedback für aktiven Trigger
        activeTrigger.classList.add('is-custom-current');
        
        // ARIA-Attribute für übergeordnetes Tab-Element setzen
        const parentTabItem = activeTrigger.closest('[role="tab"]') || 
                              activeTrigger.closest('.offers_tabs-collection-item');
        if (parentTabItem) {
          parentTabItem.setAttribute('aria-selected', 'true');
        }
        
        // Zugehörigen Inhalt anzeigen
        const activeContent = offersSection.querySelector(`[data-target-tab="${tabId}"]`);
        if (activeContent) {
          activeContent.classList.remove('hide');
          activeContent.setAttribute('aria-hidden', 'false');
        }
      }
  
      function initSwiper(tabId) {
        if (currentSwiper) {
          currentSwiper.destroy();
          currentSwiper = null;
        }
        const container = offersSection.querySelector(`[data-swiper="${tabId}"]`);
        if (!container) return;
        
        // Prüfe, ob der Container leer ist
        const emptyMessage = container.querySelector('.w-dyn-empty');
        const hasItems = container.querySelector('.w-dyn-items')?.children.length > 0;
        
        if ((emptyMessage && getComputedStyle(emptyMessage).display !== 'none') || !hasItems) {
          return; // Initialisiere den Swiper nicht für leere Container
        }
  
        currentSwiper = new Swiper(container, {
          ...swiperAnimationConfig,
          autoHeight: false,
          slidesPerView: 1.2,
          spaceBetween: 16,
          rewind: false,
          navigation: {
            nextEl: '.offers_next-btn',
            prevEl: '.offers_prev-btn',
          },
          pagination: {
            el: '.offers_bullets-wrapper',
            clickable: true,
            bulletClass: 'offers_bullet',
            bulletActiveClass: 'is-current',
          },
          keyboard: {
            enabled: true,
            onlyInViewport: true,
          },
          breakpoints: {
            790: {
              slidesPerView: 2,
              spaceBetween: 32,
            },
            1150: {
              slidesPerView: 2,
              spaceBetween: 32,
            },
            1440: {
              slidesPerView: 2,
              spaceBetween: 48,
            },
          },
        });
      }
  
      // Zuerst leere Tabs prüfen und ausblenden
      const { visibleTabCount, firstVisibleTabId } = hideEmptyTabs();
      
      // Wenn es sichtbare Tabs gibt, Event-Listener für Klicks hinzufügen
      if (visibleTabCount > 0) {
        triggerElements.forEach(trigger => {
          // Nur für sichtbare Tabs Event-Listener hinzufügen
          if (trigger.closest('.offers_tabs-collection-item')?.style.display !== 'none') {
            trigger.addEventListener('click', () => {
              const tabId = trigger.getAttribute('data-tab');
              setActiveTab(tabId);
              initSwiper(tabId);
            });
          }
        });
      }
    });
    
    
  /******************************************************************************
   * SWIPER SOCIAL MEDIA REVIEWS
   *****************************************************************************/
  document.addEventListener("DOMContentLoaded", function () {
      const swiper = new Swiper('.swiper.is-sm-reviews', {
        ...swiperAnimationConfig,
        autoHeight: false,
        slidesPerView: 1.2,
        centeredSlides: true,
        initialSlide: 1,
        spaceBetween: 16,
        rewind: true,
        navigation: {
          nextEl: '.sm-reviews_next-btn',
          prevEl: '.sm-reviews_prev-btn',
        },
        keyboard: {
          enabled: true,
          onlyInViewport: true,
        },
        breakpoints: {
          630: {
            slidesPerView: 1.5,
            spaceBetween: 24,
          },
          992: {
            slidesPerView: 2.2,  
            spaceBetween: 24,    
          },
          1140: {
            centeredSlides: false,
            slidesPerView: 2,
            spaceBetween: 24,
          },
        },
      });
    });
    
    
  /******************************************************************************
   * POPUP GALLERY SWIPER MIT THUMBS
   *****************************************************************************/
  document.addEventListener("DOMContentLoaded", function () {
      document.querySelectorAll('.popup_gallery').forEach(container => {
        // Cache häufig verwendete DOM-Elemente
        const mainSliderEl = container.querySelector('.swiper.is-popup');
        const thumbsSliderEl = container.querySelector('.swiper.is-popup-thumbs');
        const imgWrapper = container.querySelector('.popup_gallery-img-wrapper');
        const navPrev = container.querySelector('.popup_gallery-prev-btn');
        const navNext = container.querySelector('.popup_gallery-next-btn');
  
        if (!mainSliderEl) {
          console.error('Kein Hauptslider-Element (.swiper.is-popup) im Container gefunden.');
          return;
        }
  
        const mainWrapper = mainSliderEl.querySelector('.swiper-wrapper.is-popup');
        if (!mainWrapper) {
          console.error('Kein Wrapper im Hauptslider (.swiper-wrapper.is-popup) im Container gefunden.');
          return;
        }
        while (mainWrapper.firstChild) {
          mainWrapper.removeChild(mainWrapper.firstChild);
        }
  
        if (!thumbsSliderEl) {
          console.error('Kein Thumbs-Slider-Element (.swiper.is-popup-thumbs) im Container gefunden.');
          return;
        }
  
        const thumbsWrapper = thumbsSliderEl.querySelector('.swiper-wrapper.is-popup-thumbs');
        if (!thumbsWrapper) {
          console.error('Kein Wrapper im Thumbs-Slider (.swiper-wrapper.is-popup-thumbs) im Container gefunden.');
          return;
        }
        while (thumbsWrapper.firstChild) {
          thumbsWrapper.removeChild(thumbsWrapper.firstChild);
        }
  
        if (!imgWrapper) {
          console.error('Kein Bild-Wrapper (.popup_gallery-img-wrapper) im Container gefunden.');
          return;
        }
  
        const imgURLItems = imgWrapper.querySelectorAll('.popup_gallery-img-url[data-img-url]');
        if (!imgURLItems.length) {
          console.error('Keine Bild-URLs in .popup_gallery-img-url im Container gefunden.');
          return;
        }
        
        imgURLItems.forEach(item => {
          const imgURL = item.getAttribute('data-img-url');
          if (imgURL) {
            const slide = document.createElement('div');
            slide.classList.add('swiper-slide', 'is-popup');
            const img = document.createElement('img');
            img.src = imgURL;
            img.loading = "lazy";
            img.classList.add('popup_gallery-img');
            slide.appendChild(img);
            mainWrapper.appendChild(slide);
  
            const thumbSlide = document.createElement('div');
            thumbSlide.classList.add('swiper-slide', 'is-popup-thumbs');
            const thumbImg = document.createElement('img');
            thumbImg.src = imgURL;
            thumbImg.loading = "lazy";
            thumbImg.classList.add('popup_gallery-thumb-img');
            thumbSlide.appendChild(thumbImg);
            thumbsWrapper.appendChild(thumbSlide);
          }
        });
        
        if (!navPrev || !navNext) {
          console.warn('Navigationselemente (.popup_gallery-prev-btn / .popup_gallery-next-btn) im Container nicht gefunden.');
        }
  
        const thumbsSwiper = new Swiper(thumbsSliderEl, {
          slidesPerView: 4.4,
          spaceBetween: 8,
          freeMode: true,
          watchSlidesProgress: true,
          mousewheel: {
            forceToAxis: true,
            sensitivity: 1,
            releaseOnEdges: true,
          },
          breakpoints: {
            480: {
              slidesPerView: 5.3,
              spaceBetween: 8,
            },
          },
        });
  
        const mainSwiper = new Swiper(mainSliderEl, {
          slidesPerView: 1,
          spaceBetween: 16,
          navigation: navPrev && navNext ? {
            nextEl: navNext,
            prevEl: navPrev,
          } : false,
          keyboard: {
            enabled: true,
            onlyInViewport: true,
          },
          mousewheel: {
            forceToAxis: true,
            sensitivity: 1,
            releaseOnEdges: true,
            thresholdDelta: 10,
          },
          thumbs: {
            swiper: thumbsSwiper
          },
          breakpoints: {
            480: {
              slidesPerView: 1,
              spaceBetween: 16,
            },
            992: {
              slidesPerView: 1,
              spaceBetween: 32,
            },
          },
        });
      });
    });
    
    
  /******************************************************************************
   * OFFERS TO FORM
   *****************************************************************************/
  document.addEventListener('click', function(e) {
      // Cache häufig verwendete DOM-Elemente
      const offerElement = document.querySelector('[data-offer-element]');
      const wrapper = document.querySelector('[data-room-offer-wrapper]');
      const offerInput = document.querySelector('[name="selected-offer"]');
      const offerNameTarget = document.querySelector('[data-offer-name-target]');
      const offerImgTarget = document.querySelector('[data-offer-image-target]');
  
      const offerBtn = e.target.closest('[data-custom="select-offer"]');
      if (offerBtn) {
        e.preventDefault();
        
        const popup = offerBtn.closest('[data-popup]');
        let card;
        let popupId;
        
        if (popup) {
          popupId = popup.getAttribute('data-popup');
          card = document.querySelector(`[data-popup-source="${popupId}"]`);
        } else {
          card = offerBtn.closest('.offers_card');
          const detailsBtn = card.querySelector('[data-open-popup]');
          if (detailsBtn) {
            popupId = detailsBtn.getAttribute('data-open-popup');
          }
        }
        
        if (!card) return;
        
        const nameEl = card.querySelector('[data-offer-name]');
        const imgEl = card.querySelector('[data-offer-image]');
        const name = nameEl ? nameEl.textContent.trim() : '';
        const img = imgEl ? imgEl.getAttribute('src') : '';
        
        if(offerNameTarget) {
          if (offerNameTarget.tagName === 'INPUT') {
            offerNameTarget.value = name;
          } else {
            offerNameTarget.textContent = name;
          }
        }
        
        if(offerImgTarget) offerImgTarget.src = img;
        if(offerInput) offerInput.value = name;
        
        if(offerElement) {
          offerElement.style.display = 'block';
          
          const offerButton = offerElement.querySelector('.form_r-o-wrapper[data-open-popup]');
          if (offerButton && popupId) {
            offerButton.setAttribute('data-open-popup', popupId);
          }
        }
        
        if(wrapper) wrapper.style.display = 'flex';
      }
      
      const offerDelete = e.target.closest('[data-offer-delete]');
      if (offerDelete) {
        e.preventDefault();
        e.stopPropagation();
        
        const event = e || window.event;
        if (event.stopImmediatePropagation) {
          event.stopImmediatePropagation();
        }
        
        if (offerElement) offerElement.style.display = 'none';
        if (offerInput) offerInput.value = '';
        // Zusätzliche Sicherheit: Falls offerNameTarget ein Input ist, auch diesen leeren
        if (offerNameTarget && offerNameTarget.tagName === 'INPUT') {
          offerNameTarget.value = '';
        }
        
        if (wrapper) wrapper.style.display = 'none';
        
        return false;
      }
    });
  
    
  /******************************************************************************
   * ZENTRALE ARIA-KORREKTUREN FÜR BARRIEREFREIHEIT
   *****************************************************************************/
  document.addEventListener("DOMContentLoaded", function() {
      /**
       * WICHTIGER HINWEIS ZUR ARIA-IMPLEMENTIERUNG:
       * 
       * Diese Seite nutzt eine "Zwei-Schichten-Strategie" für ARIA-Attribute:
       * 
       * 1. ARIAHelper (hier): Setzt initiale ARIA-Attribute und korrigiert sie nach Timer.
       *    Dies ist notwendig, weil Webflow und Swiper manchmal ARIA-Attribute überschreiben.
       * 
       * 2. Modulare Event-Handler: In den einzelnen Komponenten-Blöcken setzen diese
       *    ARIA-Attribute direkt bei Benutzerinteraktionen.
       * 
       * Beide Systeme sind notwendig für vollständige Accessibility-Konformität.
       * Das Entfernen einer der beiden Schichten kann zu Accessibility-Fehlern führen.
       */
      const ARIAHelper = {
        /**
         * Hilfsfunktionen zur konsistenten Verwaltung von ARIA-Attributen
         * - Standardisierte Benennungskonvention:
         *   - Ebene 1: tabList (container mit role="tablist")
         *   - Ebene 2: tabItems (elemente mit role="tab", bekommen aria-selected)
         *   - Ebene 3: triggerElements (klickbare elemente innerhalb der Tabs, KEINE aria-attribute)
         */
        setRole: function(selector, role, attributes = {}) {
          const elements = document.querySelectorAll(selector);
          if (elements.length === 0) return;
          
          elements.forEach(el => {
            el.setAttribute('role', role);
            Object.entries(attributes).forEach(([key, value]) => {
              el.setAttribute(key, value);
            });
          });
        },
        
        /**
         * Korrigiert Tab-bezogene ARIA-Attribute basierend auf der dreistufigen Hierarchie
         * @param {string} tabListSelector - Selektor für Tablist-Container (Ebene 1)
         * @param {string} tabItemsSelector - Selektor für Tab-Elemente (Ebene 2)
         * @param {string} triggerSelector - Selektor für Trigger-Elemente innerhalb der Tabs (Ebene 3)
         */
        setupTablist: function(tabListSelector, tabItemsSelector, triggerSelector) {
          // Tab-Listen (Ebene 1)
          const tabLists = document.querySelectorAll(tabListSelector);
          tabLists.forEach(list => {
            list.setAttribute('role', 'tablist');
          });
          
          // Tab-Elemente (Ebene 2)
          const tabItems = document.querySelectorAll(tabItemsSelector);
          tabItems.forEach(tabItem => {
            // Tab-Element mit korrekter Rolle
            tabItem.setAttribute('role', 'tab');
            
            // Prüfe, ob das Tab aktiv ist (über CSS-Klasse oder Kind-Element)
            const isActive = tabItem.classList.contains('is-custom-current') || 
                             tabItem.classList.contains('is-active') ||
                             tabItem.querySelector('.is-custom-current, .is-active');
            
            // Setze aria-selected direkt auf dem Tab-Element
            tabItem.setAttribute('aria-selected', isActive ? 'true' : 'false');
          });
          
          // Trigger-Elemente (Ebene 3) - entferne ARIA-Attribute
          if (triggerSelector) {
            const triggers = document.querySelectorAll(triggerSelector);
            triggers.forEach(trigger => {
              // Trigger sollten keine ARIA-Tab-Attribute haben
              trigger.removeAttribute('aria-selected');
              
              // Bewahre Klassen für visuelles Feedback
              // Diese Klassen werden vom JS-Code für die Darstellung verwendet
            });
          }
        },
        
        /**
         * Korrigiert ARIA für Swiper-basierte Tabs
         * Bei Swiper ist die Struktur:
         * - Wrapper (Ebene 1, tabList)
         * - Slides (Ebene 2, tabItems)
         * - Buttons/Trigger (Ebene 3)
         */
        setupSwiperTabs: function() {
          // Topic-Filter Tabs (im Swiper)
          this.setupTablist(
            '.swiper-wrapper.is-topic', 
            '.swiper-wrapper.is-topic .swiper-slide',
            '.topic_button'
          );
          
          // Gewöhnliche Collection-basierte Tabs
          this.setupTablist(
            '.gallery_tabs-collection-list, .offers_tabs-collection-list',
            '.gallery_tabs-collection-item, .offers_tabs-collection-item',
            '.gallery_tabs, [class*="tabs"]:not([role="tab"])'
          );
        },
        
        /**
         * Korrigiert Swiper-Karussells für ARIA-Konformität
         * @param {string} wrapperSelector - Selektor für Swiper-Wrapper 
         * @param {string} slideSelector - Selektor für Slides innerhalb des Wrappers
         */
        setupCarousel: function(wrapperSelector, slideSelector) {
          const wrappers = document.querySelectorAll(wrapperSelector);
          if (wrappers.length === 0) return;
          
          wrappers.forEach(wrapper => {
            // Für Karussells ist role="region" semantisch korrekter als role="list"
            if (wrapper.getAttribute('role') === 'list' || !wrapper.getAttribute('role')) {
              wrapper.setAttribute('role', 'region');
              wrapper.setAttribute('aria-roledescription', 'carousel');
            }
            
            // Slides in Karussells sollten role="group" haben
            const slides = wrapper.querySelectorAll(slideSelector);
            slides.forEach(slide => {
              // Slides mit role="tab" behalten diese Rolle (für Swiper-Tabs)
              if (slide.getAttribute('role') !== 'tab') {
                slide.setAttribute('role', 'group');
                slide.setAttribute('aria-roledescription', 'slide');
              }
            });
          });
        },
  
        /**
         * Führt alle ARIA-Korrekturen aus
         */
        initAll: function() {
          // Tab-Systeme einrichten
          this.setupSwiperTabs();
          
          // Karusselle einrichten (nicht-Tab Swiper)
          this.setupCarousel(
            '.swiper-wrapper:not(.is-topic)',
            '.swiper-slide:not([role="tab"])'
          );
        }
      };
  
      // ARIA-Korrekturen anwenden
      ARIAHelper.initAll();
      
      // Bei dynamischen Änderungen oder AJAX-Navigationen erneut anwenden
      // z.B. nach Swiper-Initialisierung
      setTimeout(ARIAHelper.initAll.bind(ARIAHelper), 1000);
    });
