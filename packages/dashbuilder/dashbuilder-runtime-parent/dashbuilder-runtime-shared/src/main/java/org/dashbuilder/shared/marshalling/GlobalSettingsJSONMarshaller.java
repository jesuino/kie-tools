/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
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
package org.dashbuilder.shared.marshalling;

import java.util.Optional;

import org.dashbuilder.displayer.DisplayerSettings;
import org.dashbuilder.displayer.Mode;
import org.dashbuilder.displayer.json.DisplayerSettingsJSONMarshaller;
import org.dashbuilder.json.Json;
import org.dashbuilder.json.JsonObject;
import org.dashbuilder.shared.model.GlobalSettings;

public class GlobalSettingsJSONMarshaller {

    private static final String MODE = "mode";
    private static final Mode DEFAULT_MODE = Mode.LIGHT;

    private static GlobalSettingsJSONMarshaller instance;

    static {
        instance = new GlobalSettingsJSONMarshaller();
    }

    public static GlobalSettingsJSONMarshaller get() {
        return instance;
    }

    public GlobalSettings fromJson(String json) {
        return fromJson(Json.parse(json));
    }

    public GlobalSettings fromJson(JsonObject json) {
        var globalSettings = new GlobalSettings();
        var mode = DEFAULT_MODE;
        var displayerSettings = new DisplayerSettings();
        
        if (json != null) {
            var modeStr = json.getString(MODE);
            var displayerSettingsObj = json.getObject(LayoutTemplateJSONMarshaller.SETTINGS);
            mode = Optional.ofNullable(Mode.getByName(modeStr)).orElse(DEFAULT_MODE);
            try {
                displayerSettings = DisplayerSettingsJSONMarshaller.get().fromJsonObject(displayerSettingsObj, false);
            } catch (Exception e) {
                // ignore settings and use a global empty settings
                displayerSettings = new DisplayerSettings();
            }
        }

        displayerSettings.setMode(mode);
        globalSettings.setSettings(displayerSettings);
        globalSettings.setMode(mode);
        return globalSettings;

    }

}
