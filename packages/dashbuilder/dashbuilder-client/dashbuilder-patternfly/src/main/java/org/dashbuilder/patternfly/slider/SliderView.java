package org.dashbuilder.patternfly.slider;

import javax.enterprise.context.Dependent;
import javax.inject.Inject;

import com.google.gwt.user.client.ui.Composite;
import org.jboss.errai.common.client.dom.elemental2.Elemental2DomUtil;
import org.jboss.errai.ui.shared.api.annotations.Templated;

@Dependent
@Templated
public class SliderView extends Composite implements Slider.View {

    private Slider presenter;

    
    @Inject
    Elemental2DomUtil util;

    @Override
    public void init(Slider presenter) {
        this.presenter = presenter;
    }

}
