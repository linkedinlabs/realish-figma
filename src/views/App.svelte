<script>
  // import { afterUpdate, beforeUpdate } from 'svelte';
  import FontPreload from './FontPreload';
  // import BlankState from './BlankState';

  // export let items;
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
<div bind:offsetHeight={bodyHeight}>
  <FontPreload/>
  <h1>hello</h1>
</div>
