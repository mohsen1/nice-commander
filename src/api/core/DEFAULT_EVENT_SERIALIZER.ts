import os from "os";

import { OutputLogEvent } from "aws-sdk/clients/cloudwatchlogs";

export default function DEFAULT_EVENT_SERIALIZER(event: OutputLogEvent) {
  return `[${new Date(event.timestamp ?? 0).toISOString()}] ${event.message}${
    os.EOL
  }`;
}
