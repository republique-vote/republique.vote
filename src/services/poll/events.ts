import { getPublisher, getSubscriber } from "@/services/redis";

const CHANNEL_PREFIX = "poll-results:";

export function emitVoteUpdate(pollId: string, data: unknown) {
  const pub = getPublisher();
  pub.publish(`${CHANNEL_PREFIX}${pollId}`, JSON.stringify(data));
}

export function onVoteUpdate(
  pollId: string,
  callback: (data: unknown) => void,
) {
  const sub = getSubscriber();
  const channel = `${CHANNEL_PREFIX}${pollId}`;

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
