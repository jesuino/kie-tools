/*
 * Copyright 2023 Red Hat, Inc. and/or its affiliates.
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
package org.dashbuilder.patternfly.alert;

import javax.annotation.PostConstruct;
import javax.enterprise.context.Dependent;
import javax.inject.Inject;

import elemental2.dom.HTMLElement;
import org.uberfire.client.mvp.UberElemental;

@Dependent
public class Alert {

    @Inject
    View view;

    public interface View extends UberElemental<Alert> {

        public void setup(AlertType type, String content);
    }

    @PostConstruct
    public void init() {
        view.init(this);
    }

    public void setup(AlertType type, String content) {
        view.setup(type, content);
    }
    
    public HTMLElement getElement() {
        return view.getElement();
    }

}
