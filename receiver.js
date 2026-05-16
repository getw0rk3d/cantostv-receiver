/* eslint-disable no-undef */
/**
 * CantosTV Receiver runtime
 *
 * Why a custom receiver at all? Two reasons:
 *   1. Branding — the splash + idle screen say "CantosTV" instead of
 *      Google's default chrome.
 *   2. Extension point — `urn:x-cast:com.cantostv` custom message channel
 *      lets us send off-spec commands from the sender (e.g. live track
 *      reassignment, EQ tweaks) if we want to in the future.
 *
 * What this receiver does NOT magically fix:
 *   - Track switching inside MKV/MP4 files. The audio/subtitle tracks
 *     are baked into the file and decoded by the Chromecast's hardware
 *     pipeline; no browser-side player can pick a different one. Shaka
 *     doesn't support MKV at all, and even for MP4 it can't switch
 *     embedded tracks. The sender app falls back to "play locally" for
 *     these cases.
 *   - For HLS / DASH multi-rendition manifests, track switching DOES
 *     work — Cast's built-in pipeline handles it. setActiveTrackIds from
 *     the sender just works there.
 */

const context  = cast.framework.CastReceiverContext.getInstance();
const manager  = context.getPlayerManager();

// IMPORTANT: do NOT set playback.playerType = SHAKA. Shaka rejects MKV
// (the most common Xtream VOD format), which would make casts silently
// fail to start. Letting Cast pick its built-in player based on the
// contentType is the right call — it handles HLS, MP4, MKV, and DASH.

// Hide the idle splash once a stream starts.
manager.addEventListener(cast.framework.events.EventType.PLAYER_LOAD_COMPLETE, () => {
  const idle = document.getElementById('idle');
  if (idle) idle.style.display = 'none';

  // Re-assert the active track IDs the sender included with loadMedia.
  // No-op for MKV (the pipeline ignores it) but helps HLS manifests.
  const status = manager.getMediaInformation();
  if (status?.tracks?.length) {
    const ids = status.activeTrackIds || [];
    if (ids.length) {
      try { manager.setActiveByTrackIds(ids); } catch (_) {}
    }
  }
});

// Show idle splash again when a session ends or media is unloaded.
manager.addEventListener(cast.framework.events.EventType.MEDIA_FINISHED, () => {
  const idle = document.getElementById('idle');
  if (idle) idle.style.display = '';
});

manager.addEventListener(cast.framework.events.EventType.ERROR, (e) => {
  console.error('[CantosTV] playback error', e);
});

// Custom message channel. The sender can push commands here — namespaced
// under our own URN so we don't collide with Google's.
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
  // Don't disconnect mid-watch.
  disableIdleTimeout: false,
  supportedCommands:
    cast.framework.messages.Command.ALL_BASIC_MEDIA |
    cast.framework.messages.Command.QUEUE_PREV |
    cast.framework.messages.Command.QUEUE_NEXT,
});
