<script>
  import RealishLogo from '../assets/images/RealishLogo';
  import FigmaButton from './forms-controls/FigmaButton';
  import { sendMsgToMain } from '../Tools';

  const runAction = (actionToRun) => {
    const action = actionToRun;
    const payload = null;
    sendMsgToMain(action, payload);
  };
</script>

<footer id="actions">
  <span class="mark">
    <RealishLogo/>
  </span>
  <div class="actions-holder">
    <FigmaButton
      className="button--margin-right"
      action="remix-all"
      on:handleAction={(customEvent) => runAction(customEvent.detail)}
      text="Randomize"
      type="secondary"
    />
    <FigmaButton
      action="submit"
      on:handleAction={(customEvent) => runAction(customEvent.detail)}
      text="Apply"
      type="primary"
    />
  </div>
</footer>
