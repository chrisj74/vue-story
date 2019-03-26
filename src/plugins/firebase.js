import firebase from 'firebase';
import auth from 'firebase/auth'; // not used but needed
import config from './env.json';

export const fireApp = firebase.initializeApp(config);

export const AUTH = fireApp.auth();

export default ({ Vue, store, router }) => {
  Vue.prototype.$auth = AUTH;

  AUTH.onAuthStateChanged(async user => {
    if (user) {
      const payload = {
        user: user,
        redirect: router.currentRoute.query
      };
      await store.dispatch('autoSignIn', payload );
      let userProfile = firebase.database().ref('profiles/' + user.uid);
      await userProfile.on('value', snapshot => {
        store.dispatch('setProfile', snapshot);
      });
    } else {
      await store.dispatch('setAuth', true ); // Let the app know auth complete
    }

  });

  router.beforeEach((to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
      // this route requires auth, check if logged in
      // if not, redirect to login page.
      if (store.getters.user) {
        next();
      } else {
        next({
          path: "/login",
          query: { redirect: to.fullPath }
        });
      }
    } else {
      next(); // make sure to always call next()!
    }
  });
};
