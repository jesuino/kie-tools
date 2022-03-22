/*
 * Copyright 2021 Red Hat, Inc. and/or its affiliates.
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

import { useWorkspaces } from "../WorkspacesContext";
import * as React from "react";
import { useEffect } from "react";
import { useHistory } from "react-router";
import { useRoutes } from "../../navigation/Hooks";
import { OnlineEditorPage } from "../../pageTemplate/OnlineEditorPage";
import { PageSection } from "@patternfly/react-core/dist/js/components/Page";
import { Text, TextContent, TextVariants } from "@patternfly/react-core/dist/js/components/Text";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { Spinner } from "@patternfly/react-core/dist/js/components/Spinner";
import { SW_JSON_EXTENSION } from "../../openshift/OpenShiftContext";

export function NewWorkspaceWithEmptyFilePage() {
  const workspaces = useWorkspaces();
  const history = useHistory();
  const routes = useRoutes();

  useEffect(() => {
    workspaces
      .createWorkspaceFromLocal({ useInMemoryFs: false, localFiles: [] })
      .then(async ({ workspace }) =>
        workspaces.addEmptyFile({
          fs: await workspaces.fsService.getWorkspaceFs(workspace.workspaceId),
          workspaceId: workspace.workspaceId,
          destinationDirRelativePath: "",
          extension: SW_JSON_EXTENSION,
        })
      )
      .then((file) => {
        history.replace({
          pathname: routes.workspaceWithFilePath.path({
            workspaceId: file.workspaceId,
            fileRelativePath: file.relativePath,
          }),
        });
      });
  }, [routes, history, workspaces]);

  return (
    <OnlineEditorPage>
      <PageSection variant={"light"} isFilled={true} padding={{ default: "noPadding" }}>
        <Bullseye>
          <TextContent>
            <Bullseye>
              <Spinner />
            </Bullseye>
            <br />
            <Text component={TextVariants.p}>{`Loading...`}</Text>
          </TextContent>
        </Bullseye>
      </PageSection>
    </OnlineEditorPage>
  );
}
