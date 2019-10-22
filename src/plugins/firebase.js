import firebase from 'firebase';
import auth from 'firebase/auth'; // not used but needed
import config from './env.json';

export const fireApp = firebase.initializeApp(config);

export const AUTH = fireApp.auth();

export default ({ Vue, store, router }) => {
  Vue.prototype.$auth = AUTH;

  AUTH.onAuthStateChanged(async user => {
    if (user) {
      /* Set user */
      const userObj = {
        lastUpdated: new Date(),
        lastLoggedIn: new Date()
      };
      const payload = {
        user: user,
        redirect: router.currentRoute.query
      };
      let userDoc = firebase
        .firestore()
        .collection("users/").doc(user.uid);
      await userDoc.get()
        .then(async (docSnapshot) => {
          if (docSnapshot.exists) {
            await userDoc.update(userObj);
          } else {
            userObj.images = [];
            await userDoc.set(userObj);
          }
          await store.dispatch('autoSignIn', payload );
        });

      store.dispatch('setProjects');


      /* Set account */
      let userAccount = firebase
      .firestore()
      .collection('accounts/').doc(user.uid);
      userAccount.get()
        .then((docSnapshot) => {
          if (docSnapshot.exists) {
            userAccount.onSnapshot((doc) => {
              store.dispatch('setAccount', doc.data()).then(() => {
                store.dispatch('setProfile', null);
              });
            });
          } else {
            /** Create account and default profile */
            const newAcc = {
              admin: false,
            };
            userAccount.set(newAcc)
              store.dispatch('setAccount', newAcc);
              userAccount
                .collection('/profiles').add({
                  nickName: user.displayName ? user.displayName : '?',
                  default: true,
                  age: null,
                  profilePic: user.photoURL,
                  email: user.email,
                })
                .then(function(profileRef) {
                  store.dispatch('setProfile', null);
                })
                .catch(function(error) {
                  console.error("Error adding account: ", error);
              });
          }
        })
    } else {
      await store.dispatch('setAuth', true ); // Let the app know auth complete
    }

  });
};
