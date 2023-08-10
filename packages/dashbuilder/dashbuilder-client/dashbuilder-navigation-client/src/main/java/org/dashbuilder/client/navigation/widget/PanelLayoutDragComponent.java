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

package org.dashbuilder.client.navigation.widget;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;

import com.google.gwt.user.client.ui.IsWidget;
import elemental2.dom.HTMLElement;
import jsinterop.base.Js;
import org.dashbuilder.client.navigation.plugin.PerspectivePluginManager;
import org.dashbuilder.patternfly.alert.Alert;
import org.dashbuilder.patternfly.alert.AlertType;
import org.dashbuilder.patternfly.panel.Panel;
import org.jboss.errai.common.client.dom.elemental2.Elemental2DomUtil;
import org.jboss.errai.common.client.ui.ElementWrapperWidget;
import org.uberfire.ext.layout.editor.client.api.LayoutDragComponent;
import org.uberfire.ext.layout.editor.client.api.RenderingContext;

@ApplicationScoped
public class PanelLayoutDragComponent implements LayoutDragComponent {

    @Inject
    Panel panel;

    @Inject
    Alert alert;

    Elemental2DomUtil domUtil;

    public static final String PAGE_NAME_PARAMETER = "Page Name";
    PerspectivePluginManager perspectivePluginManager;

    @Inject
    public PanelLayoutDragComponent(PerspectivePluginManager perspectivePluginManager) {
        this.perspectivePluginManager = perspectivePluginManager;
    }

    @Override
    public IsWidget getShowWidget(RenderingContext ctx) {
        var perspectiveId = ctx.getComponent().getProperties().get(PAGE_NAME_PARAMETER);
        if (perspectiveId == null) {
            panel.setTitle(perspectiveId + "  not found.");
            panel.setContent(alert("Page '" + perspectiveId + "' not found."));
        } else {
            panel.setTitle(perspectiveId);
            perspectivePluginManager.buildPerspectiveWidget(perspectiveId,
                    page -> panel.setContent(Js.cast(page.asWidget().getElement())),
                    issue -> panel.setContent(alert("Error with infinite recursion. Review the embedded page")));
        }

        return ElementWrapperWidget.getWidget(panel.getElement());
    }

    public HTMLElement alert(String message) {
        alert.setup(AlertType.WARNING, message);
        return alert.getElement();
    }

}
