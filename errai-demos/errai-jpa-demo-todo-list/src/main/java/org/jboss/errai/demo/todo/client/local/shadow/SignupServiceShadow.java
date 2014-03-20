package org.jboss.errai.demo.todo.client.local.shadow;

import java.util.ArrayList;
import java.util.List;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.persistence.EntityManager;

import org.jboss.errai.bus.client.api.BusLifecycleAdapter;
import org.jboss.errai.bus.client.api.BusLifecycleEvent;
import org.jboss.errai.bus.client.api.ClientMessageBus;
import org.jboss.errai.bus.server.annotations.ShadowService;
import org.jboss.errai.common.client.api.Caller;
import org.jboss.errai.demo.todo.shared.RegistrationException;
import org.jboss.errai.demo.todo.shared.RegistrationResult;
import org.jboss.errai.demo.todo.shared.SignupService;
import org.jboss.errai.demo.todo.shared.User;
import org.jboss.errai.security.shared.api.identity.Role;

/**
 * ShadowService implementation of the SignupService this service will get invoked automatically when the bus
 * is disconnected. It registers a listener when the bus is back online and will then register the user
 * in the background.
 * @author edewit@redhat.com
 */
@ShadowService
public class SignupServiceShadow implements SignupService {
  @Inject
  private EntityManager entityManager;

  @Inject
  private ClientMessageBus bus;

  @Inject
  private Caller<SignupService> signupService;

  @PostConstruct
  private void init() {
    bus.addLifecycleListener(new BusLifecycleAdapter() {
      @Override
      public void busOnline(BusLifecycleEvent event) {
        final List<TempUser> tempUsers = entityManager.createNamedQuery("allTempUsers", TempUser.class).getResultList();
        for (TempUser tempUser : tempUsers) {
          try {
            signupService.call().register(tempUser.asUser(), tempUser.getPassword());
            entityManager.remove(tempUser);
          } catch (RegistrationException e) {
            //TODO maybe here we want to take the user back to the signup page?
            throw new RuntimeException(e);
          }
        }
      }
    });
  }

  @Override
  public RegistrationResult register(User newUserObject, String password) throws RegistrationException {
    entityManager.persist(new TempUser(newUserObject, password));

    final org.jboss.errai.security.shared.api.identity.User securityUser = new org.jboss.errai.security.shared.api.identity.User();
    securityUser.setLoginName(newUserObject.getLoginName());
    securityUser.setFullName(newUserObject.getLoginName());
    securityUser.setShortName(newUserObject.getShortName());
    securityUser.setEmail(newUserObject.getEmail());
    securityUser.setRoles(new ArrayList<Role>(0));
    
    return new RegistrationResult(newUserObject, securityUser);
  }
}
