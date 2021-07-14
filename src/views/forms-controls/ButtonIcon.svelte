<script>
  import { createEventDispatcher } from 'svelte';
  import Icons from '../../assets/images/Icons';

  export let action = 'clicked';
  export let icon = null;
  export let label = null;
  export let disabled = false;

  const dispatch = createEventDispatcher();
</script>

<style>
  /* components/icon-button > @button-icon */
</style>

<button
  on:click={() => dispatch('handleAction', action)}
  class={`item-toggle action-${action}`}
  disabled={disabled}
>
  {#if label}
    <span class="label">
      {label}
    </span>
  {/if}
  {#if icon}
    <span class="icon">
      <Icons name={icon}/>
    </span>
  {/if}
</button>
