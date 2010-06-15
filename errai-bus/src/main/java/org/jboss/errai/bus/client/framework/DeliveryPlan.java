/*
 * Copyright 2009 JBoss, a divison Red Hat, Inc
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

package org.jboss.errai.bus.client.framework;

import org.jboss.errai.bus.client.api.Message;
import org.jboss.errai.bus.client.api.MessageCallback;

public class DeliveryPlan {
    private final MessageCallback[] deliverTo;

    public DeliveryPlan() {
        deliverTo = new MessageCallback[0];
    }

    public DeliveryPlan(MessageCallback[] deliverTo) {
        this.deliverTo = deliverTo;
    }

    public void deliver(Message m) {
        for (MessageCallback callback : deliverTo) {
            callback.callback(m);
        }
    }

    public MessageCallback[] getDeliverTo() {
        MessageCallback[] newArray = new MessageCallback[deliverTo.length];
        for (int i = 0; i < deliverTo.length; i++) {
            newArray[i] = deliverTo[i];
        }
        return deliverTo;
    }

    public int getTotalReceivers() {
        return deliverTo.length;
    }

    public DeliveryPlan newDeliveryPlanWith(MessageCallback callback) {
        MessageCallback[] newPlan = new MessageCallback[deliverTo.length + 1];
        for (int i = 0; i < deliverTo.length; i++) {
            newPlan[i] = deliverTo[i];
        }
        newPlan[newPlan.length - 1] = callback;

        return new DeliveryPlan(newPlan);
    }
}
