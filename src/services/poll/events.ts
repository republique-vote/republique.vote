import { getPublisher, getSubscriber } from "@/services/redis";

const RESULTS_PREFIX = "poll-results:";
const BOARD_PREFIX = "poll-board:";

export function emitVoteUpdate(pollId: string, data: unknown) {
  const pub = getPublisher();
  pub.publish(`${RESULTS_PREFIX}${pollId}`, JSON.stringify(data));
}

export function onVoteUpdate(
  pollId: string,
  callback: (data: unknown) => void
) {
  const sub = getSubscriber();
  const channel = `${RESULTS_PREFIX}${pollId}`;

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

export function emitBoardVote(pollId: string, data: unknown) {
  const pub = getPublisher();
  pub.publish(`${BOARD_PREFIX}${pollId}`, JSON.stringify(data));
}

export function onBoardVote(pollId: string, callback: (data: unknown) => void) {
  const sub = getSubscriber();
  const channel = `${BOARD_PREFIX}${pollId}`;

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
