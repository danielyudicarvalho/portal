# Multiplayer Framework Gap Analysis

This document highlights the current implementation gaps between the multiplayer framework specification in `documentation/08-multiplayer-framework.md` and the live code that powers the Colyseus server (`server/`) and Next.js game surfaces (`src/app/games/`). The goal is to make it easier to prioritize follow-up work and to validate coverage once fixes land.

## Server (`server/`)

| Spec Requirement | Observed Implementation | Gap / Impact |
| --- | --- | --- |
| Base lifecycle must follow `LOBBY → COUNTDOWN → PLAYING → RESULTS → RESET` | `BaseGameRoom` transitions straight from `RESULTS` back to `LOBBY` and never enters `RESET`. Countdown cancellation also skips back to lobby without lifecycle metadata. | Missing `RESET` phase prevents predictable cleanup hooks and makes it impossible for clients to animate/reset between matches. |
| `BaseGameRoom` interface lists `addPlayer`, `removePlayer`, `getPlayer`, `setPlayerReady` | The base class in `server/rooms/BaseGameRoom.js` implements the behaviours inside `onJoin`/`handlePlayerReady` directly without reusable helpers. | Hard to build new rooms consistently; server behaviours drift from spec signatures used by docs. |
| Countdown should expose duration + end timestamp | Countdown logic decrements an integer but never records when the countdown started or ends. | Clients cannot show accurate timers or schedule transitions using only metadata. |
| Player schema uses `@type('any')` for `gameData` | Current schema encodes `gameData` as a string, and game rooms store arbitrary objects on top. | Schema serialisation is inconsistent; reconnecting clients can lose game data or receive malformed payloads. |
| Room metadata must include `phaseStartedAt`, `phaseEndsAt`, `lastUpdate` | Metadata currently tracks state and counts but omits lifecycle timing, making lobby dashboards blind to countdown/results windows. | Lobby UI cannot surface “starting soon” badges or stale-room detection defined in the spec. |
| Reconnection handling should invalidate countdown when minimum players drop | Disconnect logic marks players inactive but the countdown keeps running even when readiness requirements are no longer met. | Leads to games starting with too few players and violates readiness guarantees. |

## Client (`src/app/games/` and related components)

| Spec Requirement | Observed Implementation | Gap / Impact |
| --- | --- | --- |
| Game pages should surface lifecycle phases (countdown/results/reset) | Pages such as `src/app/games/multiplayer/page.tsx` and game-specific routes only distinguish between lobby vs playing. | Players do not see the countdown, post-match, or reset states defined in the framework. |
| Lobby UI should surface `RESET` and countdown timers | Components in `src/components/features` only render `LOBBY`, `COUNTDOWN`, `PLAYING`, and `RESULTS`; `RESET` is treated as “Unknown”. | UI lacks feedback for reset window, causing premature requeueing or confusion during rematch votes. |
| Integration tests should cover create/join/reconnect flows | Existing suites cover creation and joining separately but do not validate reconnect scenarios or the full lifecycle. | Regression risk for lifecycle regressions and reconnection handling remains high. |

## Next Steps

1. Update `BaseGameState`/`BaseGameRoom` to expose full lifecycle metadata and helper APIs.
2. Refresh lobby/game UI components to consume the richer metadata (countdowns, reset badges).
3. Expand integration tests to assert the lifecycle transitions (create → countdown → play → results → reset) and reconnection handling.
