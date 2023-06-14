/*
 * Copyright 2021 Red Hat, Inc. and/or its affiliates.
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
package org.dashbuilder.dataset.def;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

import org.dashbuilder.dataprovider.DataSetProviderType;
import org.dashbuilder.dataset.validation.groups.ExternalDataSetDefValidation;

public class ExternalDataSetDef extends DataSetDef {

    @NotNull(groups = {ExternalDataSetDefValidation.class})
    @Size(min = 4, groups = {ExternalDataSetDefValidation.class})
    private String url;

    private boolean dynamic;

    private String expression;

    private String content;

    private Map<String, String> headers = new HashMap<>();

    private Map<String, String> query = new HashMap<>();

    private boolean accumulate;

    private ExternalServiceType type;

    private List<String> join;

    public ExternalDataSetDef() {
        super.setProvider(DataSetProviderType.EXTERNAL);
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public boolean isDynamic() {
        return dynamic;
    }

    public void setDynamic(boolean dynamic) {
        this.dynamic = dynamic;
    }

    public String getExpression() {
        return expression;
    }

    public void setExpression(String expression) {
        this.expression = expression;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<String> getJoin() {
        return join;
    }

    public void setJoin(List<String> join) {
        this.join = join;
    }

    public Map<String, String> getHeaders() {
        return headers;
    }

    public void setHeaders(Map<String, String> headers) {
        this.headers = headers;
    }

    public boolean isAccumulate() {
        return accumulate;
    }

    public void setAccumulate(boolean accumulate) {
        this.accumulate = accumulate;
    }

    public ExternalServiceType getType() {
        return type;
    }

    public void setType(ExternalServiceType type) {
        this.type = type;
    }

    public void setQuery(Map<String, String> query) {
        this.query = query;
    }

    public Map<String, String> getQuery() {
        return query;
    }

    @Override
    public DataSetDef clone() {
        var def = new ExternalDataSetDef();
        clone(def);
        def.setUrl(getUrl());
        def.setDynamic(isDynamic());
        def.setHeaders(getHeaders());
        def.setAccumulate(isAccumulate());
        def.setType(getType());
        def.setJoin(getJoin());
        def.setQuery(getQuery());
        return def;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (!super.equals(obj))
            return false;
        if (getClass() != obj.getClass())
            return false;
        var other = (ExternalDataSetDef) obj;
        return Objects.equals(content, other.content) &&
               dynamic == other.dynamic &&
               Objects.equals(expression, other.expression) &&
               Objects.equals(headers, other.headers) &&
               Objects.equals(url, other.url) &&
               Objects.equals(accumulate, other.accumulate) &&
               Objects.equals(type, other.type) &&
               Objects.equals(join, other.join) &&
               Objects.equals(query, other.query);
    }

    public String toString() {
        var out = new StringBuilder();
        out.append("UUID=").append(UUID).append("\n");
        out.append("Provider=").append(provider).append("\n");
        out.append("Public=").append(isPublic).append("\n");
        out.append("Push enabled=").append(pushEnabled).append("\n");
        out.append("Push max size=").append(pushMaxSize).append(" Kb\n");
        out.append("URL=").append(url).append("\n");
        out.append("Dynamic=").append(dynamic).append("\n");
        out.append("Expression=").append(expression).append("\n");
        out.append("Content=").append(content).append("\n");
        out.append("Headers=").append(headers).append("\n");
        out.append("Accumulate=").append(accumulate).append("\n");
        out.append("Type=").append(type);
        out.append("Join=").append(join);
        out.append("Query=").append(query);
        return out.toString();
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(),
                url,
                dynamic,
                expression,
                content,
                headers,
                accumulate,
                type,
                join,
                query);
    }

}
