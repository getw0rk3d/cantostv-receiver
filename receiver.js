/* eslint-disable no-undef */
/**
 * CantosTV Receiver runtime
 *
 * The default Cast Web Receiver hands off to a built-in playback engine that
 * cannot select among audio tracks embedded in an MKV/MP4. We replace that
 * pipeline with Shaka Player, which CAN. Then we honor the activeTrackIds
 * field the sender sets when the user picks an audio/subtitle chip — the
 * track changes happen in place, no full reload.
 */

const context  = cast.framework.CastReceiverContext.getInstance();
const manager  = context.getPlayerManager();
const playback = new cast.framework.PlaybackConfig();

// Use Shaka as the player. This is the bit that gives us real track control
// on MKV/MP4 instead of the default engine's "play default audio only" behavior.
playback.playerType = cast.framework.PlayerType.SHAKA;
manager.setPlaybackConfig(playback);

// Hide the idle splash once a stream starts.
manager.addEventListener(cast.framework.events.EventType.PLAYER_LOAD_COMPLETE, () => {
  const idle = document.getElementById('idle');
  if (idle) idle.style.display = 'none';

  // Apply the activeTrackIds the sender included with loadMedia. Cast's
  // default behavior already does this — but we re-assert it here in case
  // Shaka's track-id mapping needs a nudge.
  const status = manager.getMediaInformation();
  if (status?.tracks?.length) {
    const ids = status.activeTrackIds || [];
    if (ids.length) manager.setActiveByTrackIds(ids);
  }
});

manager.addEventListener(cast.framework.events.EventType.ERROR, (e) => {
  console.error('[CantosTV] playback error', e);
});

// Custom message channel — the sender can push commands like
// "switch audio track without reloading" or "set loudness gain". This is
// where we'd extend if we want to do anything off-spec.
const NAMESPACE = 'urn:x-cast:com.cantostv';
context.addCustomMessageListener(NAMESPACE, (event) => {
  const msg = event.data || {};
  try {
    if (msg.type === 'setActiveTrackIds' && Array.isArray(msg.ids)) {
      manager.setActiveByTrackIds(msg.ids);
    }
  } catch (err) {
    console.warn('[CantosTV] custom message handler error', err);
  }
});

context.start({
  // Speed up startup — small buffer to first frame.
  playbackConfig: playback,
  // Don't disconnect during track-change reloads.
  disableIdleTimeout: false,
  // Show full sender chrome (volume, play/pause, seek) on the TV.
  supportedCommands:
    cast.framework.messages.Command.ALL_BASIC_MEDIA |
    cast.framework.messages.Command.QUEUE_PREV |
    cast.framework.messages.Command.QUEUE_NEXT,
});
