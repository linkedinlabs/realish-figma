<script>
  import Item from './Item';

  export let items;
</script>

<ul class="items-list" id="layer-list">
  {#each items as item, i (item.id)}
    <Item
      assignment={item.assignment}
      isImage={item.nodeType === 'shape'}
      isLocked={item.locked}
      itemId={item.id}
      originalText={item.originalText}
      proposedText={item.proposedText}
      rounded={item.rounded}
      item={item}
    />
  {/each}
</ul>
