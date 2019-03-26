import { AUTH } from '../../plugins/firebase';
import * as firebase from 'firebase';

export default {
  state: {
    user: null,
    profile: null,
    authSet: false
  },
  mutations: {
    setUser (state, payload) {
      state.user = payload;
    },
    setProfile (state, payload) {
      state.profile = payload;
    },
    setAuth (state, payload) {
      state.authSet = payload;
    }
  },
  actions: {
    setAuth ({ commit }, payload) {
      console.log('setAuth', payload);
      commit('setAuth', payload);
    },
    setUserNull ({commit}) {
        commit('setUser', null);
    },
    signUserUp ({commit}, payload) {
      commit('setLoading', true);
      commit('clearError');
      AUTH.createUserWithEmailAndPassword(payload.email, payload.password)
        .then(
          user => {
            commit('setLoading', false);
            const newUser = {
              id: user.uid,
              name: user.displayName,
              email: user.email,
              photoUrl: user.photoURL
            }
            commit('setUser', newUser);
          }
        )
        .catch(
          error => {
            commit('setLoading', false);
            commit('setError', error);
            console.log(error);
          }
        );
    },
    signUserIn ({commit}, payload) {
      commit('setLoading', true);
      commit('clearError');
      AUTH.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
          AUTH.signInWithEmailAndPassword(payload.email, payload.password)
            .then(
              data => {
                commit('setLoading', false);
                const newUser = {
                  id: data.user.uid,
                  name: data.user.displayName,
                  email: data.user.email,
                  photoUrl: data.user.photoURL
                };
                commit('setUser', newUser);

                if (payload.redirect.hasOwnProperty('redirect')) {
                  this.$router.push(payload.redirect.redirect);
                } else {
                  this.$router.push('/');
                }
                commit('setAuth', true);
              }
            )
            .catch(
              error => {
                commit('setLoading', false);
                commit('setError', error);
                console.log(error);
              }
            );
        });
    },
    signUserInGoogle ({commit}) {
      commit('setLoading', true);
      commit('clearError');
      AUTH.signInWithPopup(new firebase.auth.GoogleAuthProvider())
        .then(
          user => {
            commit('setLoading', false);
            const newUser = {
              id: user.uid,
              name: user.displayName,
              email: user.email,
              photoUrl: user.photoURL
            };
            commit('setUser', newUser);
          }
        )
        .catch(
          error => {
            commit('setLoading', false);
            commit('setError', error);
            console.log(error);
          }
        );
    },
    signUserInFacebook ({commit}) {
      commit('setLoading', true);
      commit('clearError');
      AUTH.signInWithPopup(new firebase.auth.FacebookAuthProvider())
        .then(
          user => {
            commit('setLoading', false);
            const newUser = {
              id: user.uid,
              name: user.displayName,
              email: user.email,
              photoUrl: user.photoURL
            };
            commit('setUser', newUser);
          }
        )
        .catch(
          error => {
            commit('setLoading', false);
            commit('setError', error);
            console.log(error);
          }
        );
    },
    signUserInGithub ({commit}) {
      commit('setLoading', true);
      commit('clearError');
      AUTH.signInWithPopup(new firebase.auth.GithubAuthProvider())
        .then(
          user => {
            commit('setLoading', false);
            const newUser = {
              id: user.uid,
              name: user.displayName,
              email: user.email,
              photoUrl: user.photoURL
            };
            commit('setUser', newUser);
          }
        )
        .catch(
          error => {
            commit('setLoading', false);
            commit('setError', error);
            console.log(error);
          }
        );
    },
    signUserInTwitter ({commit}) {
      commit('setLoading', true);
      commit('clearError');
      AUTH.signInWithPopup(new firebase.auth.TwitterAuthProvider())
        .then(
          user => {
            commit('setLoading', false);
            const newUser = {
              id: user.uid,
              name: user.displayName,
              email: user.email,
              photoUrl: user.photoURL
            };
            commit('setUser', newUser);
          }
        )
        .catch(
          error => {
            commit('setLoading', false);
            commit('setError', error);
            console.log(error);
          }
        );
    },
    autoSignIn ({commit}, payload) {
      console.log('auto signin, payload=', payload);
      commit('setUser', {
        id: payload.user.uid,
        name: payload.user.displayName,
        email: payload.user.email,
        photoUrl: payload.user.photoURL
      });
      if (payload.redirect.hasOwnProperty('redirect')) {
        this.$router.push(payload.redirect.redirect);
      } else {
        this.$router.push('/');
      }
      commit('setAuth', true);
    },
    logout ({commit}) {
      AUTH.signOut();
      commit('setUser', null);
    },
    setProfile ({commit}, payload) {
      if (payload.val()) {
        console.log('setProfile', payload.val());
        const newProfile = {
          age: payload.val().age
        };
        commit('setProfile', newProfile);
      }
    },
    updateProfile ({commit}, payload) {
      commit('setLoading', true);
      commit('clearError');
      firebase.database().ref('profiles/' + payload.user.id).set(payload.profile)
        .then(
          () => {
            commit('setLoading', false);
            const newProfile = {
              age: payload.profile.age
            };
            commit('setProfile', newProfile);
          }
        )
        .catch(
          error => {
            commit('setLoading', false);
            commit('setError', error);
            console.log(error);
          }
        );
    }
  },
  getters: {
    user (state) {
      console.log('user getter', state.user);
      return state.user;
    },
    profile (state) {
      return state.profile;
    },
    setAuth (state) {
      return state.authSet;
    }
  }
};
