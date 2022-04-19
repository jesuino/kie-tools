/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { isKafkaConfigValid, KafkaSettingsConfig } from "../settings/kafka/KafkaSettingsConfig";
import { isOpenShiftConfigValid, OpenShiftSettingsConfig } from "../settings/openshift/OpenShiftSettingsConfig";
import {
  isServiceAccountConfigValid,
  ServiceAccountSettingsConfig,
} from "../settings/serviceAccount/ServiceAccountConfig";
import { ServiceRegistrySettingsConfig } from "../settings/serviceRegistry/ServiceRegistryConfig";
import { DeploymentWorkflow } from "./OpenShiftContext";
import { CreateBuild, DeleteBuild } from "./resources/Build";
import { CreateBuildConfig, DeleteBuildConfig } from "./resources/BuildConfig";
import { CreateImageStream, DeleteImageStream } from "./resources/ImageStream";
import { CreateKafkaSource, DeleteKafkaSource } from "./resources/KafkaSource";
import {
  CreateKNativeService,
  GetKNativeService,
  KNativeService,
  KNativeServices,
  ListKNativeServices,
} from "./resources/KNativeService";
import { GetProject } from "./resources/Project";
import { KOGITO_WORKFLOW_FILE, Resource, ResourceFetch } from "./resources/Resource";
import { CreateSecret, DeleteSecret } from "./resources/Secret";

export const DEFAULT_CREATED_BY = "kie-tools-swf-sandbox";

export class OpenShiftService {
  public async getWorkflowFileName(args: {
    config: OpenShiftSettingsConfig;
    resourceName: string;
  }): Promise<string | undefined> {
    const commonArgs = {
      host: args.config.host,
      namespace: args.config.namespace,
      token: args.config.token,
      createdBy: DEFAULT_CREATED_BY,
    };

    const kNativeServices = await this.fetchResource<KNativeServices>(
      args.config.proxy,
      new ListKNativeServices(commonArgs)
    );

    if (kNativeServices.items.length === 0) {
      return;
    }

    const kNativeService = kNativeServices.items.find((item) => item.metadata.name === args.resourceName);

    if (!kNativeService) {
      return;
    }

    return kNativeService.metadata.annotations[KOGITO_WORKFLOW_FILE];
  }

  public async getDeploymentRoute(args: {
    config: OpenShiftSettingsConfig;
    resourceName: string;
  }): Promise<string | undefined> {
    const commonArgs = {
      host: args.config.host,
      namespace: args.config.namespace,
      token: args.config.token,
      createdBy: DEFAULT_CREATED_BY,
    };

    const kNativeService = await this.fetchResource<KNativeService>(
      args.config.proxy,
      new GetKNativeService({ ...commonArgs, resourceName: args.resourceName })
    );

    return kNativeService.status.url;
  }

  public async getResourceRouteMap(config: OpenShiftSettingsConfig): Promise<Map<string, string>> {
    const commonArgs = {
      host: config.host,
      namespace: config.namespace,
      token: config.token,
      createdBy: DEFAULT_CREATED_BY,
    };

    const kNativeServices = await this.fetchResource<KNativeServices>(
      config.proxy,
      new ListKNativeServices(commonArgs)
    );

    if (kNativeServices.items.length === 0) {
      return new Map();
    }

    return new Map(
      kNativeServices.items.map((kNativeService: KNativeService) => {
        return [kNativeService.metadata.name, kNativeService.status.url];
      })
    );
  }

