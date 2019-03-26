import { AUTH } from '../plugins/firebase';
import { store } from '../store';

export default (to, from, next) => {
  authUser()
    .then(() => {
      if (store.getters.user) {
        next();
      } else {
        next('/login');
      }
    });
};

const authUser = () => {
  return new Promise((resolve, reject) => {
    AUTH.onAuthStateChanged((user) => {
      resolve(user);
    }, (error) => {
      console.log(error);
    });
  });
};
