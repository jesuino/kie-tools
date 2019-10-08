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

import { ResourceContentService, ResourceContent } from "@kogito-tooling/core-api";
import { ResourcesList } from "@kogito-tooling/core-api";
import * as Octokit from "@octokit/rest";
import * as minimatch from "minimatch";

class OctokitResponse {
  public data: GithubTreeResponse;
}

class GithubAsset {
  public type: string;
  public path: string;
  public mode: string;
  public sha: string;
  public url: string;
}

class GithubTreeResponse {
  public sha: string;
  public url: string;
  public tree: GithubAsset[];
}

class RepoInfo {
  public owner: string;
  public repo: string;
  public gitref: string;
}

export class ChromeResourceContentService implements ResourceContentService {

  private octokit = new Octokit();

  // TODO: check for limits and then fallback to raw access
  public read(uri: string): Promise<ResourceContent | undefined> {
    const repoInfo = this.repoInfo();
    const emptyResponse = new ResourceContent(uri, undefined);
    if (!repoInfo) {
      return Promise.resolve(emptyResponse);
    }
    return this.octokit.repos.getContents({
      headers: {
        accept: 'application/vnd.github.v3.raw',
        "cache-control": "no-cache"
      },
      path: uri,
      ...repoInfo
    }).then(response => {
      const assetContent: string = response.data as any;
      return new ResourceContent(uri, assetContent);
    }).catch(e => emptyResponse); // TODO: better handle this
  }

  public list(pattern: string): Promise<ResourcesList> {
    const repoInfo = this.repoInfo();
    const emptyList = new ResourcesList(pattern, []);

    if (!repoInfo) {
      return Promise.resolve(emptyList);
    }

    return this.octokit.git.getTree({
      headers: {
        "cache-control": "no-cache"
      },
      tree_sha: repoInfo.gitref,
      ...repoInfo
    }).then((v: OctokitResponse) => {
      const filteredPaths = v.data.tree.filter(file => file.type === 'blob').map(file => file.path);
      const result = minimatch.match(filteredPaths, pattern);
      return new ResourcesList(pattern, result);
    }).catch(e => emptyList); // TODO: better handle this
  }

  private repoInfo(): RepoInfo | undefined {
    const info = window.location.pathname.split('/');
    if (info.length >= 4) {
      return {
        owner: info[1],
        repo: info[2],
        gitref: info[4]
      };
    }
    return undefined;

  }

}