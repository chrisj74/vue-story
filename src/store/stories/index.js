import * as firebase from "firebase";
import * as _ from "lodash";
import * as axios from 'axios';

export default {
  state: {
    stories: [

    ],
    story: {},
    pages: [],
    page: null,
    imageSearchResults: null,
    insertImage: null,
  },
  mutations: {
    // clearError (state) {
    //   state.error = null;
    // }
    addStory(state, payload) {
      const newStory = payload;
      state.stories.push(newStory);
    },
    setStories(state, payload) {
      state.stories = payload;
    },
    setStory(state, payload) {
      state.story = payload;
    },
    setPages(state, payload) {
      state.pages = payload;
    },
    setPage (state, payload) {
      state.page = payload;
    },
    setImageSearchResults(state, payload) {
      state.imageSearchResults = payload;
    },
    setInsertImage(state,payload) {
      state.insertImage = payload;
    },
    clearInsertImage(state) {
      state.insertImage = null;
    },
  },
  actions: {
    addStory({ commit }, payload) {
      return new Promise((resolve, reject) => {
        const userStories = firebase
          .firestore()
          .collection("users/").doc(payload.user.id);

        userStories.set({
          lastUpdated: new Date(),
        });

        userStories
          .collection('stories').add(payload.newStory)
          .then(function(docRef) {
              docRef
                .collection('pages').add({
                  order: 0,
                  pageJson: '{}',
                });

          })
          .catch(function(error) {
              console.error("Error adding document: ", error);
          });
          resolve();
      });
    },

    updatePage( {commit }, payload) {
      return new Promise((resolve, reject) => {
        /* var updates = {};
        updates["/stories/" + payload.storyKey] = payload.story;
        updates["/user-stories/" + payload.user.id + "/" + payload.storyKey] = payload.story;

        firebase
          .database()
          .ref()
          .update(updates); */
        const userStory = firebase
          .firestore()
          .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages/').doc(payload.pageKey);
          userStory.update({
            pageJson: payload.page.json
          });
        resolve();
      });
    },
    addPage( {commit }, payload) {
      return new Promise((resolve, reject) => {
        /* var updates = {};
        updates["/stories/" + payload.storyKey] = payload.story;
        updates["/user-stories/" + payload.user.id + "/" + payload.storyKey] = payload.story;

        firebase
          .database()
          .ref()
          .update(updates); */
        let newId = null;
        const userStory = firebase
          .firestore()
          .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages/');
          userStory.add({
            pageJson: payload.page
          }).then(function(docRef) {
            newId = docRef.id;
          });
        resolve(newId);
      });
    },
    deleteStory( {commit }, payload) {
      return new Promise((resolve, reject) => {
        const storyPages = firebase
        .firestore()
        .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages/');
        storyPages.get().then(function(querySnapshot) {
          querySnapshot.forEach(val => {
            val.ref.delete();
          });
        });
        const story = firebase
        .firestore()
        .collection('users/' + payload.user.id + '/stories/').doc(payload.storyKey);
        story.delete();
        resolve();
      });
    },

    setStories({ commit }, payload) {
      /* const stories = firebase.database().ref('user-stories/' + payload);
      stories.on('value', function(snapshot) {
        commit('setStories', snapshot.val());
      }); */
      console.log('setstories payload:', payload);
      firebase
          .firestore()
          .collection('users/' + payload + '/stories/')
          .onSnapshot(function(querySnapshot) {
            const stories = [];
            querySnapshot.forEach(function(doc) {
                stories.push({
                  id: doc.id,
                  title: doc.data().title
                });

            });
            console.log('stories=',stories);
            commit('setStories', stories);

        });
    },
    setStory({ commit }, payload) {
      firebase
        .firestore()
        .collection('users/' + payload.user.id + '/stories/').doc(payload.storyKey)
        .onSnapshot(function(querySnapshot) {
          commit('setStory', querySnapshot.data());
      });
    },
    setPages({ commit}, payload) {
      firebase
        .firestore()
        .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages').orderBy('order', 'asc')
        .onSnapshot(function(querySnapshot) {
          const pages = [];
          querySnapshot.forEach(function(doc) {
              pages.push({
                id: doc.id,
                order: doc.data().order
              });

          });
          console.log('pages=',pages);
          commit('setPages', pages);
        });
    },
    setPage({ commit }, payload) {
      firebase
        .firestore()
        .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages').orderBy('order', 'asc')
        .onSnapshot(function(querySnapshot) {
          console.log('querySnapshot=', querySnapshot);
          let page;
          console.log('pageKey=', payload.pageKey);
          if (payload.pageKey) {
            page = {
              pageJson: querySnapshot.docs[payload.pageKey].data().pageJson,
              id: querySnapshot.docs[payload].id
            };
          } else {
            page = {
              pageJson : querySnapshot.docs[0].data().pageJson,
              id: querySnapshot.docs[0].id
            };
          }
          console.log('page=',page);
          commit('setPage', page);
      });
    },

    addImage({ commit }, payload) {
      console.log('payload=', payload);
      const ref = firebase.storage().ref();
      const path = 'images/' + payload.user.id + '/' + (+new Date()) + '-' + payload.image.name;
      const metadata = {
        contentType: payload.image.type
      };
      const task = ref.child(path).put(payload.image.dataUrl, metadata);
      task
        .then(snapshot => snapshot.ref.getDownloadURL())
        .then((url) => {
          const imgObj = {
            webformatURL: url,
            webformatWidth: payload.image.dimensions.w,
            webformatHeight: payload.image.dimensions.h,
          };
          console.log('actoion imgObj=', imgObj);
          commit('setInsertImage', imgObj);
        })
        .catch(console.error);
    },

    searchImages({ commit }, payload) {
      console.log('payload=', payload);
      const path = 'https://pixabay.com/api/?key=11945260-36d09543fa5ee7da289366856&image_type=photo&safesearch=true&q=';
      const query = encodeURIComponent(payload);
      const fullPath = path + query;
      axios.get(fullPath)
      .then((response) => {
        console.log('response=', response);
        commit('setImageSearchResults', response);
      })
      .catch(() => {
        this.$q.notify({
          color: 'negative',
          position: 'top',
          message: 'Loading failed',
          icon: 'report_problem'
        });
      });
    },
  },
  getters: {
    getStories(state) {
      return state.stories;
    },
    getStory(state) {
      return state.story;
    },
    getPages(state) {
      return state.pages;
    },
    getPage(state) {
      return state.page;
    },
    getImageSearchResults(state) {
      return state.imageSearchResults;
    },
    getInsertImage(state) {
      return state.insertImage;
    }
  }
};
