export interface AwsConfig {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export interface EcsResources {
  cluster: string;
  taskDefinition: string;
  securityGroups: string[];
  subnets: string[];
}

export interface CloudLogResources {
  logGroupName: string;
  logStreamPrefix: string;
}

export type Message = string;

export interface LogResult {
  hasErrors: boolean;
  messages: Message[];
}
