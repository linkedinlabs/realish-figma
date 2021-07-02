<script>
  import ButtonLock from './forms-controls/ButtonLock';
  import ButtonRemix from './forms-controls/ButtonRemix';
  import ButtonRestore from './forms-controls/ButtonRestore';
  import FormUnit from './forms-controls/FormUnit';
  import { shapeAssignmentsSelect, textAssignmentsSelect } from './stores';
  import { sendMsgToMain } from '../Tools';
  import { ASSIGNMENTS } from '../constants';

  export let assignment = ASSIGNMENTS.unassigned.id;
  export let isImage = false;
  export let isLocked = true;
  export let itemId = null;
  export let originalImage = null;
  export let originalText = null;
  export let proposedText = null;
  export let rounded = 'none';

  const layerType = (currentIsImage) => (currentIsImage ? 'shape' : 'text');

  const imageUrlFromPath = (imagePath) => {
    let fullUrl = null;
    const serverLocation = process.env.MEDIA_URL ? process.env.MEDIA_URL : 'https://somewhere.com';
    fullUrl = `${serverLocation}${imagePath}`;
    return fullUrl;
  };

  const imageUrlFromBlob = (imageBlob) => {
    const blobUrl = URL.createObjectURL(
      new Blob([imageBlob]), // eslint-disable-line no-undef
    );
    return blobUrl;
  };

  const setProposedImage = (
    currentProposedText,
    currentOriginalText,
    currentOriginalImage,
  ) => {
    let image = null;
    if (currentProposedText === currentOriginalText) {
      image = imageUrlFromBlob(currentOriginalImage);
    } else {
      image = imageUrlFromPath(currentProposedText);
    }

    return image;
  };

  const runAction = (actionToRun, actionItemId) => {
    const action = actionToRun;
    const payload = { id: actionItemId };
    sendMsgToMain(action, payload);
  };
</script>

<li class={`${layerType(isImage)}-layer-holder${isLocked ? ' locked' : ''}`}>
  {#if isImage}
    <!-- proposed content widget -->
    <span class={`shape-widget new-shape rounded-${rounded}`}>
      <span
        class="shape"
        style="background-image: url('{assignment !== ASSIGNMENTS.unassigned.id ? setProposedImage(proposedText, originalText, originalImage) : ''}');"
      >
        &nbsp;
      </span>
    </span>

    <span class="column-holder">
      <span class="row">
        <!-- original shape widget -->
        <span class={`shape-widget original-shape rounded-${rounded}`}>
          <span class="inline-control reset-control">
            <ButtonRestore
              action="restore"
              disabled={originalText === proposedText}
              on:handleAction={(customEvent) => runAction(customEvent.detail, itemId)}
            />
          </span>
          <span
            class="shape"
            style="background-image: url({imageUrlFromBlob(originalImage, assignment)});"
          >
            &nbsp;
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
          <ButtonRemix
            action="remix"
            disabled={(assignment === 'unassigned') || isLocked}
            on:handleAction={(customEvent) => runAction(customEvent.detail, itemId)}
          />
        </span>

        <!-- locking control -->
        <span class="locking-control">
          <ButtonLock
            action="lock-toggle"
            isLocked={isLocked}
            on:handleAction={(customEvent) => runAction(customEvent.detail, itemId)}
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
          <ButtonRestore
            action="restore"
            disabled={originalText === proposedText}
            on:handleAction={(customEvent) => runAction(customEvent.detail, itemId)}
          />
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
          <ButtonRemix
            action="remix"
            disabled={(assignment === 'unassigned') || isLocked}
            on:handleAction={(customEvent) => runAction(customEvent.detail, itemId)}
          />
        </span>
      </span>

      <!-- locking control -->
      <span class="locking-control">
        <ButtonLock
          action="lock-toggle"
          isLocked={isLocked}
          on:handleAction={(customEvent) => runAction(customEvent.detail, itemId)}
        />
      </span>
    </span>
  {/if}
</li>