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

import * as React from "react";
import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { useHistory } from "react-router";
import { Button } from "@patternfly/react-core/dist/js/components/Button";
import { EmptyState, EmptyStateBody, EmptyStateIcon } from "@patternfly/react-core/dist/js/components/EmptyState";
import { Page, PageSection } from "@patternfly/react-core/dist/js/components/Page";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { Text, TextContent, TextVariants } from "@patternfly/react-core/dist/js/components/Text";
import { Flex, FlexItem } from "@patternfly/react-core/dist/js/layouts/Flex";
import { Stack, StackItem } from "@patternfly/react-core/dist/js/layouts/Stack";
import { CubesIcon } from "@patternfly/react-icons/dist/js/icons/cubes-icon";
import {
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerSection,
} from "@patternfly/react-core/dist/js/components/Drawer";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { useRoutes } from "../../navigation/Hooks";
import { PromiseStateWrapper } from "../../workspace/hooks/PromiseState";
import { useQueryParam, useQueryParams } from "../../queryParams/QueryParamsContext";
import { QueryParams } from "../../navigation/Routes";
import { useWorkspaceDescriptorsPromise } from "../../workspace/hooks/WorkspacesHooks";
import { OnlineEditorPage } from "../../pageTemplate/OnlineEditorPage";
import { ErrorBoundary } from "../../reactExt/ErrorBoundary";
import { WorkspacesListDrawerPanelContent } from "./WorkspacesListDrawerPanelContent";
import { DeploymentDetails, WorkspaceCard, WorkspaceCardError } from "./WorkspaceCard";
import { useOpenShift } from "../../openshift/OpenShiftContext";
import { useSettings } from "../../settings/SettingsContext";

const DEPLOYMENTS_DETAILS_POLLING_INTERVAL = 5000;

