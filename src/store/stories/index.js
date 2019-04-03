import * as firebase from "firebase";
import * as _ from "lodash";
import * as axios from 'axios';

export default {
  state: {
    stories: [

    ],
    story: {},
    pages: [],
    page: {},
    imageSearchResults: {
      page: 0,
      totalHits: 0,
      hits: [],
    },
    searchSize: 50,
    insertImage: null,
  },
  mutations: {
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
      state.imageSearchResults.totalHits = 0;
      state.imageSearchResults.hits = [];
      state.imageSearchResults.page = 0;
    },
    clearImageSearchResults(state) {
      state.imageSearchResults.totalHits = payload.data.totalHits;
      state.imageSearchResults.hits = state.imageSearchResults.hits.concat(payload.data.hits);
      state.imageSearchResults.page += 1;
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
        let newId = null;
        const newOrder = payload.order;
        const userStory = firebase
          .firestore()
          .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages/');
          userStory.add({
            pageJson: {},
            order: newOrder,
          }).then(function(docRef) {
            newId = docRef.id;
            resolve(newId);
          });
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

    setStories({ commit, dispatch }, payload) {
      return new Promise((resolve, reject) => {
        firebase
            .firestore()
            .collection('users/' + payload + '/stories/')
            .onSnapshot(function(querySnapshot) {
              const stories = [];
              querySnapshot.forEach(function(doc) {
                stories.push({
                  id: doc.id,
                  title: doc.data().title,
                  thumbs: doc.data().thumbs,
                });

              });
              commit('setStories', stories);
          });
        resolve();
      });
    },

    setStory({ commit }, payload) {
      return new Promise((resolve, reject) => {
        firebase
          .firestore()
          .collection('users/' + payload.user.id + '/stories/').doc(payload.storyKey)
          .onSnapshot(function(querySnapshot) {
            commit('setStory', querySnapshot.data());
        });
        resolve();
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
                order: doc.data().order,
                thumb: doc.data().thumb
              });

          });
          commit('setPages', pages);
        });
    },

    setPage({ commit }, payload) {
      firebase
        .firestore()
        .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages').orderBy('order', 'asc')
        .onSnapshot(function(querySnapshot) {
          let page;
          if (payload.pageKey) {
            querySnapshot.docs.forEach(doc => {
              if (doc.id === payload.pageKey)
                page = {
                  pageJson: doc.data().pageJson,
                  id: doc.id,
                  thumb: doc.data().thumb,
                };
            });
          } else {
            page = {
              pageJson : querySnapshot.docs[0].data().pageJson,
              id: querySnapshot.docs[0].id,
              thumb: querySnapshot.docs[0].data().thumb,
            };
          }
          commit('setPage', page);
      });
    },

    setThumb({ commit, dispatch }, payload) {
      return new Promise((resolve, reject) => {
        const ref = firebase.storage().ref();
        const path = 'images/' + payload.user.id + '/thumbs/' + payload.storyKey + '/' + payload.pageKey;
        const metadata = {
          contentType: payload.image.type
        };
        const task = ref.child(path).put(payload.image.dataUrl, metadata);
        task
          .then(snapshot => snapshot.ref.getDownloadURL())
          .then((url) => {
            // commit('setInsertImage', imgObj);
            resolve(url);
            const newPayload = payload;
            newPayload.thumbUrl = url;
            dispatch('updateThumbData', newPayload);
            // Also update the story with the thumb ref
            /* const userStory = firebase
              .firestore()
              .collection('users/' + payload.user.id + '/stories/').doc(payload.storyKey);
              userStory.get().then(doc => {
                if(!doc.data().) {
                  console.log('thumb missing');
                  userStory.update({
                    thumb: payloadRef.thumbUrl
                  });
                }
              }); */
          })
          .catch(console.error);

      });
    },

    updateThumbData({ commit }, payload) {
      const payloadRef = payload;
      const userStory = firebase
        .firestore()
        .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages/').doc(payload.pageKey);
        userStory.get().then(doc => {
          if(!doc.data().thumb) {
            console.log('thumb missing');
            userStory.update({
              thumb: payloadRef.thumbUrl
            });
          }
        });


    },

    addImage({ commit }, payload) {
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
          commit('setInsertImage', imgObj);
        })
        .catch(console.error);
    },

    searchImages({ commit, state }, payload) {
      const pageStr = '&page=' + (state.imageSearchResults.page +1);
      let path = 'https://pixabay.com/api/?key=11945260-36d09543fa5ee7da289366856&image_type=all&per_page='
      path += state.searchSize + '&safesearch=true&q=';
      const query = encodeURIComponent(payload.str);
      const fullPath = path + query + pageStr;
      axios.get(fullPath)
      .then((response) => {
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
