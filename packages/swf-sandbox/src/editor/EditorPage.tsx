/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from "react";
import { ChannelType } from "@kie-tools-core/editor/dist/api";
import { EmbeddedEditorFile, StateControl } from "@kie-tools-core/editor/dist/channel";
import {
  EmbeddedEditor,
  EmbeddedEditorRef,
  KogitoEditorChannelApiImpl,
  useStateControlSubscription,
} from "@kie-tools-core/editor/dist/embedded";
import { ResourceContentRequest, ResourceListRequest } from "@kie-tools-core/workspace/dist/api";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { Page, PageSection } from "@patternfly/react-core/dist/js/components/Page";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHistory } from "react-router";
import { AlertsController } from "../alerts/Alerts";
import { LoadingSpinner } from "./LoadingSpinner";
import { useEditorEnvelopeLocator } from "../envelopeLocator/EditorEnvelopeLocatorContext";
import { isSandboxAsset, isServerlessWorkflow } from "../extension";
import { useAppI18n } from "../i18n";
import { useRoutes } from "../navigation/Hooks";
import { OnlineEditorPage } from "../pageTemplate/OnlineEditorPage";
import { useQueryParams } from "../queryParams/QueryParamsContext";
import { useCancelableEffect, useController, usePrevious } from "../reactExt/Hooks";
import { isServiceAccountConfigValid } from "../settings/serviceAccount/ServiceAccountConfig";
import { isServiceRegistryConfigValid } from "../settings/serviceRegistry/ServiceRegistryConfig";
import { useSettings } from "../settings/SettingsContext";
import { PromiseStateWrapper } from "../workspace/hooks/PromiseState";
import { useWorkspaceFilePromise } from "../workspace/hooks/WorkspaceFileHooks";
import { useWorkspaces } from "../workspace/WorkspacesContext";
import { EditorSwfLanguageService } from "./api/EditorSwfLanguageService";
import { ServerlessWorkflowEditorChannelApiImpl } from "./api/ServerlessWorkflowEditorChannelApiImpl";
import { SwfLanguageServiceChannelApiImpl } from "./api/SwfLanguageServiceChannelApiImpl";
import { SwfServiceCatalogChannelApiImpl } from "./api/SwfServiceCatalogChannelApiImpl";
import { ConfirmDeployModal } from "./Deploy/ConfirmDeployModal";
import { EditorPageDockDrawer, EditorPageDockDrawerRef } from "./EditorPageDockDrawer";
import { EditorPageErrorPage } from "./EditorPageErrorPage";
import { EditorToolbar } from "./EditorToolbar";

export interface Props {
  workspaceId: string;
  fileRelativePath: string;
}

