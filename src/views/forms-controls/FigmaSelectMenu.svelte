<script>
  // this component is a svelte rebuild of the vendor/figma-select-menu.js script
  // used in other LinkedIn Figma plugins
  import { afterUpdate, createEventDispatcher } from 'svelte';

  export let className = null;
  export let disabled = false;
  export let nameId = null;
  export let value = null;
  export let watchChange = false;
  export let options = [
    {
      value: 'unassigned',
      text: 'Not assigned',
      disabled: false,
    },
  ];

  // track value diff
  let originalValue = value;

  // state
  let isMenuOpen = false;
  let selected = {
    value,
    text: null,
  };

  const dispatch = createEventDispatcher();

  // ui helpers
  let fullHeight = 0;
  let menuHeight = 0;
  let fauxSelectorElement = null;
  let selectorContainerElement = null;
  let scrollY = null;

  const isSelected = (
    toMatch,
    currentSelected,
    currentValue,
  ) => {
    if (currentSelected.value === null) {
      if (toMatch === currentValue) {
        return true;
      }
      return false;
    }

    if (toMatch === currentSelected.value) {
      return true;
    }
    return false;
  };

  const setSelected = (optionValue = value) => {
    const index = 0;
    let valueToCompare = optionValue;

    // set a string for blanks in select
    if (valueToCompare === null) {
      valueToCompare = 'blank--value';
    }

    // update for faux select
    if (valueToCompare) {
      selected = options.filter((option) => option.value === valueToCompare)[index];
    } else {
      selected = options[index];
    }

    // update for real select + return binding
    value = selected.value;

    // send save signal if watching
    if (watchChange && (value !== originalValue)) {
      dispatch('saveSignal');
    }
    return selected;
  };

  // ui interactions
  const handleMenuClick = () => {
    isMenuOpen = !isMenuOpen;
    return isMenuOpen;
  };

  const handleItemClick = (optionValue) => {
    setSelected(optionValue);
    isMenuOpen = false;
  };

  const handleClickOutside = (event) => {
    if (!isMenuOpen) {
      return null;
    }

    let clickOutside = true;
    let parent = event.target;
    while (parent) {
      if (parent === fauxSelectorElement) {
        clickOutside = false;
      }
      parent = parent.parentNode;
    }

    if (clickOutside) {
      return handleMenuClick();
    }
    return null;
  };

  const watchKeys = (event) => {
    if (!isMenuOpen) {
      return null;
    }

    const selectNext = (direction) => {
      let currentlySelectedItem = selectorContainerElement.querySelector('.styled-select__list--active .styled-select__list-item--indicate');
      if (!currentlySelectedItem) {
        currentlySelectedItem = selectorContainerElement.querySelector('.styled-select__list--active .styled-select__list-item--active');
      }
      if (currentlySelectedItem) {
        const dropdown = currentlySelectedItem.parentNode;

        // default is `down`, grab the next sibling
        let nextSelectedItem = currentlySelectedItem.nextElementSibling;
        if (direction === 'up') {
          // grab the previous sibling
          nextSelectedItem = currentlySelectedItem.previousElementSibling;

          // skip over separators
          if (nextSelectedItem && nextSelectedItem.tagName !== 'LI') {
            nextSelectedItem = nextSelectedItem.previousElementSibling;
          }

          // if the previous sibling is missing, must be at the top
          // grab the last element in the list
          if (!nextSelectedItem) {
            nextSelectedItem = currentlySelectedItem.parentNode.lastElementChild;
          }
        } else {
          // skip over separators
          if (nextSelectedItem && nextSelectedItem.tagName !== 'LI') {
            nextSelectedItem = nextSelectedItem.nextElementSibling;
          }

          // if the next sibling is missing, must be at the bottom
          // grab the first element in the list
          if (!nextSelectedItem) {
            nextSelectedItem = currentlySelectedItem.parentNode.firstElementChild;
          }
        }

        currentlySelectedItem.classList.remove('styled-select__list-item--indicate');
        nextSelectedItem.classList.add('styled-select__list-item--indicate');

        const dropdownHeight = dropdown.offsetHeight;
        const selectedItem = dropdown.querySelector('.styled-select__list-item--indicate');
        const selectedItemHeight = selectedItem.offsetHeight;
        const selectedItemTopOffset = selectedItem.getBoundingClientRect().top + scrollY;
        const refreshedMenuTopInnerOffset = dropdown.getBoundingClientRect().top + scrollY;

        if (
          (selectedItemTopOffset < 0)
          || ((selectedItemTopOffset + selectedItemHeight) > dropdownHeight)
        ) {
          const scrollPoint = selectedItemTopOffset - refreshedMenuTopInnerOffset;
          dropdown.scrollTop = scrollPoint;
        }
      }
    };

    const commitSelectedValue = () => {
      let currentlySelectedItem = selectorContainerElement.querySelector('.styled-select__list--active .styled-select__list-item--indicate');
      const previouslySelectedItem = selectorContainerElement.querySelector('.styled-select__list--active .styled-select__list-item--active');
      if (!currentlySelectedItem) {
        currentlySelectedItem = selectorContainerElement.querySelector('.styled-select__list--active .styled-select__list-item--active');
      }
      const selectedValue = currentlySelectedItem.getAttribute('data-value');

      // update the faux menu selected item
      previouslySelectedItem.classList.remove('styled-select__list-item--active');
      currentlySelectedItem.classList.add('styled-select__list-item--active');
      currentlySelectedItem.classList.remove('styled-select__list-item--indicate');

      // set selection
      setSelected(selectedValue);
      handleMenuClick();
    };

    const { key } = event;
    switch (key) {
      case 'ArrowUp':
        event.preventDefault();
        selectNext('up');
        break;
      case 'ArrowDown':
        event.preventDefault();
        selectNext('down');
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commitSelectedValue();
        break;
      case 'Escape':
        handleMenuClick();
        break;
      default:
        return null;
    }

    return null;
  };

  const setMenuPosition = () => {
    // locate the menu elements
    const menuListElement = selectorContainerElement.querySelector('.styled-select__list');
    const selectedItemElement = menuListElement.querySelector('.styled-select__list-item--active');

    // set some defaults
    let menuPosition = 0;
    let menuScrollY = 0;
    let offsetDiff = 0;

    if (selectedItemElement) {
      // check to see if the menu is taller than the viewport
      let isMenuTaller = false;
      if (menuHeight > fullHeight) {
        isMenuTaller = true;
      }

      // run some calculations up front
      const selectorOffset = fauxSelectorElement.getBoundingClientRect().top;
      const menuOffset = menuListElement.getBoundingClientRect().top;
      const itemOffset = selectedItemElement.getBoundingClientRect().top;
      const itemHeight = selectedItemElement.clientHeight;

      if (isMenuTaller) {
        // resize menu to fit in viewport
        menuListElement.style.height = fullHeight - 8;

        // position menu
        menuPosition = -selectorOffset + 4;

        // set scroll position
        menuScrollY = (itemOffset - menuOffset) - selectorOffset;
      } else {
        // calculate selected item offset
        offsetDiff = itemOffset - menuOffset;

        // if position selected item underneath cursor will move the menu out of
        // the viewport, move it to the top of the viewport.
        // otherwise, move it so that the selected item is underneat the cursor.
        if ((menuOffset - offsetDiff) < itemHeight) {
          // move to top of viewport
          menuPosition = -selectorOffset + 4;
        } else {
          // move underneath cursor
          menuPosition = -(offsetDiff);
        }
      }
    }

    // set the menu position
    menuListElement.style.top = menuPosition;

    // set the menu scroll position
    menuListElement.scroll(0, menuScrollY);
  };

  // set initial selection
  setSelected();

  afterUpdate(() => {
    if (isMenuOpen) {
      setMenuPosition();
    }

    if (value !== originalValue) {
      originalValue = value;
    }
  });
