/*
 * Copyright 2015 JBoss, by Red Hat, Inc
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

package org.uberfire.ext.plugin.client.perspective.editor.layout.editor;

import javax.enterprise.context.Dependent;

import elemental2.dom.DomGlobal;
import elemental2.dom.HTMLDivElement;
import elemental2.dom.HTMLElement;
import org.uberfire.ext.layout.editor.client.api.LayoutDragComponent;
import org.uberfire.ext.layout.editor.client.api.RenderingContext;

@Dependent
public class HTMLLayoutDragComponent implements LayoutDragComponent {

    public static final String HTML_CODE_PARAMETER = "HTML_CODE";

    @Override
    public HTMLElement getShowWidget(RenderingContext context) {
        var parent = (HTMLDivElement) DomGlobal.document.createElement("div");
        var properties = context.getComponent().getProperties();
        var html = properties.get(HTMLLayoutDragComponent.HTML_CODE_PARAMETER);
        if (html == null) {
            return null;
        }
        // TODO: sanitize HTML
        parent.innerHTML = html;
        return parent;
    }

}
