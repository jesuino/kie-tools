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
package org.dashbuilder.dsl.serialization;

import java.io.InputStream;
import java.io.OutputStream;

import org.dashbuilder.dsl.model.Dashboard;

public interface DashboardSerializer {

    /**
     * Serialize the provided dashboard and write the result in the provided output stream
     * @param dashboard
     * @param os
     * @return
     */
    void serialize(Dashboard dashboard, OutputStream os);

    /**
     * Deserialize the incoming input stream into a Dashboard object
     * 
     * Support of components and files that aren't dashboard definition may not be supported.
     * @param model
     * @return
     */
    Dashboard deserialize(InputStream model);

}