/*
 * Copyright 2011 JBoss, a divison Red Hat, Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.jboss.errai.ioc.rebind.ioc.codegen.builder.callstack;

import org.jboss.errai.ioc.rebind.ioc.codegen.*;
import org.jboss.errai.ioc.rebind.ioc.codegen.builder.impl.AssignmentBuilder;
import org.jboss.errai.ioc.rebind.ioc.codegen.util.GenUtil;

/**
 * @author Christian Sadilek <csadilek@redhat.com>
 */
public class AssignVariable extends AbstractCallElement {
  private AssignmentOperator operator;
  private Object value;
  private Object[] indexes;

  public AssignVariable(AssignmentOperator operator, Object value, Object... indexes) {
    this.operator = operator;
    this.value = value;
    this.indexes = indexes;
  }

  public void handleCall(CallWriter writer, Context context, Statement statement) {
    Statement[] indexes = new Statement[this.indexes.length];
    for (int i = 0; i < indexes.length; i++) {
      indexes[i] = GenUtil.generate(context, this.indexes[i]);
      indexes[i] = GenUtil.convert(context, indexes[i], MetaClassFactory.get(Integer.class));
    }

    writer.reset();
    Statement s = new AssignmentBuilder(operator, (VariableReference) statement, GenUtil.generate(context, value), indexes);
    nextOrReturn(writer, context, s);
  }
}
