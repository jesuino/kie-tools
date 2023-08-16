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
import javax.inject.Named;

import elemental2.dom.DomGlobal;
import elemental2.dom.Element;
import elemental2.dom.HTMLDivElement;
import elemental2.dom.HTMLElement;
import elemental2.dom.HTMLInputElement;
import elemental2.dom.HTMLTableCellElement;
import elemental2.dom.HTMLTableElement;
import elemental2.dom.HTMLTableRowElement;
import org.dashbuilder.patternfly.pagination.Pagination;
import org.jboss.errai.common.client.dom.elemental2.Elemental2DomUtil;
import org.jboss.errai.ui.shared.api.annotations.DataField;
import org.jboss.errai.ui.shared.api.annotations.Templated;

@Dependent
@Templated
public class TableView implements Table.View {

    @Inject
    @DataField
    HTMLDivElement tableContainer;

    @Inject
    @DataField
    HTMLDivElement paginationContainer;

    @Inject
    @DataField
    HTMLTableElement table;

    @Inject
    @DataField
    @Named("h1")
    HTMLElement tblTitle;

    @Inject
    @DataField
    HTMLTableRowElement tblHeadRow;

    @Inject
    @DataField
    @Named("tbody")
    HTMLElement tblBody;

    @Inject
    @DataField
    HTMLInputElement searchInput;

    @Inject
    @DataField
    HTMLTableRowElement emptyRow;

    @Inject
    @DataField
    @Named("td")
    HTMLTableCellElement emptyCell;

    @Inject
    Pagination pagination;

    @Inject
    Elemental2DomUtil util;

    @Override
    public void init(Table presenter) {
        paginationContainer.appendChild(pagination.getElement());
        pagination.setOnPageChange(presenter::showPage);
        searchInput.onkeyup = e -> {
            presenter.onFilterChange(searchInput.value);
            return null;
        };
    }

    @Override
    public void setColumns(List<String> columns) {
        util.removeAllElementChildren(tblHeadRow);
        columns.stream().map(this::createHeaderCell).forEach(tblHeadRow::appendChild);
        emptyCell.colSpan = columns.size();
    }

    @Override
    public void setData(String[][] data) {
        util.removeAllElementChildren(tblBody);
        if (data.length == 0 || data[0] == null) {
            tblBody.appendChild(emptyRow);
        }
        
        for (int i = 0; i < data.length; i++) {
            var row = createBodyRow();
            for (int j = 0; data[i] != null && j < data[i].length; j++) {
                var cell = createTableCell(data[i][j]);
                row.appendChild(cell);
            }
            tblBody.appendChild(row);
        }

    }

    @Override
    public HTMLElement getElement() {
        return tableContainer;
    }

    @Override
    public void setTitle(String title) {
        tblTitle.textContent = title;
    }

    Element createHeaderCell(String header) {
        var th = DomGlobal.document.createElement("th");
        th.setAttribute("role", "columnheader");
        th.setAttribute("scope", "col");
        th.classList.add("pf-v5-c-table__th");
        th.textContent = header;
        return th;
    }

    Element createBodyRow() {
        var tr = DomGlobal.document.createElement("tr");
        tr.setAttribute("role", "row");
        tr.classList.add("pf-v5-c-table__tr");
        return tr;
    }

    Element createTableCell(String content) {
        var td = DomGlobal.document.createElement("td");
        td.classList.add("pf-v5-c-table__td");
        td.textContent = content;
        return td;
    }

    @Override
    public void setPagination(int nRows, int pageSize) {
        pagination.setPagination(nRows, pageSize);
    }

}
