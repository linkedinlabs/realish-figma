<script>
  import { createEventDispatcher } from 'svelte';
  import Icons from '../../assets/images/Icons';

  export let action = 'clicked';
  export let disabled = false;
  export let isLocked = false;

  const dispatch = createEventDispatcher();

  const handleClick = (currentAction) => {
    isLocked = !isLocked;
    dispatch('handleAction', currentAction);
  };
</script>

<style>
  /* components/icon-button > @button-icon */
</style>

<button
  on:click={() => handleClick(action)}
  class={`item-toggle action-lock-toggle${isLocked ? ' locked' : ''}`}
  disabled={disabled}
>
  <span class="label">
    {`${isLocked ? 'Unlock' : 'Lock'} layer`}
  </span>
  <span class={`icon ${isLocked ? 'locked' : 'unlocked'}`}>
    <Icons name={isLocked ? 'locked' : 'unlocked'}/>
  </span>
</button>
