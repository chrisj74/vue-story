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
    pageDimensions: null,
    imageSearchResults: {
      str: '',
      page: 0,
      totalHits: 0,
      hits: [],
    },
    searchSize: 50,
    insertImage: null,
    pdfImages: null,
    modes: {
      mode: 'page',
      subMode: 'text',
    },
    history: {
      undo: false,
      redo: false,
      restoreIndex: -1,
      states: []
    },
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
    clearImageSearchResults(state) {
      state.imageSearchResults.str = '';
      state.imageSearchResults.totalHits = 0;
      state.imageSearchResults.hits = [];
      state.imageSearchResults.page = 0;
    },
    setImageSearchResults(state, payload) {
      state.imageSearchResults.str = payload.str;
      state.imageSearchResults.totalHits = payload.response.data.totalHits;
      state.imageSearchResults.hits = state.imageSearchResults.hits.concat(payload.response.data.hits);
      state.imageSearchResults.page += 1;
    },
    setInsertImage(state,payload) {
      state.insertImage = payload;
    },
    clearInsertImage(state) {
      state.insertImage = null;
    },
    setPdfImages(state, payload) {
      state.pdfImages = payload;
    },
    setMode(state, payload) {
      state.modes.mode = payload;
    },
    setSubMode(state, payload) {
      state.modes.subMode = payload;
    },
    setHistoryAddStates(state, payload) {
      console.log('setHistoryStates payload=', payload);
      state.history.states.push(payload);
    },
    setHistoryStates(state, payload) {
      state.history.states = payload;
    },
    setHistorySliceStates(state, payload) {
      console.log('historySlice state=', state.history);
      state.history.states = state.history.states.slice(0, state.history.restoreIndex + 1);
      state.history.states.push(payload);
    },
    setHistoryRestoreIndex(state, payload) {
      console.log('setHistoryRestoreIndex payload=', payload);
      state.history.restoreIndex = payload;
    },
    setHistoryUndo(state, payload){
      state.history.undo = payload;
    },
    setHistoryRedo(state, payload){
      state.history.redo = payload;
    },
    setPageDimensions(state, payload) {
      state.pageDimensions = payload;
    }
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
                  canvasJson: '{}',
                  textLayer: {
                    text: '',
                    x: 50,
                    y: 25,
                    width: (595 - 100),
                    height: (842 - 100)
                  },
                  background: {
                    color: '#ffffff',
                    image: false,
                  },
                  pageSize: {
                    width: 595,
                    height: 842,
                  }
                });
          })
          .catch(function(error) {
              console.error("Error adding document: ", error);
          });
          resolve();
      });
    },

    updateStory({ commit }, payload) {
      // console.log('updateStory');
      const payloadRef = payload;
      const userStory = firebase
      .firestore()
      .collection('users/' + payload.user.id + '/stories/').doc(payload.storyKey);
      // console.log('payloadRef=', payloadRef);
      if (payloadRef.thumbUrl) {
        userStory.update({
          thumb: payloadRef.thumbUrl
        });
      }
      if (payloadRef.plan) {
        userStory.update({
          plan: payloadRef.plan
        });
      }
    },

    updatePageOrder({ commit }, payload) {
      return new Promise((resolve, reject) => {
        const userStory = firebase
          .firestore()
          .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages/');
        let index = 0;
        payload.pages.forEach(page => {
          userStory.doc(page.id)
          .update({
            order: index
          });
          // console.log('page.id=', page.id);
          index++;
        });
        resolve();
      });
    },

    updatePage( {commit }, payload) {
      // console.log('updatePage payload =', payload);
      return new Promise((resolve, reject) => {
        const userStory = firebase
          .firestore()
          .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages/').doc(payload.pageKey);
          if (payload.page.json) {
            userStory.update({
              canvasJson: payload.page.json,
            });
          }
          if (payload.page.background){
            userStory.update({
              background: payload.page.background
            });
          }
        resolve();
      });
    },


    updatePageText( {commit }, payload) {
      // console.log('updatePage payload =', payload);
      return new Promise((resolve, reject) => {
        const userStory = firebase
          .firestore()
          .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages/').doc(payload.pageKey);
          userStory.update({
            textLayer: {
              y: payload.textLayer.y,
              x: payload.textLayer.x,
              width: payload.textLayer.width,
              height: payload.textLayer.height,
              text: payload.textLayer.text
            }
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
            canvasJson: null,
            textLayer: {
              text: '',
              x: 50,
              y: 25,
              width: (595 - 100),
              height: (842 -100)
            },
            background: {
              color: '#ffffff',
              image: false,
            },
            order: newOrder,
            pageSize: {
              width: 595,
              height: 842,
            }
          }).then(function(docRef) {
            newId = docRef.id;
            resolve(newId);
          });
      });
    },

    deletePage( { commit }, payload) {
      const payloadRef = payload;
      return new Promise((resolve, reject) => {
        const userStory = firebase
          .firestore()
          .collection('users/' + payloadRef.user.id + '/stories/' + payloadRef.storyKey + '/pages/');
          userStory.orderBy('order', 'asc')
          .onSnapshot(function(querySnapshot) {
            let index = 0;
            querySnapshot.forEach(function(doc) {
              if (doc.id === payloadRef.pageKey) {
                userStory.doc(doc.id).delete();
              } else {
                userStory.doc(doc.id).update({
                  order: index
                });
                index++;
              }
            });

          });
        resolve();
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
                  thumb: doc.data().thumb,
                  preview: doc.data().preview
                });

              });
              commit('setStories', stories);
          });
        resolve();
      });
    },

    setStory({ commit }, payload) {
      // console.log('setstory');
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
      // console.log('setpages payload=', payload);
      firebase
        .firestore()
        .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages').orderBy('order', 'asc')
        .onSnapshot(function(querySnapshot) {
          const pages = [];
          querySnapshot.forEach(function(doc) {
              pages.push({
                id: doc.id,
                order: doc.data().order,
                thumb: doc.data().thumb,
                preview: doc.data().preview,
                background: doc.data().background,
                pageSize: doc.data().pageSize,
              });

          });
          commit('setPages', pages);
        });
    },

    genPdfImages({ commit }, payload) {
      return new Promise((resolve, reject) => {
        firebase
          .firestore()
          .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages').orderBy('order', 'asc')
          .get()
          .then(function(querySnapshot) {
            const pages = [];
            querySnapshot.forEach(function(doc) {
              if (doc.data().preview) {
                pages.push(
                  axios.get(doc.data().preview,
                  {
                    responseType: 'arraybuffer'
                  }).then(result => new Buffer(result.data, 'binary').toString('base64'))
                );
              } else {
                console.log('no preview for :', doc.data())
              }
            });
            Promise.all(pages).then(res => {
                console.log(res);
                commit('setPdfImages', res);
            });
            // commit('setPages', pages);
          });
        });
    },

    setPage({ commit }, payload) {
      // console.log('setPage payload=', payload);
      firebase
        .firestore()
        .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages').orderBy('order', 'asc')
        .onSnapshot(function(querySnapshot) {
          let page;
          if (payload.pageKey) {
            querySnapshot.docs.forEach(doc => {
              if (doc.id === payload.pageKey)
                page = {
                  canvasJson: doc.data().canvasJson,
                  textLayer: doc.data().textLayer,
                  id: doc.id,
                  thumb: doc.data().thumb,
                  preview: doc.data().preview,
                  background: doc.data().background,
                  pageSize: doc.data().pageSize,
                  order: doc.data().order,
                };
            });
          } else {
            /** cater for index without id */
            page = {
              canvasJson : querySnapshot.docs[0].data().canvasJson,
              textLayer : querySnapshot.docs[0].data().textLayer,
              id: querySnapshot.docs[0].id,
              thumb: querySnapshot.docs[0].data().thumb,
              preview: querySnapshot.docs[0].data().preview,
              background: querySnapshot.docs[0].data().background,
              pageSize: querySnapshot.docs[0].data().pageSize,
              order: querySnapshot.docs[0].data().order,
            };
          }
          commit('setPage', page);
      });
    },

    setThumb({ commit, dispatch }, payload) {
      // console.log('setThumb payload=', payload);
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
            resolve(url);
            const newPayload = payload;
            newPayload.thumbUrl = url;
            dispatch('updateThumbData', newPayload);
            // Also update the story with the thumb ref
            /*  */
          })
          .catch(console.error);
      });
    },

    setPreview({ commit, dispatch }, payload) {
      // console.log('setThumb payload=', payload);
      return new Promise((resolve, reject) => {
        const ref = firebase.storage().ref();
        const path = 'images/' + payload.user.id + '/preview/' + payload.storyKey + '/' + payload.pageKey;
        const metadata = {
          contentType: payload.image.type
        };
        const task = ref.child(path).put(payload.image.dataUrl, metadata);
        task
          .then(snapshot => snapshot.ref.getDownloadURL())
          .then((url) => {
            resolve(url);
            const newPayload = payload;
            newPayload.previewUrl = url;
            dispatch('updatePreviewData', newPayload);
            // Also update the story with the thumb ref
            /*  */
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
            userStory.update({
              thumb: payloadRef.thumbUrl
            });
          }
        });
    },

    updatePreviewData({ commit }, payload) {
      const payloadRef = payload;
      const userStory = firebase
        .firestore()
        .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages/').doc(payload.pageKey);
        userStory.get().then(doc => {
          if(!doc.data().thumb) {
            userStory.update({
              preview: payloadRef.previewUrl
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
      if (state.imageSearchResults.str !== payload.str) {
        commit('clearImageSearchResults');
      }
      const pageStr = '&page=' + (state.imageSearchResults.page +1);
      let path = 'https://pixabay.com/api/?key=11945260-36d09543fa5ee7da289366856&image_type=all&per_page=';
      path += state.searchSize + '&safesearch=true&q=';
      const query = encodeURIComponent(payload.str);
      const fullPath = path + query + pageStr;
      axios.get(fullPath)
      .then((response) => {
        const newPayload = {
          str: payload.str,
          response: response
        };
        commit('setImageSearchResults', newPayload);
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

    historyAdd({ commit, state }, payload) {
      commit('setHistoryAddStates', payload);
      commit('setHistoryRestoreIndex', state.history.restoreIndex + 1);
    },

    historySlice({ commit, state }, payload) {
      console.log('historySlice', payload);
      commit('setHistorySliceStates', payload);
      commit('setHistoryRestoreIndex', state.history.restoreIndex + 1);
    },
  },

  getters: {
    getStories(state) {
      return state.stories;
    },
    getStory(state) {
      return state.story;
    },
    getStoryPlan(state) {
      return state.story.plan;
    },
    getPages(state) {
      return state.pages;
    },
    getPage(state) {
      return state.page;
    },
    getPageText(state) {
      if (state.page && state.page.textLayer) {
        return state.page.textLayer.text;
      } else {
        return 'Loading';
      }

    },
    getPageTextDimensions(state) {
      return state.page.textLayer;
    },
    getImageSearchResults(state) {
      return state.imageSearchResults;
    },
    getInsertImage(state) {
      return state.insertImage;
    },
    getPdfImages(state) {
      return state.pdfImages;
    },
    getModes(state) {
      return state.modes;
    },
    getHistory(state) {
      return state.history;
    },
    getPageDimensions(state) {
      console.log('getPageDimensions=', state.pageDimensions);
      return state.pageDimensions;
    }

  }
};