export function ServerlessWorkflowList() {
  const routes = useRoutes();
  const history = useHistory();
  const queryParams = useQueryParams();
  const workspaceDescriptorsPromise = useWorkspaceDescriptorsPromise();
  const expandedWorkspaceId = useQueryParam(QueryParams.EXPAND);
  const openshiftService = useOpenShift();
  const { openshift } = useSettings();
  const [deploymentDetailsMap, setDeploymentDetailsMap] = useState(new Map<string, DeploymentDetails>());
  const deploymentsDetailsPolling = useRef<number>();

  useEffect(() => {
    const mapDeployments = async () => {
      if (!workspaceDescriptorsPromise.data) {
        return;
      }
      const deployments = await openshiftService.listDeployments(openshift.config);
      const services = await openshiftService.listServices(openshift.config);

      const map = new Map<string, DeploymentDetails>();

      workspaceDescriptorsPromise.data.forEach((descriptor) => {
        if (descriptor.deploymentResourceName) {
          map.set(descriptor.deploymentResourceName, {
            workspaceId: descriptor.workspaceId,
            resourceName: descriptor.deploymentResourceName,
          });
        }
      });

      deployments?.items.forEach((deployment) => {
        const resourceName = deployment.metadata.labels["serving.knative.dev/service"];
        if (resourceName) {
          const details = map.get(resourceName);
          if (details) {
            details.pods = deployment.status.replicas ?? 0;
            map.set(resourceName, details);
          }
        }
      });

      services?.items.forEach((service) => {
        const resourceName = service.metadata.name;
        if (resourceName) {
          const details = map.get(resourceName);
          if (details) {
            details.creationTimestamp = service.metadata.creationTimestamp;
            details.namespace = service.metadata.namespace;
            details.url = service.status.url;
            map.set(resourceName, details);
          }
        }
      });

      setDeploymentDetailsMap(map);
    };
    mapDeployments();
    deploymentsDetailsPolling.current = window.setInterval(
      () => mapDeployments(),
      DEPLOYMENTS_DETAILS_POLLING_INTERVAL
    );

    return () => {
      window.clearInterval(deploymentsDetailsPolling.current);
    };
  }, [openshift.config, openshiftService, workspaceDescriptorsPromise.data]);

  const emptyState = useMemo(
    () => (
      <EmptyState>
        <EmptyStateIcon icon={PlusCircleIcon} />
        <Title headingLevel="h4" size="lg">
          Your Serverless Workflows are shown here
        </Title>
        <EmptyStateBody>
          For help getting started, access the <a>quick start guide</a>.
        </EmptyStateBody>
        <Button variant="primary" onClick={() => history.replace({ pathname: routes.newWorskapce.path({}) })}>
          Create Serverless Workflow
        </Button>
      </EmptyState>
    ),
    [routes, history]
  );

  const closeExpandedWorkspace = useCallback(() => {
    history.replace({
      pathname: routes.home.path({}),
      search: queryParams.without(QueryParams.EXPAND).toString(),
    });
  }, [history, routes, queryParams]);

  const expandWorkspace = useCallback(
    (workspaceId: string) => {
      const expand = workspaceId !== expandedWorkspaceId && workspaceId;
      if (!expand) {
        closeExpandedWorkspace();
        return;
      }

      history.replace({
        pathname: routes.home.path({}),
        search: routes.home.queryString({ expand }),
      });
    },
    [closeExpandedWorkspace, history, routes, expandedWorkspaceId]
  );

  useEffect(() => {
    if (
      workspaceDescriptorsPromise.data &&
      !workspaceDescriptorsPromise.data.map((f) => f.workspaceId).includes(expandedWorkspaceId!)
    ) {
      closeExpandedWorkspace();
    }
  }, [workspaceDescriptorsPromise, closeExpandedWorkspace, expandedWorkspaceId]);

  return (
    <OnlineEditorPage>
      <Page style={{ position: "relative" }}>
        <PageSection>
          <PromiseStateWrapper
            promise={workspaceDescriptorsPromise}
            rejected={(e) => <>Error fetching workspaces: {e + ""}</>}
            resolved={(workspaceDescriptors) => {
              if (workspaceDescriptors.length === 0) {
                return emptyState;
              }
              return (
                <Flex direction={{ default: "column" }} fullWidth={{ default: "fullWidth" }} style={{ height: "100%" }}>
                  <FlexItem alignSelf={{ default: "alignSelfCenter" }}>
                    <Button
                      variant="primary"
                      onClick={() => history.replace({ pathname: routes.newWorskapce.path({}) })}
                    >
                      Create Serverless Workflow
                    </Button>
                  </FlexItem>
                  <FlexItem grow={{ default: "grow" }}>
                    <Drawer isExpanded={!!expandedWorkspaceId} isInline={true}>
                      <DrawerSection style={{ backgroundColor: "transparent" }}>
                        <TextContent>
                          <Text component={TextVariants.h1}>Workflows</Text>
                        </TextContent>
                        <br />
                      </DrawerSection>
                      <DrawerContent
                        style={{ backgroundColor: "transparent" }}
                        panelContent={
                          <WorkspacesListDrawerPanelContent
                            workspaceId={expandedWorkspaceId}
                            onClose={closeExpandedWorkspace}
                          />
                        }
                      >
                        <DrawerContentBody>
                          {workspaceDescriptors.length > 0 && (
                            <Stack hasGutter={true} style={{ padding: "10px" }}>
                              {workspaceDescriptors
                                .sort((a, b) =>
                                  new Date(a.lastUpdatedDateISO) < new Date(b.lastUpdatedDateISO) ? 1 : -1
                                )
                                .map((workspace) => (
                                  <StackItem key={workspace.workspaceId}>
                                    <ErrorBoundary error={<WorkspaceCardError workspace={workspace} />}>
                                      <WorkspaceCard
                                        workspaceId={workspace.workspaceId}
                                        onSelect={() => expandWorkspace(workspace.workspaceId)}
                                        isSelected={workspace.workspaceId === expandedWorkspaceId}
                                        deploymentDetailsMap={deploymentDetailsMap}
                                      />
                                    </ErrorBoundary>
                                  </StackItem>
                                ))}
                            </Stack>
                          )}
                          {workspaceDescriptors.length === 0 && (
                            <Bullseye>
                              <EmptyState>
                                <EmptyStateIcon icon={CubesIcon} />
                                <Title headingLevel="h4" size="lg">
                                  {`Nothing here`}
                                </Title>
                                <EmptyStateBody>{`Start by adding a new model`}</EmptyStateBody>
                              </EmptyState>
                            </Bullseye>
                          )}
                        </DrawerContentBody>
                      </DrawerContent>
                    </Drawer>
                  </FlexItem>
                </Flex>
              );
            }}
          />
        </PageSection>
      </Page>
    </OnlineEditorPage>
  );
}