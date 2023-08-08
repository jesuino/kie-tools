/*
 * Copyright 2023 Red Hat, Inc. and/or its affiliates.
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
package org.dashbuilder.patternfly.table;

import java.util.List;

import javax.enterprise.context.Dependent;
import javax.inject.Inject;

import elemental2.dom.HTMLElement;
import org.uberfire.client.mvp.UberElemental;

@Dependent
public class Table {

    @Inject
    View view;

    public interface View extends UberElemental<Table> {

        void setTitle(String title);

        void setData(List<String> columns, String[][] data);

    }

    public HTMLElement getElement() {
        return view.getElement();
    }

    public void setTitle(String title) {
        view.setTitle(title);
    }
    
    public void setData(List<String> columns,
                           String[][] data,
                           int nRows,
                           int pageSize) {
        view.setData(columns, data);
    }

}