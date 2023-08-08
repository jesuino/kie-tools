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
package org.dashbuilder.patternfly.pagination;

import javax.enterprise.context.Dependent;
import javax.inject.Inject;
import javax.inject.Named;

import elemental2.dom.HTMLButtonElement;
import elemental2.dom.HTMLDivElement;
import elemental2.dom.HTMLElement;
import elemental2.dom.HTMLInputElement;
import org.jboss.errai.common.client.dom.elemental2.Elemental2DomUtil;
import org.jboss.errai.ui.shared.api.annotations.DataField;
import org.jboss.errai.ui.shared.api.annotations.Templated;

/**
 * The pagination view should keep the status of the current page accessed by user. 
 * It should receive the page information (page size and total items) and tell the called when a page is selected
 *
 */
@Dependent
@Templated
public class PaginationView implements Pagination.View {

    private Pagination presenter;
    
    @Inject
    @DataField
    HTMLDivElement paginationContainer;

    @Inject
    @DataField
    HTMLButtonElement btnFirstPage;

    @Inject
    @DataField
    HTMLButtonElement btnLastPage;

    @Inject
    @DataField
    HTMLButtonElement btnNextPage;

    @Inject
    @DataField
    HTMLButtonElement btnPreviousPage;

    @Inject
    @DataField
    @Named("b")
    HTMLElement lblTotal;

    @Inject
    @DataField
    @Named("span")
    HTMLElement lblOffsetBegin;

    @Inject
    @DataField
    @Named("span")
    HTMLElement lblOffsetEnd;
    
    @Inject
    @DataField
    @Named("span")
    HTMLElement lblTotalPages;

    @Inject
    @DataField
    HTMLInputElement txtSelectedPage;

    @Inject
    Elemental2DomUtil util;

    @Override
    public void init(Pagination presenter) {
        this.presenter = presenter;        
        txtSelectedPage.max = "1";
    }

    public void setPagination(int totalPages, 
                              int totalItems, 
                              int pageSize, 
                              int page) {
        var boundEnd = page * pageSize + pageSize;
        var boundBegin = page * pageSize;
        
        if (boundEnd > totalItems) {
            boundEnd = totalItems;
            btnNextPage.disabled = true;            
        } else {
            btnNextPage.disabled = false;
        }
        
        if (boundBegin > totalItems) {
            boundBegin = totalItems;
        }

        if (page == 1) {
            btnFirstPage.disabled = true;            
        } else {
            btnFirstPage.disabled = false;
        }
        
        btnPreviousPage.disabled = btnFirstPage.disabled;
        btnLastPage.disabled = btnNextPage.disabled;
        
        lblTotal.textContent = "" + totalItems;
        txtSelectedPage.value = "" + page;
        lblOffsetBegin.textContent = "" + boundBegin;
        lblOffsetEnd.textContent = "" + boundEnd;
        txtSelectedPage.max = "" + page;        
    }

    public void selectPage(int pageNumber) {
        presenter.selectPage(pageNumber);

    }

    @Override
    public HTMLElement getElement() {
        return null;
    }

}
