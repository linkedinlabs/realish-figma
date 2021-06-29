<script>
  import ButtonLock from './forms-controls/ButtonLock';
  import ButtonRemix from './forms-controls/ButtonRemix';
  import ButtonRestore from './forms-controls/ButtonRestore';

  export let assignment = 'unassigned';
  export let isImage = false;
  export let isLocked = true;
  export let originalText = null;
  export let proposedText = null;
  export let rounded = 'none';
</script>

{#if isImage}
  <li>{originalText}</li>
{:else}
  <li class="text-layer-holder locked" id="text-layer-holder-original">
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
      <span class="layer-assignment-control select">
        <label>Assigned text type</label>
        <select class="assignments select-menu" disabled>
          <option value="unassigned" selected>Not assigned</option>
          <option value="alumni-company">Alumni (Company)</option>
          <option value="alumni-school">Alumni (School)</option>
          <option value="article-title">Article Title</option>
          <option value="attendees">Attendees</option>
          <option value="company">Company</option>
          <option value="company-media">Company (Media)</option>
          <option value="connections">Connections</option>
          <option value="connections-mutual">Connections (Mutual)</option>
          <option value="country">Country</option>
          <option value="date">Date</option>
          <option value="date-short">Date (Short)</option>
          <option value="date-time">Date & Time</option>
          <option value="degree-badge">Degree Badge</option>
          <option value="domain">Domain Name</option>
          <option value="email">Email</option>
          <option value="event">Event</option>
          <option value="followers">Followers</option>
          <option value="group">Group</option>
          <option value="hashtag">Hashtag</option>
          <option value="industry">Industry</option>
          <option value="job-title">Job Title</option>
          <option value="location">Location</option>
          <option value="members">Members</option>
          <option value="name">Name</option>
          <option value="newsletter">Newsletter</option>
          <!-- <option value="product">Product</option> -->
          <option value="profile-headline">Profile Headline</option>
          <option value="published-frequency">Published Frequency</option>
          <option value="school">School</option>
          <!-- <option value="service">Service</option> -->
          <option value="timestamp">Timestamp</option>
        </select>
      </span>
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
