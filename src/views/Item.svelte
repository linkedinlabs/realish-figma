<script>
  import ButtonLock from './forms-controls/ButtonLock';
  import ButtonRemix from './forms-controls/ButtonRemix';
  import ButtonRestore from './forms-controls/ButtonRestore';
  import FormUnit from './forms-controls/FormUnit';
  import { textAssignmentsSelect } from './stores';

  export let assignment = 'unassigned';
  export let isImage = false;
  export let isLocked = true;
  export let itemId = null;
  export let originalText = null;
  export let proposedText = null;
  export let rounded = 'none';
</script>

{#if isImage}
  <li>{originalText}</li>
{:else}
  <li class="text-layer-holder locked">
    <span class="row">
      <!-- original text widget -->
      <span class="text-widget original-text">
        <span class="text">
          {originalText}
        </span>
        <span class="inline-control reset-control">
          <ButtonRestore disabled={originalText === proposedText}/>
        </span>
      </span>

      <!-- layer assignment select -->
      <FormUnit
        className="layer-assignment-control select"
        kind="inputSelect"
        options={$textAssignmentsSelect}
        labelText="Assigned text type"
        nameId={`${itemId}-assignment-type`}
        placeholder="Leave empty to use browser default"
        selectWatchChange={true}
        bind:value={assignment}
      />
    </span>

    <span class="row">
      <!-- proposed text widget -->
      <span class="text-widget new-text">
        <span class="text">
          {proposedText}
        </span>
        <span class="inline-control remix-control">
          <ButtonRemix disabled={assignment === 'unassigned'}/>
        </span>
      </span>

      <!-- locking control -->
      <span class="locking-control">
        <ButtonLock
          isLocked={isLocked}
        />
      </span>
    </span>
  </li>
{/if}
