import { getPublisher, getSubscriber } from "@/services/redis";

const RESULTS_PREFIX = "poll-results:";
const BOARD_PREFIX = "poll-board:";

function emitEvent(prefix: string, pollId: string, data: unknown) {
  const pub = getPublisher();
  pub.publish(`${prefix}${pollId}`, JSON.stringify(data));
}

function onEvent(
  prefix: string,
  pollId: string,
  callback: (data: unknown) => void
) {
  const sub = getSubscriber();
  const channel = `${prefix}${pollId}`;

  const handler = (_channel: string, message: string) => {
    if (_channel === channel) {
      callback(JSON.parse(message));
    }
  };

  sub.subscribe(channel);
  sub.on("message", handler);

  return () => {
    sub.unsubscribe(channel);
    sub.off("message", handler);
  };
}

export function emitVoteUpdate(pollId: string, data: unknown) {
  emitEvent(RESULTS_PREFIX, pollId, data);
}

export function onVoteUpdate(
  pollId: string,
  callback: (data: unknown) => void
) {
  return onEvent(RESULTS_PREFIX, pollId, callback);
}

export function emitBoardVote(pollId: string, data: unknown) {
  emitEvent(BOARD_PREFIX, pollId, data);
}

export function onBoardVote(pollId: string, callback: (data: unknown) => void) {
  return onEvent(BOARD_PREFIX, pollId, callback);
}
