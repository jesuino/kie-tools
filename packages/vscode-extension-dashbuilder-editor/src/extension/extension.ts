/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
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

import { backendI18nDefaults, backendI18nDictionaries } from "@kie-tools-core/backend/dist/i18n";
import { VsCodeBackendProxy } from "@kie-tools-core/backend/dist/vscode";
import { EditorEnvelopeLocator, EnvelopeMapping } from "@kie-tools-core/editor/dist/api";
import { I18n } from "@kie-tools-core/i18n/dist/core";
import * as KogitoVsCode from "@kie-tools-core/vscode-extension";
import * as vscode from "vscode";
import { BackendManagerService } from "@kie-tools-core/backend/dist/api";
import { ComponentServer } from "./ComponentsHttpServer";

let backendProxy: VsCodeBackendProxy;

export function activate(context: vscode.ExtensionContext) {
  console.info("Extension is alive.");

  const componentsPath = context.extensionPath + "/dist/webview/dashbuilder/component/";

  const backendI18n = new I18n(backendI18nDefaults, backendI18nDictionaries, vscode.env.language);
  const backendManager = new BackendManagerService({ localHttpServer: new ComponentServer(componentsPath) });
  backendProxy = new VsCodeBackendProxy(context, backendI18n);

  backendProxy.registerBackendManager(backendManager);

  KogitoVsCode.startExtension({
    extensionName: "kie-group.vscode-extension-dashbuilder-editor",
    context: context,
    viewType: "kieKogitoWebviewEditorsDashbuilder",
    generateSvgCommandId: "",
    silentlyGenerateSvgCommandId: "",
    editorEnvelopeLocator: new EditorEnvelopeLocator("vscode", [
      new EnvelopeMapping({
        type: "dashbuilder",
        filePathGlob: "**/*.dash.+(yaml|yml)",
        resourcesPathPrefix: "dist/webview/",
        envelopePath: "dist/webview/DashbuilderEditorEnvelopeApp.js",
      }),
      new EnvelopeMapping({
        type: "dashbuilder",
        filePathGlob: "**/*.dash.json",
        resourcesPathPrefix: "dist/webview/",
        envelopePath: "dist/webview/DashbuilderEditorEnvelopeApp.js",
      }),
    ]),

    backendProxy: backendProxy,
  });

  backendManager.start().catch((e) => {
    console.info("Not able to start component server.");
  });

  console.info("Extension is successfully setup.");
}

export function deactivate() {
  backendProxy?.stopServices();
}
