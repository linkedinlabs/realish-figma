<script>
  import Item from './Item';

  export let items;
</script>

<section class="items-list-holder">
  <ul class="items-list">
    {#each items as item}
      <Item item={item}/>
    {/each}
  </ul>
</section>
