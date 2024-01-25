# aws-ecs-standalone-task

[![NPM Version](https://img.shields.io/npm/v/aws-ecs-standalone-task)](https://www.npmjs.com/package/aws-ecs-standalone-task)
[![NPM Types](https://badgen.net/npm/types/aws-ecs-standalone-task)](https://www.npmjs.com/package/aws-ecs-standalone-task)

Start an ECS Standalone task, wait for it to complete and get it's logs from CloudWatch.

This package mimics the `aws ecs run-task` aws-cli command and awaits it's execution.

Made for personal use, but if it suites your needs you are welcome to use it.

There is also a [Github Action](https://github.com/marketplace/actions/aws-ecs-standalone-task) available.

## Installation

Install it locally in your project folder:

```bash
npm i aws-ecs-standalone-task
# Or Yarn
yarn add aws-ecs-standalone-task
# Or pnpm
pnpm add aws-ecs-standalone-task
```

## Requirements

You need to have an ECS Cluster as well as a task definition created for your task along with container definitions and optionally a log group where it's container writes the log events.

## Usage

### Import

```js
import { EcsTaskManager, LogReader }  from "aws-ecs-standalone-task';
```

### Prepare credentials

```js
// AWS Credentials
// ecs:RunTask and ecs:DescribeTasks permissions
// optional: logs:GetLogEvents permission for the log-group and log-stream
const awsConfig = {
  region: "us-east-2",
  credentials: {
    accessKeyId: "********************",
    secretAccessKey: "****************************************",
  },
};
```

### Initiate ECS and Logs

```js
// Initiate the ECS task runner
const ecs = new EcsTaskManager(awsConfig, {
  cluster: "ClusterName", // ECS Cluster Name
  taskDefinition: "my-standalone-task-definition", // ECS Task Definition Name
  securityGroups: ["sg-*****************"], // List of security group IDs for your Task's networkConfiguration.awsvpcConfiguration
  subnets: ["subnet-*****************"], // List of Subnet IDs for your Task's networkConfiguration.awsvpcConfiguration
});

// Optional, if your Task logs to CLoudWatch, you need the log reader to check it's logs once it completes
const logs = new LogReader(awsConfig, {
  logGroupName: "/ecs/my-standalone-ecs-task", // Name of the Log Group
  logStreamPrefix: "ecs/my-task-container/", // Log stream prefix, on which the Task ID is added
});
```

### Run

```js
async function runTask() {
  // dispatch the task and wait for it to completes
  // optional: pass interval and iterations, default check each 6 seconds for 20 times or throw an error
  const taskId = await ecs.dispatchAndWait(6000, 20);

  // or, dispatch, receive the taskId without waiting
  const taskId = await ecs.dispatchTask();

  // then, optionally wait for it to complete
  const taskComplete = await this.waitForTaskComplete(taskId); // optional: interval and iterations

  if (!taskComplete) {
    throw new Error("Task completion timeout");
  }

  // fetch and parse the logs
  const log = await logs.parse(taskId);

  if (log.hasErrors) {
    throw new Error("Task Failed");
  }

  console.log("Cloud Logs", log.messages);
}

runTask();
```

## License

MIT
