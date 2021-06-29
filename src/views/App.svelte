<script>
  // import { afterUpdate, beforeUpdate } from 'svelte';
  import FontPreload from './FontPreload';
  import BlankState from './BlankState';
  import ItemsList from './ItemsList';
  import FooterBar from './FooterBar';

  export let items;
  // export let newSessionKey = null;

  let bodyHeight = 0;
  // let wasBodyHeight = 0;

  // beforeUpdate(() => {
  // });

  // afterUpdate(() => {
  // });
</script>

<!-- compile options -->
<svelte:options accessors={true}/>

<!-- core layout -->
<div
  class="container padding"
  bind:offsetHeight={bodyHeight}
>
  <FontPreload/>
  {#if items && items.length}
    <ItemsList items={items}/>
    <FooterBar />
  {:else}
    <BlankState/>
  {/if}
</div>
