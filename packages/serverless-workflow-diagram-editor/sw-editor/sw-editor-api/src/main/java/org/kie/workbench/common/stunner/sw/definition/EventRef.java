/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.kie.workbench.common.stunner.sw.definition;

import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import jsinterop.annotations.JsIgnore;
import jsinterop.annotations.JsType;
import org.jboss.errai.databinding.client.api.Bindable;
import org.kie.workbench.common.stunner.core.definition.annotation.Definition;
import org.kie.workbench.common.stunner.core.definition.annotation.Property;
import org.kie.workbench.common.stunner.core.definition.annotation.definition.Category;
import org.kie.workbench.common.stunner.core.definition.annotation.definition.Labels;
import org.kie.workbench.common.stunner.core.definition.property.PropertyMetaTypes;

@Bindable
@Definition
@JsType
public class EventRef {

    public static final String LABEL_EVENT = "event";

    @Category
    @JsIgnore
    public static final transient String category = Categories.EVENTS;

    @Labels
    @JsIgnore
    private static final Set<String> labels = Stream.of(Workflow.LABEL_ROOT_NODE,
                                                        LABEL_EVENT).collect(Collectors.toSet());


    @Property
    // TODO: Is there a real need for making this dynamic?
    // @Id
    // @Title
    // @Description
    public String eventRef;

    @Property(meta = PropertyMetaTypes.NAME)
    public String name;

    public EventRef() {
    }

    public Set<String> getLabels() {
        return labels;
    }

    public String getCategory() {
        return category;
    }

    public String getEventRef() {
        return eventRef;
    }

    public void setEventRef(String eventRef) {
        this.eventRef = eventRef;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
