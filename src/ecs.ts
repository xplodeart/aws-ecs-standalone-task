import { ECSClient, RunTaskCommand, RunTaskCommandInput, DescribeTasksCommand } from "@aws-sdk/client-ecs";

import type { AwsConfig, EcsResources } from "./types";

class EcsTaskManager {
  private client: ECSClient;

  private ecsResources: EcsResources;

  constructor(config: AwsConfig, resources: EcsResources) {
    this.client = new ECSClient(config);

    this.ecsResources = resources;
  }

  async dispatchAndWait(checkInterval: number = 6000, iterations: number = 20): Promise<string> {
    const taskId = await this.dispatchTask();

    if (taskId === null) {
      throw new Error("Task dispatch error");
    }

    //console.log("Dispatched task", taskId);

    const complete = await this.waitForTaskComplete(taskId, checkInterval, iterations);

    if (!complete) {
      throw new Error("Task completion timeout");
    }

    //console.log("Completed task", taskId);

    return taskId;
  }

  async dispatchTask(): Promise<string | null> {
    const input: RunTaskCommandInput = {
      cluster: this.ecsResources.cluster,
      taskDefinition: this.ecsResources.taskDefinition,
      count: 1,
      launchType: "FARGATE",
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: "ENABLED",
          securityGroups: this.ecsResources.securityGroups,
          subnets: this.ecsResources.subnets,
        },
      },
      enableECSManagedTags: true,
      propagateTags: "TASK_DEFINITION",
    };

    const command = new RunTaskCommand(input);

    const response = await this.client.send(command);

    if (!response.failures || !response.tasks || response.failures.length > 0) {
      return null;
    }

    const taskArn = response.tasks[0].taskArn;

    if (!taskArn) {
      return null;
    }

    const arnDetails = taskArn.split("/" + this.ecsResources.cluster + "/");
    const taskId = arnDetails[1];

    return taskId;
  }

  waitForTaskComplete(taskId: string, checkInterval: number = 6000, numIterations: number = 20): Promise<boolean> {
    return new Promise((resolve) => {
      let iterations = numIterations;

      const interval = setInterval(async () => {
        if (await this.checkTaskComplete(taskId)) {
          clearInterval(interval);

          resolve(true);
        } else {
          iterations--;
        }

        if (iterations === 0) {
          clearInterval(interval);

          resolve(false);
        }
      }, checkInterval);
    });
  }

  async checkTaskComplete(taskId: string): Promise<boolean> {
    const command = new DescribeTasksCommand({
      cluster: this.ecsResources.cluster,
      tasks: [taskId],
    });

    const response = await this.client.send(command);

    if (!response.failures || !response.tasks || response.failures.length > 0) {
      return false;
    }

    const status = response.tasks[0].lastStatus;

    return status === "STOPPED" ? true : false;
  }
}

export default EcsTaskManager;
