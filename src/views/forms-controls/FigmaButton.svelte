<script>
  import { createEventDispatcher } from 'svelte';

  export let action = 'clicked';
  export let className = null;
  export let disabled = false;
  export let isDestructive = false;
  export let type = 'secondary'
  export let text = 'Button';

  const dispatch = createEventDispatcher();

  const combinedClasses = (
    suppliedClasses,
    buttonIsDestructive,
    buttonType,
  ) => {
    let combinedArray = [];
    if (suppliedClasses && suppliedClasses.length > 0) {
      suppliedClasses.split(' ').forEach((className) => combinedArray.push(className));      
    }

    // set button class
    const buttonClass = `button--${buttonType}${buttonIsDestructive ? '-destructive' : ''}`;
    console.log(`buttonClass ${buttonClass}`)
    combinedArray.push(buttonClass);

    // create classes string
    const combined = combinedArray.join(' ');
    return combined;
  }
</script>

<style>
  /* components/figma-button > @figma-button */
</style>

<button
  on:click={() => dispatch('handleAction', action)}
  class={combinedClasses(className, isDestructive, type)}
  disabled={disabled}
>
  {text}
</button>