</script>

<style>
  /* components/figma-select-menu */
</style>

<svelte:window
  on:keydown={watchKeys}
  bind:scrollY={scrollY}
  bind:innerHeight={fullHeight}
/>
<svelte:body
  on:click={handleClickOutside}
/>

<span
  class={className}
  bind:this={selectorContainerElement}
>
  <div
    bind:this={fauxSelectorElement}
    class="styled-select"
  >
    <button
      class={`styled-select__button${isMenuOpen ? ' styled-select__button--active' : ''}`}
      disabled={disabled}
      on:click={() => handleMenuClick()}
    >
      <span class="styled-select__button-label">
        {selected.text}
      </span>
      <span class="styled-select__icon"></span>
    </button>
    {#if isMenuOpen}
      <ul
        class={`styled-select__list${isMenuOpen ? ' styled-select__list--active' : ''}`}
        style=""
        bind:clientHeight={menuHeight}
      >
        {#each options as option (option.value)}
          {#if (option.value && !option.value.includes('divider--'))}
            <li
              class={`styled-select__list-item${isSelected(option.value, selected, value) ? ' styled-select__list-item--active' : ''}${option.disabled ? ' styled-select__list-item--disabled' : ''}`}
              data-value={option.value}
              on:click={() => handleItemClick(option.value)}
            >
              <span class="styled-select__list-item-icon"></span>
              <span class={`styled-select__list-item-text${option.value === 'blank--value' ? ' is-blank' : ''}${option.disabled ? ' styled-select__list-item-text--disabled' : ''}`}>
                {option.text}
              </span>
            </li>
          {:else if option.value.includes('divider--')}
            <div class="styled-select__divider">
              <span class="styled-select__divider-line"></span>
            </div>
          {/if}
        {/each}
      </ul>
    {/if}
  </div>
  <select
    class="styled-select select-menu"
    disabled={disabled}
    id={nameId}
    style="display:none"
    bind:value={value}
  >
    {#each options as option (option.value)}
      <option
        disabled={option.disabled}
        selected={isSelected(option.value, selected, value)}
        value={option.value}
      >
        {option.text}
      </option>
    {/each}
  </select>
</span>
