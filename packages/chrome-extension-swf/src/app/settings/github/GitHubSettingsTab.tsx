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

import * as React from "react";
import { Page, PageSection } from "@patternfly/react-core/dist/js/components/Page";
import { EmptyState, EmptyStateBody, EmptyStateIcon } from "@patternfly/react-core/dist/js/components/EmptyState";
import { CheckCircleIcon } from "@patternfly/react-icons/dist/js/icons/check-circle-icon";
import { Text, TextContent } from "@patternfly/react-core/dist/js/components/Text";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button";
import { GithubIcon } from "@patternfly/react-icons/dist/js/icons/github-icon";
import { Spinner } from "@patternfly/react-core/dist/js/components/Spinner";
import { Form, FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { InputGroup } from "@patternfly/react-core/dist/js/components/InputGroup";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { useCallback, useMemo, useState } from "react";
import { AuthStatus, useSettings, useSettingsDispatch } from "../SettingsContext";
import { ExclamationTriangleIcon } from "@patternfly/react-icons/dist/js/icons/exclamation-triangle-icon";
import { ExternalLinkAltIcon } from "@patternfly/react-icons/dist/js/icons/external-link-alt-icon";

export const GITHUB_OAUTH_TOKEN_SIZE = 40;
export const GITHUB_TOKENS_URL = "https://github.com/settings/tokens";
export const GITHUB_TOKENS_HOW_TO_URL =
  "https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line";
export const GITHUB_AUTH_TOKEN_COOKIE_NAME =
  "KIE-TOOLS-COOKIE__serverless-workflow-chrome-extension__github-oauth--token";

export enum GitHubSignInOption {
  PERSONAL_ACCESS_TOKEN,
  OAUTH,
}

enum GitHubTokenScope {
  GIST = "gist",
  REPO = "repo",
}

export function GitHubSettingsTab() {
  const settings = useSettings();
  const settingsDispatch = useSettingsDispatch();

  const [githubSignInOption, setGitHubSignInOption] = useState(GitHubSignInOption.PERSONAL_ACCESS_TOKEN);
  const [potentialGitHubToken, setPotentialGitHubToken] = useState<string | undefined>(undefined);
  const [isGitHubTokenValid, setIsGitHubTokenValid] = useState(true);

  const githubTokenValidated = useMemo(() => {
    return isGitHubTokenValid ? "default" : "error";
  }, [isGitHubTokenValid]);

  const githubTokenHelperText = useMemo(() => {
    return isGitHubTokenValid ? undefined : "Invalid token. Check if it has the 'repo' scope.";
  }, [isGitHubTokenValid]);

  const githubTokenToDisplay = useMemo(() => {
    return obfuscate(potentialGitHubToken ?? settings.github.token);
  }, [settings.github, potentialGitHubToken]);

  const onPasteGitHubToken = useCallback(
    (e) => {
      const token = e.clipboardData.getData("text/plain").slice(0, GITHUB_OAUTH_TOKEN_SIZE);
      setPotentialGitHubToken(token);
      settingsDispatch.github.authService
        .authenticate(token)
        .then(() => setIsGitHubTokenValid(true))
        .catch((e) => setIsGitHubTokenValid(false));
    },
    [settingsDispatch.github.authService]
  );

  const onSignOutFromGitHub = useCallback(() => {
    settingsDispatch.github.authService.reset();
    setPotentialGitHubToken(undefined);
  }, [settingsDispatch.github.authService]);

  return (
    <Page>
      {settings.github.authStatus === AuthStatus.TOKEN_EXPIRED && (
        <PageSection>
          <EmptyState>
            <EmptyStateIcon icon={ExclamationTriangleIcon} />
            <TextContent>
              <Text component={"h2"}>GitHub Token expired</Text>
            </TextContent>
            <br />
            <EmptyStateBody>
              <TextContent>Reset your token to sign in with GitHub again.</TextContent>
              <br />
              <Button variant={ButtonVariant.tertiary} onClick={onSignOutFromGitHub}>
                Reset
              </Button>
            </EmptyStateBody>
          </EmptyState>
        </PageSection>
      )}
      {settings.github.authStatus === AuthStatus.LOADING && (
        <PageSection>
          <EmptyState>
            <EmptyStateIcon icon={GithubIcon} />
            <TextContent>
              <Text component={"h2"}>Signing in with GitHub</Text>
            </TextContent>
            <br />
            <br />
            <Spinner />
          </EmptyState>
        </PageSection>
      )}
      {settings.github.authStatus === AuthStatus.SIGNED_IN && (
        <PageSection>
          <EmptyState>
            <EmptyStateIcon icon={CheckCircleIcon} color={"var(--pf-global--success-color--100)"} />
            <TextContent>
              <Text component={"h2"}>{"You're signed in with GitHub."}</Text>
            </TextContent>
            <EmptyStateBody>
              <TextContent>
                Gists are <b>{settings.github.scopes?.includes(GitHubTokenScope.GIST) ? "enabled" : "disabled"}.</b>
              </TextContent>
              <TextContent>
                Private repositories are{" "}
                <b>{settings.github.scopes?.includes(GitHubTokenScope.REPO) ? "enabled" : "disabled"}.</b>
              </TextContent>
              <br />
              <TextContent>
                <b>Token: </b>
                <i>{obfuscate(settings.github.token)}</i>
              </TextContent>
              <TextContent>
                <b>User: </b>
                <i>{settings.github.user?.login}</i>
              </TextContent>
              <TextContent>
                <b>Scope: </b>
                <i>{settings.github.scopes?.join(", ") || "(none)"}</i>
              </TextContent>
              <br />
              <Button variant={ButtonVariant.tertiary} onClick={onSignOutFromGitHub}>
                Sign out
              </Button>
            </EmptyStateBody>
          </EmptyState>
        </PageSection>
      )}
      {settings.github.authStatus === AuthStatus.SIGNED_OUT && (
        <>
          <PageSection>
            {githubSignInOption == GitHubSignInOption.PERSONAL_ACCESS_TOKEN && (
              <>
                <PageSection variant={"light"} isFilled={true} style={{ height: "100%" }}>
                  <>
                    <p>
                      <span className="pf-u-mr-sm">Disclaimer</span>
                      <a href={GITHUB_TOKENS_HOW_TO_URL} target={"_blank"}>
                        Learn more
                        <ExternalLinkAltIcon className="pf-u-mx-sm" />
                      </a>
                    </p>
                  </>
                  <br />
                  <h3>
                    <a href={GITHUB_TOKENS_URL} target={"_blank"}>
                      Create a new token
                      <ExternalLinkAltIcon className="pf-u-mx-sm" />
                    </a>
                  </h3>
                  <br />
                  <Form>
                    <FormGroup
                      isRequired={true}
                      helperTextInvalid={githubTokenHelperText}
                      validated={githubTokenValidated}
                      label={"Token"}
                      fieldId={"github-pat"}
                      helperText={"Your token must include the 'repo' scope."}
                    >
                      <InputGroup>
                        <TextInput
                          autoComplete={"off"}
                          id="token-input"
                          name="tokenInput"
                          aria-describedby="token-text-input-helper"
                          placeholder={"Paste your GitHub token here"}
                          maxLength={GITHUB_OAUTH_TOKEN_SIZE}
                          validated={githubTokenValidated}
                          value={githubTokenToDisplay}
                          onPaste={onPasteGitHubToken}
                          autoFocus={true}
                        />
                      </InputGroup>
                    </FormGroup>
                  </Form>
                </PageSection>
              </>
            )}
          </PageSection>
        </>
      )}
    </Page>
  );
}

export function obfuscate(token?: string) {
  if (!token) {
    return undefined;
  }

  if (token.length <= 8) {
    return token;
  }

  const stars = new Array(token.length - 8).join("*");
  const pieceToObfuscate = token.substring(4, token.length - 4);
  return token.replace(pieceToObfuscate, stars);
}
