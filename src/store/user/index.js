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
    activeProfile: null,
    defaultProfile: null,
    profileSettings: {
      editProfile: false,
      addProfile: false,
      avatarModal: false,
      confirmDelete: false
    },
    userError: null,
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
    setDefaultProfile(state, payload) {
      state.defaultProfile = payload;
    },
    setProfiles(state, payload) {
      state.profiles = payload;
    },
    setProfileSettings(state, payload) {
      let settings = _.cloneDeep(state.profileSettings);
      settings = _.merge(settings, payload);
      state.profileSettings = settings;
    },
    setError(state, payload) {
      state.userError = payload;
    }
  },
  actions: {
    setUserError ({ commit }, payload) {
      commit('setError', payload);
    },
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
                commit('setError', null);
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
        this.$router.push('/home');
      }
      commit('setAuth', true);
    },
    logout ({commit}) {
      AUTH.signOut();
      commit('setUser', null);
      commit('setAuth', true ); // Let the app know auth complete
      this.$router.push('/login');
    },

    forgottenPassword ({ commit}, payload) {
      console.log('paylod=', payload);
      return new Promise((resolve, reject) => {
        AUTH.sendPasswordResetEmail(payload, {url: top.location.href}).then(resp => {
          resolve(resp);
        },
        error => {
          reject(error);
        });
      });
    },

    setAccount ({commit, dispatch}, payload) {
      commit('setAccount', payload);
      dispatch('setProfiles');
      dispatch('setProfile');
    },

    setProfiles ({ commit, state }) {
      firebase
      .firestore()
      .collection('accounts/'+ state.user.id + '/profiles')
      .orderBy('nickName', 'asc')
      .onSnapshot(function(querySnapshot) {
        const profiles = [];
        querySnapshot.forEach(prof => {
          const newProfile = prof.data();
          newProfile.id = prof.id;
          /** Add profile to array */
          profiles.push(newProfile);
        });
        commit('setProfiles', profiles);
      });
    },

    setProfile({ commit, state}, profileId) {
      const profiles = firebase
      .firestore()
      .collection('accounts/'+ state.user.id + '/profiles');
      profiles.get().then(function(querySnapshot) {
        querySnapshot.forEach(prof => {
          const newProfile = prof.data();
          newProfile.id = prof.id;
          /** Set active profile */
          if (prof.data().default) {
            commit('setDefaultProfile', newProfile);
          }

          if (profileId && (prof.id === profileId)) {
            commit('setActiveProfile', newProfile);
          } else if (!profileId && prof.data().default) {
            commit('setActiveProfile', newProfile);
          }
        });
      });
    },

    updateProfile ({commit, state, dispatch}, payload) {
      return new Promise((resolve, reject) => {
        commit('setLoading', true);
        commit('clearError');
        let userProfiles = firebase
        .firestore()
        .collection('accounts/'+ state.user.id + '/profiles').doc(payload.id);
        userProfiles.set(payload, { merge: true })
          .then(() => {
            this.dispatch('setProfile', state.activeProfile.id)
            commit('setLoading', false);
            resolve();
          });
      });
    },

    addProfile({commit, state}, payload) {
      return new Promise((resolve, reject) => {
        commit('setLoading', true);
        commit('clearError');
        let userProfiles = firebase
        .firestore()
        .collection('accounts/'+ state.user.id + '/profiles');
        userProfiles.add(payload)
          .then(() => {
            commit('setLoading', false);
            resolve()
          });
      });
    },

    deleteProfile({commit, state}, payload) {
      return new Promise((resolve, reject) => {
        commit('setLoading', true);
        commit('clearError');
        let userProfiles = firebase
        .firestore()
        .collection('accounts/'+ state.user.id + '/profiles').doc(payload.id);
        userProfiles.delete()
          .then(() => {
            if (state.activeProfile.id === payload.id) {
              commit('setActiveProfile', state.defaultProfile);
            }
            commit('setLoading', false);
            resolve()
          });
      });
    },
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
      return state.account.admin && state.activeProfile && state.activeProfile.default;
    },
    getProfileSettings (state) {
      return state.profileSettings;
    },
    getProfileById: (state) => (id) => {
      let profile = null;
      if (state.profiles && state.profiles.length > 0)
      state.profiles.forEach(prof => {
        if (prof.id === id) {
          profile = prof;
        }
      });
      return profile;
    },
    getUserError (state) {
      return state.userError;
    }
  }
};
