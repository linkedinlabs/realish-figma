<script>
  import ButtonLock from './forms-controls/ButtonLock';
  import ButtonRemix from './forms-controls/ButtonRemix';
  import ButtonRestore from './forms-controls/ButtonRestore';
  import FormUnit from './forms-controls/FormUnit';
  import { shapeAssignmentsSelect, textAssignmentsSelect } from './stores';

  export let assignment = 'unassigned';
  export let isImage = false;
  export let isLocked = true;
  export let itemId = null;
  export let originalText = null;
  export let proposedText = null;
  export let rounded = 'none';

  const layerType = (currentIsImage) => isImage ? 'shape' : 'text';
</script>

<li class={`${layerType(isImage)}-layer-holder locked`}>
  {#if isImage}
    <!-- proposed content widget -->
    <span class={`shape-widget new-shape rounded-${rounded}`}>
      <span class="shape">
        {proposedText}
      </span>
    </span>

    <span class="column-holder">
      <span class="row">
        <!-- original shape widget -->
        <span class={`shape-widget original-shape rounded-${rounded}`}>
          <span class="inline-control reset-control">
            <ButtonRestore disabled={originalText === proposedText}/>
          </span>
          <span class="shape">
            {originalText}
          </span>
        </span>

        <!-- layer assignment select -->
        <FormUnit
          className="layer-assignment-control select"
          kind="inputSelect"
          options={isImage ? $shapeAssignmentsSelect : $textAssignmentsSelect}
          labelText="Assigned text type"
          nameId={`${itemId}-assignment-type`}
          placeholder="Leave empty to use browser default"
          selectWatchChange={true}
          bind:value={assignment}
        />
      </span>

      <span class="row">
        <span class="inline-control remix-control">
          <ButtonRemix disabled={assignment === 'unassigned'}/>
        </span>

        <!-- locking control -->
        <span class="locking-control">
          <ButtonLock
            isLocked={isLocked}
          />
        </span>
      </span>
    </span>
  {:else}
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
        options={isImage ? $shapeAssignmentsSelect : $textAssignmentsSelect}
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
  {/if}
</li>
