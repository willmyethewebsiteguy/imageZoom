/**
 * Version 1.0
 * Zoom Images For Squarespace
 * Copyright Will Myers
**/
(function () {
  const ps = {
    cssId: 'wm-image-zoom',
    cssFile: 'https://cdn.jsdelivr.net/gh/willmyethewebsiteguy/imageZoom@1.0/styles.min.css'
  };
  const defaults = {
    cursors:{
      dot:`<div class="zoom-follow-cursor circle"></div>`
    }
  };
  const utils = {
    /* Emit a custom event */
    emitEvent: function (type, detail = {}, elem = document) {
      // Make sure there's an event type
      if (!type) return;

      // Create a new event
      let event = new CustomEvent(type, {
        bubbles: true,
        cancelable: true,
        detail: detail,
      });

      // Dispatch the event
      return elem.dispatchEvent(event);
    },
    inIframe: function () {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    },
    preventPlugin: function(){
      let styles = window.getComputedStyle(document.body),
          prevent = (styles.getPropertyValue('--wm-img-zoom-edit-mode') === 'true');
      
      return (prevent && utils.inIframe());
    },
    debounce: function (fn) {
      // Setup a timer
      let timeout;

      // Return a function to run debounced
      return function () {
        // Setup the arguments
        let context = this;
        let args = arguments;

        // If there's a timer, cancel it
        if (timeout) {
          window.cancelAnimationFrame(timeout);
        }

        // Setup the new requestAnimationFrame()
        timeout = window.requestAnimationFrame(function () {
          fn.apply(context, args);
        });
      }
    },
    getPropertyValue: function(el, prop) {
      let styles = window.getComputedStyle(el),
          value = styles.getPropertyValue(prop);
      return value;
    },
    unescapeSlashes: function(str) {
      let parsedStr = str.replace(/(^|[^\\])(\\\\)*\\$/, "$&\\");
      parsedStr = parsedStr.replace(/(^|[^\\])((\\\\)*")/g, "$1\\$2");

      try {
        parsedStr = JSON.parse(`"${parsedStr}"`);
      } catch(e) {
        return str;
      }
      return parsedStr ;
    }
  }

  let WMImageZoom = (function(){

    let global = window.wmTabsSettings || {};

    function addCustomCursor(instance) {
      if (!utils.getPropertyValue(instance.settings.container, '--cursor')) return;
      if (instance.settings.container.querySelector('.zoom-follow-cursor')) return;
      let container = instance.settings.container,
          cursorEl = utils.getPropertyValue(instance.settings.container, '--cursor').trim();
      
      if (cursorEl.substring(0, 1) == '"') {
        cursorEl = utils.unescapeSlashes(cursorEl) // Unesacpe Slashes
          .slice(1, -1); // Remove surrounding quotes
      }

      if (defaults.cursors[cursorEl]) cursorEl = defaults.cursors[cursorEl];

      function addCursor(){
        container.insertAdjacentHTML('beforeend', cursorEl)
      }
      addCursor();

      
      //Follow Cursor
      let customCursor = instance.settings.customCursor;
      
      let showCursor = (e) => {
        container.classList.add('follow-cursor')
      }
      let moveCursor = (e)=> {        
        const rect = container.getBoundingClientRect();
        const mouseY = (e.clientY || e.touches[0].clientY) - rect.top;
        const mouseX = (e.clientX || e.touches[0].clientX) - rect.left;

        customCursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;

      }
      let hideCursor = (e) => {
        container.classList.remove('follow-cursor')
      }

      container.addEventListener('mouseenter', showCursor)
      container.addEventListener('mousemove', moveCursor);
      container.addEventListener('mouseleave', hideCursor)

    }
    
    function createHoverListener(instance) {
      let img = instance.settings.image,
          container = instance.settings.container,
          zoomLock = false;

      function cancelZoom() {
        container.classList.remove('active-zoom');
        allowZoom();
      }

      function preventZoom() {
        zoomLock = true;
      }
      function allowZoom() {
        zoomLock = false;
      }
      function toggleZoomLock() {
        zoomLock = !zoomLock;
      }
      
      function initZoom(e) {
        if (zoomLock) return;
        
        //Cancel Zoom if more than two fingers moving
        if (e.touches?.length > 1) {
          cancelZoom();
          return;
        }
        
        //Cancel Zoom if Img is a link and touch is a finger (not stylus)
        if (e.target.closest('a') && e.touches?.[0]) return;
        e.preventDefault();
        e.stopPropagation();

        container.classList.add('active-zoom');
        let rect = container.getBoundingClientRect();
        // Mouse position
        let x = (e.clientX || e.touches[0].clientX) - rect.left;
        let y = (e.clientY || e.touches[0].clientY) - rect.top;
        
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x > rect.width) x = rect.width;
        if (y > rect.height) y = rect.height;
      
        container.style.setProperty('--x-pos', `${x}px`);
        container.style.setProperty('--y-pos', `${y}px`);
      }

      container.addEventListener('mouseleave', cancelZoom);
      container.addEventListener('mousemove', initZoom);
      container.addEventListener('click', toggleZoomLock);

      container.addEventListener('touchstart', initZoom)
      container.addEventListener('touchmove', initZoom)
      container.addEventListener('touchend', cancelZoom)
      container.addEventListener('touchleave', cancelZoom)
    }

    function createResizeListener(instance) {
      function handleEvent() {
      }

      window.addEventListener("resize", handleEvent);
    }

    function createLoadListener(instance) {
      function handleEvent() {

      }

      window.addEventListener("load", handleEvent);
      window.addEventListener("DOMContentLoaded", handleEvent);
    }

    function getLocalSettings(el) {
      let localSettings = {},
          data = el.dataset;

      if (data.layout) localSettings.layout = data.layout;
      if (data.event) {
        if (data.event == "hover") data.event = "mouseover";
        localSettings.event = data.event;
      }

      return localSettings;
    }

    function Constructor(el, options = {}) {
      
      //Add CSS Function
      this.addCSS();
      let local = getLocalSettings(el);

      // Add Elements Obj
      this.settings = {
        container: el,
        get image() {
          return this.container.querySelector("img");
        },
        get customCursor() {
          return this.container.querySelector('.zoom-follow-cursor');
        }
      };
      
      // Add Custom Cursor
      addCustomCursor(this);

      // Add Loading Event Listener
      //createLoadListener(this);

      // Add Resize Event Listener
      //createResizeListener(this);

      // Create the Toggle event listener
      createHoverListener(this);

      el.wmImageZoom = {
        initilized: true,
        settings: this.settings,
      };
    }
    
    /**
     * Add CSS
     */
    Constructor.prototype.addCSS = function () {
      let cssFile = document.querySelector(`#${ps.cssId}-css`);
      function addCSSFile() {
        let url = `${ps.cssFile}`;
        let head = document.getElementsByTagName("head")[0],
            link = document.createElement("link");
        link.rel = "stylesheet";
        link.id = `${ps.cssId}-css`;
        link.type = "text/css";
        link.href = url;
        link.onload = function () {
          loaded();
        };

        head.prepend(link);
      }

      function loaded() {
        const event = new Event(`${ps.cssId}:css-loaded`);
        window.dispatchEvent(event);
        document.querySelector("body").classList.add(`#${ps.cssId}-css-loaded`);
      }

      if (!cssFile) {
        addCSSFile();
      } else {
        document.head.prepend(cssFile);
        loaded();
      }
    };
    
    return Constructor;
  }());

  let BuildFromImgBlock = (function(){
    
    function addClasses(instance) {
      instance.elements.images.forEach(img => {
        /*Main Class for Zoom Container*/
        img.parentElement.classList.add('wm-zoom-container');
        
        /*For Images within Gallery Section*/
        let dimensions = img.dataset.imageDimensions;
        if (dimensions) {
          let width  = parseInt(dimensions.split('x')[0]),
              height = parseInt(dimensions.split('x')[1]);
          
          //For LightBox Images
          if (width > height && img.closest('.gallery-lightbox-item-src')) {
            img.closest('.gallery-lightbox-item-src').classList.add('landscape')
          }
          //For Slideshow Images
          if (width > height && img.closest('.gallery-slideshow-item-src')) {
            img.closest('.gallery-slideshow-item-src').classList.add('landscape')
          }
        }
      })
    } 
    
    function Constructor(el, options = {}) {
      
      // Add Elements Obj
      this.elements = {
        block: el,
        get images() {
          return this.block.querySelectorAll(":not(.sqs-gallery-thumbnails) > img");
        },
        get isLightboxImage() {
          return this.block.querySelector('button.lightbox') ? true : false
        },
        get isLightboxSection() {
          return this.block.dataset.props ? JSON.parse(this.block.dataset.props)?.lightboxEnabled :false
        }
      };

      //Mark As Done
      this.elements.block.setAttribute('data-wm-image-zoom', '')

      /*If it's a Gallery section with a Lightbox*/
      if (this.elements.isLightboxSection) {
        let sectionID = this.elements.block.closest('.page-section').dataset['sectionId'],
            lightboxSection = document.querySelector(`[data-lightbox-section-id="${sectionID}"]`)
        this.elements.block = lightboxSection;
        this.elements.block.setAttribute('data-wm-image-zoom', '')
      }

    /*If it's an Image Block with a Lightbox*/
    if(this.elements.isLightboxImage) {

    }

      //Add Classes & Attributes
      addClasses(this)
      
      //Init
      this.elements.images.forEach(img => {
        new WMImageZoom(img.parentElement)
      })


    }

    return Constructor;
  })();
  
  function initImageZoom() {
    if (utils.preventPlugin()) return;
    
    //Build HTML from Selectors
    let initImageBlocks = document.querySelectorAll(`
    .sqs-block-image:not([data-wm-image-zoom]), 
    .sqs-block-product:not([data-wm-image-zoom]), 
    .gallery-block:not([data-wm-image-zoom]), 
    .gallery-grid--layout-grid:not([data-wm-image-zoom]), 
    .gallery-strips--layout-strips:not([data-wm-image-zoom]), 
    .gallery-section .gallery-masonry:not([data-wm-image-zoom]),
    .products-list .grid-item:not([data-wm-image-zoom]),
    .ProductItem-gallery-slides-item:not([data-wm-image-zoom])
    `);
    for (const el of initImageBlocks) {
      let value = utils.getPropertyValue(el, '--wm-image-zoom');
      if (value.includes('true')) {
        try {
          new BuildFromImgBlock(el)        
        } catch (err) {
          console.error('Problem building the Image Zoom From Image Block', err);
        }
      }
    }

    //Build HTML from Stacked Blocks 

    //From Raw HTML

  }

  initImageZoom();
  window.addEventListener('load', initImageZoom());
  window.wmImageZoomInit = function() { initImageZoom() };
})();
