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

import { TextDocument } from "vscode-json-languageservice";
import { CodeLens, CompletionItem, CompletionItemKind, Position, Range } from "vscode-languageserver-types";
import {
  dump,
  Kind,
  load,
  YAMLAnchorReference,
  YamlMap,
  YAMLMapping,
  YAMLNode,
  YAMLScalar,
  YAMLSequence,
} from "yaml-language-server-parser";
import { FileLanguage } from "../api";
import { indentText } from "./indentText";
import { matchNodeWithLocation } from "./matchNodeWithLocation";
import { findNodeAtOffset, SwfLanguageService, SwfLanguageServiceArgs } from "./SwfLanguageService";
import { CodeCompletionStrategy, ShouldCompleteArgs, SwfLsNode, TranslateArgs } from "./types";

export class SwfYamlLanguageService {
  private readonly ls: SwfLanguageService;
  private readonly codeCompletionStrategy: YamlCodeCompletionStrategy;

  constructor(args: Omit<SwfLanguageServiceArgs, "lang">) {
    this.ls = new SwfLanguageService({
      ...args,
      lang: {
        fileLanguage: FileLanguage.YAML,
        fileMatch: ["*.sw.yaml", "*.sw.yml"],
      },
    });

    this.codeCompletionStrategy = new YamlCodeCompletionStrategy();
  }

  parseContent(content: string): SwfLsNode | undefined {
    const ast = load(content);

    // check if the yaml is not valid
    if (ast && ast.errors && ast.errors.length) {
      throw new Error(ast.errors[0].message);
    }

    return astConvert(ast);
  }

  /**
   * Check if a node at a position is uncompleted.
   * eg. "refName: 🎯"
   *
   * @param args -
   * @returns true if the node is uncompleted, false otherwise.
   */
  public isNodeUncompleted = (args: {
    content: string;
    uri: string;
    rootNode: SwfLsNode;
    cursorOffset: number;
  }): boolean => {
    if (args.content.slice(args.cursorOffset - 1, args.cursorOffset) !== " ") {
      return false;
    }

    const nodeAtPrevOffset = findNodeAtOffset(args.rootNode, args.cursorOffset - 1, true);

    return nodeAtPrevOffset?.colonOffset === args.cursorOffset - 1;
  };

  public async getCompletionItems(args: {
    content: string;
    uri: string;
    cursorPosition: Position;
    cursorWordRange: Range;
  }): Promise<CompletionItem[]> {
    const rootNode = this.parseContent(args.content);
    const doc = TextDocument.create(args.uri, FileLanguage.YAML, 0, args.content);
    const cursorOffset = doc.offsetAt(args.cursorPosition);

    if (
      !rootNode ||
      args.content.slice(cursorOffset - 1, cursorOffset) === ":" ||
      args.content.slice(cursorOffset - 1, cursorOffset) === "-"
    ) {
      return [];
    }

    const isCurrentNodeUncompleted = this.isNodeUncompleted({
      ...args,
      rootNode,
      cursorOffset,
    });

    if (isCurrentNodeUncompleted) {
      args.cursorPosition = Position.create(args.cursorPosition.line, args.cursorPosition.character - 1);
    }

    return await this.ls.getCompletionItems({
      ...args,
      rootNode,
      codeCompletionStrategy: this.codeCompletionStrategy,
    });
  }

  public async getCodeLenses(args: { content: string; uri: string }): Promise<CodeLens[]> {
    return this.ls.getCodeLenses({
      ...args,
      rootNode: this.parseContent(args.content),
      codeCompletionStrategy: this.codeCompletionStrategy,
    });
  }

  public async getDiagnostics(args: { content: string; uriPath: string }) {
    return this.ls.getDiagnostics({ ...args, rootNode: this.parseContent(args.content) });
  }

  public dispose() {
    return this.ls.dispose();
  }
}

const astConvert = (node: YAMLNode, parentNode?: SwfLsNode): SwfLsNode => {
  const convertedNode: SwfLsNode = {
    type: "object",
    offset: node.startPosition,
    length: node.endPosition - node.startPosition,
    colonOffset: node.endPosition,
    parent: parentNode,
  };

  if (node.kind === Kind.SCALAR) {
    convertedNode.value = (node as YAMLScalar).value;
    convertedNode.type = "string";
  } else if (node.kind === Kind.MAP) {
    const yamlMap = node as YamlMap;
    convertedNode.value = yamlMap.value;
    convertedNode.children = yamlMap.mappings.map((mapping) => astConvert(mapping, convertedNode));
    convertedNode.type = "object";
  } else if (node.kind === Kind.MAPPING) {
    const yamlMapping = node as YAMLMapping;
    convertedNode.value = yamlMapping.value;
    convertedNode.children = [
      astConvert(yamlMapping.key, convertedNode),
      ...(convertedNode.value ? [astConvert(yamlMapping.value, convertedNode)] : []),
    ];
    convertedNode.type = "property";
  } else if (node.kind === Kind.SEQ) {
    convertedNode.children = (node as YAMLSequence).items
      .filter((item) => item)
      .map((item) => astConvert(item, convertedNode));
    convertedNode.type = "array";
  } else if (node.kind === Kind.ANCHOR_REF || node.kind === Kind.INCLUDE_REF) {
    convertedNode.value = (node as YAMLAnchorReference).value;
    convertedNode.type = "object";
  }

  return convertedNode;
};

export class YamlCodeCompletionStrategy implements CodeCompletionStrategy {
  public translate(args: TranslateArgs): string {
    const skipFirstLineIndent = args.completionItemKind !== CompletionItemKind.Module;
    const completionItemNewLine = args.completionItemKind === CompletionItemKind.Module ? "\n" : "";
    const completionText =
      completionItemNewLine + indentText(dump(args.completion, {}).slice(0, -1), 2, " ", skipFirstLineIndent);

    return ([CompletionItemKind.Interface, CompletionItemKind.Reference] as CompletionItemKind[]).includes(
      args.completionItemKind
    ) && args.overwriteRange?.end.character === 0
      ? `- ${completionText}\n`
      : completionText;
  }

  public formatLabel(label: string, completionItemKind: CompletionItemKind): string {
    return ([CompletionItemKind.Function, CompletionItemKind.Folder] as CompletionItemKind[]).includes(
      completionItemKind
    )
      ? `'${label}'`
      : label;
  }

  public getStartNodeValuePosition(document: TextDocument, node: SwfLsNode): Position | undefined {
    const position = document.positionAt(node.offset);
    const nextPosition = document.positionAt(node.offset + 1);
    const charAtPosition = document.getText(Range.create(position, nextPosition));
    const isStartingCharJsonFormat = /"|'|\[|{/.test(charAtPosition);

    // if node is in JSON format return a position the same way SwfJsonLanguageService does.
    return isStartingCharJsonFormat ? nextPosition : position;
  }

  public shouldComplete(args: ShouldCompleteArgs): boolean {
    return matchNodeWithLocation(args.root, args.node, args.path);
  }
}
