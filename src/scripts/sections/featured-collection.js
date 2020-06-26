/**
 * Section: Featured collection
 * ------------------------------------------------------------------------------
 * Featured collection configuration for complete theme support
 * - https://github.com/Shopify/theme-scripts/tree/master/packages/theme-sections
 *
 * @namespace featuredCollection
 */
import {register} from '@shopify/theme-sections';
import Flickity from 'flickity';
import 'flickity-imagesloaded';
import 'flickity/dist/flickity.min.css';

/**
 * Init product slider
 */
function initSlider() {
  new Flickity('.featured-collection__products', {
    groupCells: true,
    imagesLoaded: true,
  });
}

/**
 * Add a product to cart
 * @param {number} variantId - ID of variant to add
 * @param {number} quantity - number of items to add
 */
async function addToCart(variantId, quantity = 1) {
  const data = {
    quantity,
    id: variantId,
  };
  const response = await window.fetch('/cart/add.js', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return response;
}

/**
 * Update the cart count
 */
async function updateCartCount() {
  const cart = document.querySelector('.site-header__cart');
  const cartCount = document.querySelector('.site-header__cart__count');

  if (!cart || !cartCount) { return; }

  const contents = await window.fetch('/cart.js')
    .then((response) => response.json())
    .then((data) => data);

  cartCount.innerHTML = `(${contents.item_count})`;
  cart.classList.add('shake-animation');
  window.setTimeout(() => {
    cart.classList.remove('shake-animation');
  }, 1500);
}

/** Scroll to top of page */
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

/**
 * Initialise quick add component
 * @param {HTMLElement} productCard - .product-card DOM element
 */
function initQuickAddComponent(productCard) {
  const classNames = {
    cardFocus: 'product-card--focus',
    quickAdd: 'product-card__quick-add',
    quickAddActive: 'product-card__quick-add--show',
  };
  const exitIntentTimer = 2000;
  const quickAdd = productCard.querySelector(`.${classNames.quickAdd}`);
  const ajaxAddToCart = quickAdd.querySelector('[js-ajax-cart="addToCart"]');
  const select = quickAdd.querySelector('select');
  let persistFocus;

  /** Remove focus from any other focused card */
  function removeAllFocus() {
    const activeFocus = document.querySelector(`.${classNames.cardFocus}`);

    if (activeFocus) {
      activeFocus.classList.remove(classNames.cardFocus);
    }
  }

  /** Close quick add */
  function removeFocus() {
    if (persistFocus) { return; }

    productCard.classList.remove(classNames.cardFocus);
  }

  /** Open quick add */
  function enableFocus() {
    removeAllFocus();
    productCard.classList.add(classNames.cardFocus);
  }

  /** Open size selector */
  function openSizes() {
    quickAdd.classList.add(classNames.quickAddActive);
  }

  /** Close size selector */
  function closeSizes() {
    if (persistFocus) { return; }

    quickAdd.classList.remove(classNames.quickAddActive);
  }

  /** Start a timer to close the size selector */
  function setExitIntent() {
    quickAdd.setAttribute(
      'data-exitIntent',
      window.setTimeout(closeSizes, exitIntentTimer),
    );
  }

  /** Clear the timer to prevent closing the size selector */
  function clearExitIntent() {
    window.clearTimeout(quickAdd.getAttribute('data-exitIntent'));
  }

  /**
   * Change ID of variant to be added to cart
   * @param {number} variantId - ID of variant to add to cart
   */
  function setVariantId(variantId) {
    ajaxAddToCart.setAttribute('data-variant-id', variantId);
  }

  /**
   * Return the ID of the selected variant
   * @returns {number}
   */
  function getSelectedVariantId() {
    return Number(ajaxAddToCart.getAttribute('data-variant-id'));
  }

  function productCardMouseEnterHandler() {
    enableFocus();
  }

  function productCardMouseLeaveHandler() {
    removeFocus();
  }

  function quickAddMouseEnterHandler() {
    openSizes();
    clearExitIntent();
  }

  function quickAddMouseLeaveHandler() {
    setExitIntent();
  }

  function quickAddClickHandler(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  function selectFocusHandler() {
    persistFocus = true;
  }

  function selectBlurHandler() {
    persistFocus = false;
  }

  function selectChangeHandler() {
    setVariantId(this.value);
  }

  function ajaxAddToCartClickHandler() {
    addToCart(getSelectedVariantId())
      .then((response) => {
        if (response.status === 200) {
          scrollToTop();
          updateCartCount();
        }
        return true;
      })
      .catch((err) => {
        window.console.error(err);
      });
  }

  function init() {
    // Bind interaction events
    productCard.addEventListener('mouseenter', productCardMouseEnterHandler);
    productCard.addEventListener('mouseleave', productCardMouseLeaveHandler);
    quickAdd.addEventListener('click', quickAddClickHandler);
    quickAdd.addEventListener('mouseenter', quickAddMouseEnterHandler);
    quickAdd.addEventListener('mouseleave', quickAddMouseLeaveHandler);
    ajaxAddToCart.addEventListener('click', ajaxAddToCartClickHandler);

    /*
      Some browsers trigger a mouseleave event when the mouse leaves the parent
      of a select element whilst it is open. These events are a workaround to
      prevent the focus from changing whilst the dropdown is open.
    */
    select.addEventListener('focus', selectFocusHandler);
    select.addEventListener('blur', selectBlurHandler);
    select.addEventListener('change', selectChangeHandler);
  }

  init();
}

/**
 * Featured collection constructor
 * Executes on page load as well as Theme Editor `section:load` events.
 *
 * @param {string} container - selector for the section container DOM element
 */
register('featured-collection', {
  init() {
    this.publicMethod();
  },

  publicMethod() {
    window.console.log('Initialising featured collection section');
  },

  onLoad() {
    initSlider();
    const productCards = [...document.querySelectorAll('.product-card')];
    productCards.forEach(initQuickAddComponent);
  },
});
