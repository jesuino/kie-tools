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
package org.kie.workbench.common.stunner.sw.client.shapes;

import com.ait.lienzo.client.core.event.NodeMouseEnterHandler;
import com.ait.lienzo.client.core.event.NodeMouseExitHandler;
import org.kie.workbench.common.stunner.core.client.shape.ShapeState;
import org.kie.workbench.common.stunner.core.client.shape.impl.AbstractShape;
import org.kie.workbench.common.stunner.core.client.shape.impl.NodeShapeImpl;
import org.kie.workbench.common.stunner.core.client.shape.impl.ShapeStateHandler;
import org.kie.workbench.common.stunner.sw.definition.State;

public abstract class ServerlessWorkflowShape<V extends ServerlessWorkflowShapeView> extends NodeShapeImpl<State, V> {

    public ServerlessWorkflowShape(final AbstractShape shape) {
        super(shape);
    }

    public NodeMouseExitHandler getExitHandler() {
        return event -> {
            if (getShapeStateHandler().getShapeState() == ShapeState.SELECTED) {
                return;
            }
            getShapeStateHandler().applyState(ShapeState.NONE);
            getShapeView().getShape().getLayer().batch();
        };
    }

    public NodeMouseEnterHandler getEnterHandler() {
        return event -> {
            if (getShapeStateHandler().getShapeState() == ShapeState.SELECTED) {
                return;
            }
            getShapeStateHandler().applyState(ShapeState.HIGHLIGHT);
            getShapeView().getShape().getLayer().batch();
        };
    }

    protected ShapeStateHandler getShapeStateHandler() {
        return getShapeView().getShapeStateHandler();
    }
}
