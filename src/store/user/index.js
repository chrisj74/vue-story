import { AUTH } from '../../plugins/firebase';
import * as firebase from 'firebase';

export default {
  state: {
    user: null,
    account: {
      admin: false,
    },
    authSet: false,
    profiles: null,
    activeProfile: null
  },
  mutations: {
    setUser (state, payload) {
      state.user = payload;
    },
    setAccount (state, payload) {
      state.account = payload;
    },
    setAuth (state, payload) {
      state.authSet = payload;
    },
    setActiveProfile(state, payload) {
      state.activeProfile = payload;
    },
    setProfiles(state, payload) {
      state.profiles = payload;
    }
  },
  actions: {
    setAuth ({ commit }, payload) {
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
      this.$router.push('/');
    },

    setAccount ({commit, dispatch}, payload) {
      commit('setAccount', payload);
      dispatch('setProfile')
    },

    setProfile({ commit, state}, profileId) {
      const profiles = firebase
      .firestore()
      .collection('accounts/'+ state.user.id + '/profiles');
      profiles.get().then(function(querySnapshot) {
        const profiles = [];
        querySnapshot.forEach(prof => {
          const newProfile = prof.data();
          newProfile.id = prof.id;
          /** Add profile to array */
          profiles.push(newProfile);
          /** Set active profile */
          if (profileId && (prof.id === profileId)) {
            commit('setActiveProfile', newProfile);
          } else if (!profileId && prof.data().default) {
            commit('setActiveProfile', newProfile);
          }
        });
        commit('setProfiles', profiles);
      });
    },

    updateProfile ({commit, state}, payload) {
      delete payload['admin'];
      commit('setLoading', true);
      commit('clearError');
      let userProfiles = firebase
      .firestore()
      .collection('accounts/'+ state.user.id + '/profiles').doc(payload.profileId);
      userProfiles.set(payload, { merge: true })
        .then(() => {
          commit('setLoading', false);
        });
    }
  },
  getters: {
    user (state) {
      return state.user;
    },
    profile (state) {
      return state.activeProfile;
    },
    profiles (state) {
      return state.profiles;
    },
    setAuth (state) {
      return state.authSet;
    },
    isAdmin (state) {
      return state.account.admin;
    }
  }
};
