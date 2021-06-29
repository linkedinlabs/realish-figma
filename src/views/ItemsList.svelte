<script>
  import Item from './Item';

  export let items;
</script>

<section class="items-list-holder">
  <ul class="items-list" id="layer-list">
    {#each items as item}
      <Item
        assignment={item.assignment}
        isImage={item.nodeType === 'shape'}
        isLocked={item.locked}
        originalText={item.originalText}
        proposedText={item.proposedText}
        rounded={item.rounded}
        item={item}
      />
    {/each}
  </ul>
</section>
