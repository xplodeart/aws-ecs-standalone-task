import { CloudWatchLogsClient, GetLogEventsCommand, GetLogEventsCommandInput } from "@aws-sdk/client-cloudwatch-logs";

import type { AwsConfig, CloudLogResources, Message, LogResult } from "./types";

class CloudLogReader {
  private client: CloudWatchLogsClient;

  private cloudLogResources: CloudLogResources;

  constructor(config: AwsConfig, resources: CloudLogResources) {
    this.client = new CloudWatchLogsClient(config);

    this.cloudLogResources = resources;
  }

  async parse(taskId: string): Promise<LogResult> {
    const messages: Message[] = await this.fetchLogs(taskId);

    return {
      hasErrors: this.hasErrors(messages),
      messages,
    };
  }

  async fetchLogs(taskId: string): Promise<Message[]> {
    const logStreamName = this.cloudLogResources.logStreamPrefix + taskId;

    const input: GetLogEventsCommandInput = {
      logGroupName: this.cloudLogResources.logGroupName,
      logStreamName: logStreamName,
    };

    const command = new GetLogEventsCommand(input);

    const response = await this.client.send(command);

    const messages: Message[] = [];

    if (!response.events) {
      return messages;
    }

    for (const event of response.events) {
      if (event.message) {
        messages.push(event.message);
      }
    }

    return messages;
  }

  hasErrors(messages: Message[]): boolean {
    for (const message of messages) {
      if (message.toLowerCase().includes("err")) {
        return true;
      }
    }

    return false;
  }
}

export default CloudLogReader;