export function EditorPage(props: Props) {
  const settings = useSettings();
  const routes = useRoutes();
  const editorEnvelopeLocator = useEditorEnvelopeLocator();
  const history = useHistory();
  const workspaces = useWorkspaces();
  const { locale } = useAppI18n();
  const [editor, editorRef] = useController<EmbeddedEditorRef>();
  const [alerts, alertsRef] = useController<AlertsController>();
  const [editorPageDock, editorPageDockRef] = useController<EditorPageDockDrawerRef>();
  const lastContent = useRef<string>();
  const workspaceFilePromise = useWorkspaceFilePromise(props.workspaceId, props.fileRelativePath);
  const [embeddedEditorFile, setEmbeddedEditorFile] = useState<EmbeddedEditorFile>();
  const isEditorReady = useMemo(() => editor?.isReady, [editor]);
  const [isReady, setReady] = useState(false);

  const queryParams = useQueryParams();

  // keep the page in sync with the name of `workspaceFilePromise`, even if changes
  useEffect(() => {
    if (!workspaceFilePromise.data) {
      return;
    }

    history.replace({
      pathname: routes.workspaceWithFilePath.path({
        workspaceId: workspaceFilePromise.data.workspaceId,
        fileRelativePath: workspaceFilePromise.data.relativePathWithoutExtension,
        extension: workspaceFilePromise.data.extension,
      }),
      search: queryParams.toString(),
    });
  }, [history, routes, workspaceFilePromise, queryParams]);

  // update EmbeddedEditorFile, but only if content is different than what was saved
  useCancelableEffect(
    useCallback(
      ({ canceled }) => {
        if (!workspaceFilePromise.data) {
          return;
        }

        workspaceFilePromise.data.getFileContentsAsString().then((content) => {
          if (canceled.get()) {
            return;
          }

          if (content === lastContent.current) {
            return;
          }

          lastContent.current = content;

          setEmbeddedEditorFile({
            path: workspaceFilePromise.data.relativePath,
            getFileContents: async () => content,
            isReadOnly: !isSandboxAsset(workspaceFilePromise.data.relativePath),
            fileExtension: workspaceFilePromise.data.extension,
            fileName: workspaceFilePromise.data.name,
          });
        });
      },
      [workspaceFilePromise]
    )
  );

  // auto-save
  const uniqueFileId = workspaceFilePromise.data
    ? workspaces.getUniqueFileIdentifier(workspaceFilePromise.data)
    : undefined;

  const prevUniqueFileId = usePrevious(uniqueFileId);
  if (prevUniqueFileId !== uniqueFileId) {
    lastContent.current = undefined;
  }

  const saveContent = useCallback(async () => {
    if (!workspaceFilePromise.data || !editor) {
      return;
    }

    const content = await editor.getContent();
    // FIXME: Uncomment when KOGITO-6181 is fixed
    // const svgString = await editor.getPreview();

    lastContent.current = content;

    // FIXME: Uncomment when KOGITO-6181 is fixed
    // if (svgString) {
    //   await workspaces.svgService.createOrOverwriteSvg(workspaceFilePromise.data, svgString);
    // }

    await workspaces.updateFile({
      fs: await workspaces.fsService.getWorkspaceFs(workspaceFilePromise.data.workspaceId),
      file: workspaceFilePromise.data,
      getNewContents: () => Promise.resolve(content),
    });
    editor?.getStateControl().setSavedCommand();
  }, [workspaces, editor, workspaceFilePromise]);

  useStateControlSubscription(
    editor,
    useCallback(
      (isDirty) => {
        if (!isDirty) {
          return;
        }

        saveContent();
      },
      [saveContent]
    ),
    { throttle: 200 }
  );

  useEffect(() => {
    alerts?.closeAll();
  }, [alerts]);

  const handleResourceContentRequest = useCallback(
    async (request: ResourceContentRequest) => {
      return workspaces.resourceContentGet({
        fs: await workspaces.fsService.getWorkspaceFs(props.workspaceId),
        workspaceId: props.workspaceId,
        relativePath: request.path,
        opts: request.opts,
      });
    },
    [props.workspaceId, workspaces]
  );

  const handleResourceListRequest = useCallback(
    async (request: ResourceListRequest) => {
      return workspaces.resourceContentList({
        fs: await workspaces.fsService.getWorkspaceFs(props.workspaceId),
        workspaceId: props.workspaceId,
        globPattern: request.pattern,
        opts: request.opts,
      });
    },
    [workspaces, props.workspaceId]
  );

  // TODO: Make notifications available when supported
  // useEffect(() => {
  //   if (!editor?.isReady) {
  //     return;
  //   }

  //   //FIXME: Removing this timeout makes the notifications not work some times. Need to investigate.
  //   setTimeout(() => {
  //     editor?.validate().then((notifications) => {
  //       editorPageDock?.setNotifications(
  //         i18n.terms.validation,
  //         "",
  //         // Removing the notification path so that we don't group it by path, as we're only validating one file.
  //         Array.isArray(notifications) ? notifications.map((n) => ({ ...n, path: "" })) : []
  //       );
  //     });
  //   }, 200);
  // }, [workspaceFilePromise, editor, i18n, editorPageDock]);

  const handleOpenFile = useCallback(
    async (relativePath: string) => {
      if (!workspaceFilePromise.data) {
        return;
      }

      const file = await workspaces.getFile({
        fs: await workspaces.fsService.getWorkspaceFs(workspaceFilePromise.data.workspaceId),
        workspaceId: workspaceFilePromise.data.workspaceId,
        relativePath,
      });

      if (!file) {
        throw new Error(`Can't find ${relativePath} on Workspace '${workspaceFilePromise.data.workspaceId}'`);
      }

      history.push({
        pathname: routes.workspaceWithFilePath.path({
          workspaceId: file.workspaceId,
          fileRelativePath: file.relativePathWithoutExtension,
          extension: file.extension,
        }),
      });
    },
    [workspaceFilePromise, workspaces, history, routes]
  );

  const handleSetContentError = useCallback((e) => {
    // Nothing to do for now
    console.log(e);
  }, []);

  const stateControl = useMemo(() => new StateControl(), [embeddedEditorFile?.getFileContents]);

  const kogitoEditorChannelApiImpl = useMemo(
    () =>
      embeddedEditorFile &&
      new KogitoEditorChannelApiImpl(stateControl, embeddedEditorFile, locale, {
        kogitoEditor_ready: () => {
          setReady(true);
        },
        kogitoWorkspace_openFile: handleOpenFile,
        kogitoWorkspace_resourceContentRequest: handleResourceContentRequest,
        kogitoWorkspace_resourceListRequest: handleResourceListRequest,
        kogitoEditor_setContentError: handleSetContentError,
      }),
    [
      embeddedEditorFile,
      handleOpenFile,
      handleResourceContentRequest,
      handleResourceListRequest,
      handleSetContentError,
      locale,
      stateControl,
    ]
  );

  const apiImpl = useMemo(() => {
    // TODO: This is being triggered on every edit. Should it?
    let swfServiceCatalogChannelApiImpl;
    let swfLanguageServiceChannelApiImpl;
    if (
      isServerlessWorkflow(props.fileRelativePath) &&
      isServiceAccountConfigValid(settings.serviceAccount.config) &&
      isServiceRegistryConfigValid(settings.serviceRegistry.config)
    ) {
      const serviceRegistryInfo = {
        authInfo: {
          username: settings.serviceAccount.config.clientId,
          token: settings.serviceAccount.config.clientSecret,
        },
        url: settings.serviceRegistry.config.coreRegistryApi,
      };

      swfServiceCatalogChannelApiImpl = new SwfServiceCatalogChannelApiImpl({
        serviceRegistryInfo,
        proxyUrl: settings.kieSandboxExtendedServices.config.buildUrl(),
      });

      swfLanguageServiceChannelApiImpl = new SwfLanguageServiceChannelApiImpl(
        new EditorSwfLanguageService({ serviceRegistryInfo })
      );
    }
    return (
      kogitoEditorChannelApiImpl &&
      new ServerlessWorkflowEditorChannelApiImpl(
        kogitoEditorChannelApiImpl,
        swfServiceCatalogChannelApiImpl,
        swfLanguageServiceChannelApiImpl
      )
    );
  }, [
    kogitoEditorChannelApiImpl,
    props.fileRelativePath,
    settings.kieSandboxExtendedServices.config,
    settings.serviceAccount.config,
    settings.serviceRegistry.config,
  ]);

  return (
    <OnlineEditorPage>
      <PromiseStateWrapper
        promise={workspaceFilePromise}
        pending={<LoadingSpinner />}
        rejected={(errors) => <EditorPageErrorPage errors={errors} path={props.fileRelativePath} />}
        resolved={(file) => (
          <>
            <Page>
              <EditorToolbar
                workspaceFile={file}
                editor={editor}
                alerts={alerts}
                alertsRef={alertsRef}
                editorPageDock={editorPageDock}
              />
              <Divider />
              <EditorPageDockDrawer ref={editorPageDockRef} isEditorReady={editor?.isReady} workspaceFile={file}>
                <PageSection hasOverflowScroll={true} padding={{ default: "noPadding" }}>
                  <div style={{ height: "100%" }}>
                    {!isEditorReady && <LoadingSpinner />}
                    <div style={{ display: isEditorReady ? "inline" : "none" }}>
                      {embeddedEditorFile && apiImpl && (
                        <EmbeddedEditor
                          /* FIXME: By providing a different `key` everytime, we avoid calling `setContent` twice on the same Editor.
                           * This is by design, and after setContent supports multiple calls on the same instance, we can remove that.
                           */
                          key={workspaces.getUniqueFileIdentifier(file)}
                          ref={editorRef}
                          file={embeddedEditorFile}
                          editorEnvelopeLocator={editorEnvelopeLocator}
                          channelType={ChannelType.ONLINE_MULTI_FILE}
                          locale={locale}
                          customChannelApiImpl={apiImpl}
                          stateControl={stateControl}
                          isReady={isReady}
                        />
                      )}
                    </div>
                  </div>
                </PageSection>
              </EditorPageDockDrawer>
            </Page>
            <ConfirmDeployModal workspaceFile={file} alerts={alerts} />
          </>
        )}
      />
    </OnlineEditorPage>
  );
}