  public async deploy(args: {
    workflow: DeploymentWorkflow;
    openShiftConfig: OpenShiftSettingsConfig;
    kafkaConfig: KafkaSettingsConfig;
    serviceAccountConfig: ServiceAccountSettingsConfig;
  }): Promise<string> {
    const resourceName = `swf-${this.generateRandomId()}`;

    const commonArgs = {
      host: args.openShiftConfig.host,
      namespace: args.openShiftConfig.namespace,
      token: args.openShiftConfig.token,
      resourceName: resourceName,
      createdBy: DEFAULT_CREATED_BY,
    };

    const rollbacks = [
      new DeleteKafkaSource(commonArgs),
      new DeleteSecret(commonArgs),
      new DeleteBuild(commonArgs),
      new DeleteBuildConfig(commonArgs),
      new DeleteImageStream(commonArgs),
    ];

    let rollbacksCount = rollbacks.length;

    await this.fetchResource(args.openShiftConfig.proxy, new CreateImageStream(commonArgs));

    const buildConfig = await this.fetchResource(
      args.openShiftConfig.proxy,
      new CreateBuildConfig(commonArgs),
      rollbacks.slice(--rollbacksCount)
    );

    const processedFileContent = args.workflow.content
      .replace(/(\r\n|\n|\r)/gm, "") // Remove line breaks
      .replace(/"/g, '\\"') // Escape double quotes
      .replace(/'/g, "\\x27"); // Escape single quotes

    await this.fetchResource(
      args.openShiftConfig.proxy,
      new CreateBuild({
        ...commonArgs,
        buildConfigUid: buildConfig.metadata.uid,
        file: {
          path: args.workflow.name,
          content: processedFileContent,
          preview: args.workflow.preview ?? "",
        },
      }),
      rollbacks.slice(--rollbacksCount)
    );

    await this.fetchResource(
      args.openShiftConfig.proxy,
      new CreateKNativeService({ ...commonArgs, fileName: args.workflow.name }),
      rollbacks.slice(--rollbacksCount)
    );

    if (!isKafkaConfigValid(args.kafkaConfig) || !isServiceAccountConfigValid(args.serviceAccountConfig)) {
      // Conclude the flow (do not create kafka resources)
      return resourceName;
    }

    const kafkaClientIdKey = "kafka-client-id";
    const kafkaClientSecretKey = "kafka-client-secret";

    await this.fetchResource(
      args.openShiftConfig.proxy,
      new CreateSecret({
        ...commonArgs,
        id: { key: kafkaClientIdKey, value: args.serviceAccountConfig.clientId },
        secret: { key: kafkaClientSecretKey, value: args.serviceAccountConfig.clientSecret },
      }),
      rollbacks.slice(--rollbacksCount)
    );

    await this.fetchResource(
      args.openShiftConfig.proxy,
      new CreateKafkaSource({
        ...commonArgs,
        sinkService: resourceName,
        bootstrapServer: args.kafkaConfig.bootstrapServer,
        topic: args.kafkaConfig.topic,
        secret: {
          name: resourceName,
          keyId: kafkaClientIdKey,
          keySecret: kafkaClientSecretKey,
        },
      }),
      rollbacks.slice(--rollbacksCount)
    );

    return resourceName;
  }

  public async fetchResource<T = Resource>(
    proxyUrl: string,
    target: ResourceFetch,
    rollbacks?: ResourceFetch[]
  ): Promise<Readonly<T>> {
    const response = await fetch(proxyUrl + "/devsandbox", await target.requestInit());

    if (!response.ok) {
      if (rollbacks && rollbacks.length > 0) {
        for (const resource of rollbacks) {
          await this.fetchResource(proxyUrl, resource);
        }
      }

      throw new Error(`Error fetching ${target.name()}`);
    }

    return (await response.json()) as T;
  }

  private generateRandomId(): string {
    const randomPart = Math.random().toString(36).substring(2, 11);
    const milliseconds = new Date().getMilliseconds();
    return `${randomPart}${milliseconds}`;
  }

  public async isConnectionEstablished(config: OpenShiftSettingsConfig): Promise<boolean> {
    try {
      await this.fetchResource(
        config.proxy,
        new GetProject({
          host: config.host,
          namespace: config.namespace,
          token: config.token,
        })
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  public async onCheckConfig(config: OpenShiftSettingsConfig): Promise<boolean> {
    return isOpenShiftConfigValid(config) && this.isConnectionEstablished(config);
  }

  public async uploadOpenApiToServiceRegistry(args: {
    proxyUrl: string;
    groupId: string;
    artifactId: string;
    openApiContent: string;
    serviceAccountConfig: ServiceAccountSettingsConfig;
    serviceRegistryConfig: ServiceRegistrySettingsConfig;
  }): Promise<void> {
    const response = await fetch(args.proxyUrl + "/devsandbox", {
      method: "POST",
      headers: {
        // We are facing a 401 Error when using oauth, let's use Basic auth for now.
        Authorization:
          "Basic " + btoa(`${args.serviceAccountConfig.clientId}:${args.serviceAccountConfig.clientSecret}`),
        "Content-Type": "application/json",
        "X-Registry-ArtifactId": args.artifactId.replace(/\s|\//g, "_"),
        "Target-Url": `${args.serviceRegistryConfig.coreRegistryApi}/groups/${encodeURIComponent(
          args.groupId
        )}/artifacts`,
      },
      body: args.openApiContent,
    });

    if (!response.ok) {
      throw new Error(`Could not upload OpenAPI to Service Registry: Error ${response.status}`);
    }
  }
}
