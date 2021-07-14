<script>
  import FontPreload from './FontPreload';
  import ImageSandbox from './ImageSandbox';
  import BlankState from './BlankState';
  import ItemsList from './ItemsList';
  import FooterBar from './FooterBar';

  export let items;

  let bodyHeight = 0;
</script>

<!-- compile options -->
<svelte:options accessors={true}/>

<!-- core layout -->
<div
  class="container padding"
  bind:offsetHeight={bodyHeight}
>
  <FontPreload/>
  <ImageSandbox/>

  <section class="options" id="action-options">
    <h2>
      Selected layers
    </h2>

    {#if items && items.length}
      <ItemsList items={items}/>
      <FooterBar />
    {:else}
      <BlankState/>
    {/if}
  </section>
</div>
