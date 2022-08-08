/**
 * Version 0.1
 * Zoom Images For Squarespace
 * Copyright Will Myers
**/

(function () {
  const ps = {
    cssId: 'wm-image-zoom',
    cssFile: 'https://cdn.jsdelivr.net/gh/willmyethewebsiteguy/imageZoom@1.0.001/styles.min.css'
  };
  const defaults = {
    
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
    }
  }

  let WMImageZoom = (function(){

    let global = window.wmTabsSettings || {};

    /**
     * Create Hover Event Listener
     * @param  {Constructor} instance The current instantiation
     **/
    function createHoverListener(instance) {
      let img = instance.settings.image,
          container = instance.settings.container;

      function cancelZoom() {
        container.classList.remove('active-zoom');
      }
      
      function initZoom(e) {
        if (e.touches?.length > 1) {
          cancelZoom();
          return;
        }
        if (e.target.closest('a') && e.touches) return;
        
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

      container.addEventListener('mouseleave', cancelZoom)
      container.addEventListener('mousemove', initZoom)
      /*document.addEventListener('touchend', (e) => {
        if (container.contains(e.target)) return;
        cancelZoom()
      })*/

      container.addEventListener('touchstart', initZoom)
      container.addEventListener('touchmove', initZoom)
      container.addEventListener('touchend', cancelZoom)
      container.addEventListener('touchleave', cancelZoom)
    }

    /**
     * Create Resize Event Listener
     * @param  {Constructor} instance The current instantiation
     **/
    function createResizeListener(instance) {
      function handleEvent() {
      }

      window.addEventListener("resize", handleEvent);
    }

    /**
     * Create Page Load Event Listener
     * @param  {Constructor} instance The current instantiation
     **/
    function createLoadListener(instance) {
      function handleEvent() {

      }

      window.addEventListener("load", handleEvent);
      window.addEventListener("DOMContentLoaded", handleEvent);
    }

    /**
     * Set Data Attributes on Tabs Component
     * @param  {instance} The settings for this instance
     */
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

    /**
     * The constructor object
     * @param {String} selector The selector for the element to render into
     * @param {Object} options  User options and settings
     */
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
      };

      // Add Loading Event Listener
      createLoadListener(this);

      // Add Resize Event Listener
      createResizeListener(this);

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
      instance.elements.container.classList.add('wm-zoom-container');
      instance.elements.block.setAttribute('data-wm-image-zoom', '')
    }
    
    /**
     * The constructor object
     * @param {String} selector The selector for the element to render into
     * @param {Object} options  User options and settings
     */
    function Constructor(el, options = {}) {

      // Add Elements Obj
      this.elements = {
        block: el,
        get container() {
          return this.block.querySelector("img").parentElement;
        },
        get image() {
          return this.container.querySelector("img");
        }
      };
      
      //Add Classes & Attributes
      addClasses(this)
      
      new WMImageZoom(this.elements.container);
    }

    return Constructor;
  })();
  
  function initImageZoom() {
    if (utils.preventPlugin()) return;

    //Build HTML from Selectors
    let initImageBlocks = document.querySelectorAll('.sqs-block-image:not([data-wm-image-zoom]), .sqs-block-product:not([data-wm-image-zoom])');
    for (const el of initImageBlocks) {
      let style = window.getComputedStyle(el),
          active = (style.getPropertyValue('--wm-image-zoom') === 'true');
      if (active) {
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