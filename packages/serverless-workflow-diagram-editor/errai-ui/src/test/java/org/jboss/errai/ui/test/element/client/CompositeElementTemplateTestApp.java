/*
 * Copyright (C) 2015 Red Hat, Inc. and/or its affiliates.
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

package org.jboss.errai.ui.test.element.client;

import javax.annotation.PostConstruct;
import javax.enterprise.context.Dependent;
import javax.inject.Inject;

import com.google.gwt.user.client.ui.RootPanel;
import org.jboss.errai.ui.test.element.client.res.CompositeElementFormComponent;
import org.jboss.errai.ui.test.element.client.res.ElementFormComponent;

@Dependent
public class CompositeElementTemplateTestApp implements ElementTemplateTestApp {

  @Inject
  private RootPanel root;

  @Inject
  private CompositeElementFormComponent form;

  @PostConstruct
  public void setup() {
    root.add(form);
    System.out.println(root.getElement().getInnerHTML());
  }

  @Override
  public ElementFormComponent getForm() {
    return form;
  }
}
