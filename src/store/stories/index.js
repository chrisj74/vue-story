import * as firebase from "firebase";
import * as _ from "lodash";
import * as axios from 'axios';
import uuid from 'uuidv4';

export default {
  state: {
    projects: [],
    images: [],
    nextPage: null,
    stories: [],
    pageImages: {},
    story: {},
    pages: [],
    page: null,
    pageDimensions: null,
    imageSearchResults: {
      str: '',
      page: 0,
      totalHits: 0,
      hits: null,
    },
    searchSize: 50,
    insertImage: null,
    pdfImages: null,
    modes: {
      mode: 'draw',
      subMode: 'brush',
    },
    settings: {
      brushWidth: 2,
      showBrushWidth: false,
      imageOpacity: 1,
      lineWidth: 1,
      showImageOpacity: false,
      color: '#000000',
      isSelected: false,
      showImageModal: false,
      showUploadModal: false,
      showPlanModal: false,
      activeEditor: 0,
      showProjectModal: false,
      showAddPage: false,
      showAddStory: false,
      showEditStory: false,
      showPublishStory: false,
      showEditPlan: false,
      showThumbs: false,
      textBoxBorderWidth: 0,
      textBoxBorderColor: '#ffffff00',
      textBoxBackgroundColor: '#ffffffff',
      textBoxOpacity: 0,
    },
    history: {
      undo: false,
      redo: false,
      restoreIndex: -1,
      states: []
    },
    toolAction: null,
  },
  mutations: {
    setProjects(state, payload) {
      state.projects = payload;
    },
    setImages(state, payload) {
      state.images = payload;
    },
    addImage(state, payload) {
      state.images.unshift(payload)
    },
    addStory(state, payload) {
      const newStory = payload;
      state.stories.unshift(newStory);
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
      let pageVal;
      if (state.page && state.page.id === payload.page.id) {
        pageVal = _.cloneDeep(state.page);
        if(payload.page.textLayer.length !== pageVal.textLayer.length) {
          pageVal.textLayer = payload.page.textLayer;
        }
        pageVal = _.merge(pageVal, payload.page);
      } else {
        pageVal = payload.page
      }
      state.page = pageVal;
      if (payload.restoreIndex) {
        /** Update history if it's not part of undo/redo */
        pageVal.modes = _.cloneDeep(state.modes);
        if (state.history.restoreIndex === state.history.states.length - 1) {
          state.history.states.push(pageVal);
        } else {
          state.history.states = state.history.states.slice(0, state.history.restoreIndex + 1);
          state.history.states.push(pageVal);
        }
        state.history.restoreIndex = state.history.restoreIndex + 1;
      }
    },
    resetPage (state) {
      state.page =  null;
      state.pageDimensions = null;
    },
    setPageImage(state, payload) {
      state.pageImages[payload.pageId] = payload.imageData;
    },
    clearPageImages(state) {
      state.pageImages = {};
    },
    clearImageSearchResults(state) {
      state.imageSearchResults.str = '';
      state.imageSearchResults.totalHits = 0;
      state.imageSearchResults.hits = null;
      state.imageSearchResults.page = 0;
    },
    setImageSearchResults(state, payload) {
      state.imageSearchResults.str = payload.str;
      state.imageSearchResults.totalHits = payload.response.data.totalHits;
      if (!state.imageSearchResults.hits) {
        state.imageSearchResults.hits = [];
      }
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
      payload.modes = _.cloneDeep(state.modes);
      state.history.states.push(payload);
    },
    setHistoryStates(state, payload) {
      state.history.states = payload;
    },
    setHistorySliceStates(state, payload) {
      state.history.states = state.history.states.slice(0, state.history.restoreIndex + 1);
      payload.modes = _.cloneDeep(state.modes);
      state.history.states.push(payload);
    },
    setHistoryRestoreIndex(state, payload) {
      state.history.restoreIndex = payload;

    },
    setHistoryUndo(state){
      const modes = _.cloneDeep(state.history.states[state.history.restoreIndex].modes);
      if (modes.mode === 'draw') {
        /** issue with loading pad with erase mode, force brush */
        modes.subMode = 'brush';
      }
      state.modes = modes;
      state.page = _.cloneDeep(state.history.states[state.history.restoreIndex]);
    },
    setHistoryRedo(state, payload){
      state.history.redo = payload;
    },
    setPageDimensions(state, payload) {
      let newDimensions = _.cloneDeep(state.pageDimensions);
      newDimensions = _.merge(newDimensions, payload);
      state.pageDimensions = newDimensions;
    },
    setSettings(state, payload) {
      let settings = _.cloneDeep(state.settings);
      settings = _.merge(settings, payload);
      state.settings = settings;
    },
    setToolAction(state, payload) {
      state.toolAction = payload;
    },
    setNextPage(state, payload) {
      state.nextPage = payload;
    }
  },
  actions: {
    addStory({ state }, payload) {
      return new Promise((resolve, reject) => {
        const userStories = firebase
          .firestore()
          .collection("users/").doc(payload.user.id);
        userStories.update({
          lastUpdated: new Date(),
        });

        userStories
          .collection('stories').add(payload.newStory)
          .then(function(docRef) {
            const _docRef = docRef
            docRef
              .collection('pages').add(payload.page)
                .then(function(pageRef) {
                  const newStoryId = _docRef.id;
                  resolve(newStoryId);
                });
          })
          .catch(function(error) {
              console.error("Error adding document: ", error);
          });
      });
    },

    cloneStory({ commit, state, dispatch }, payload) {
      return new Promise((resolve, reject) => {
        const _payload = payload;
        /* Get the source story */
        const sourceUserId = payload.projectUserId ? payload.projectUserId : payload.user.id;
        let sourceStory;
        const sourceCollection = firebase
          .firestore()
          .collection('users/' + sourceUserId + '/stories/');
        sourceCollection.doc(payload.storyKey).get().then((querySnapshot) => {
          if (payload.newStory) {
            /* Merge if passed new story from template */
            sourceStory = {...querySnapshot.data(),...payload.newStory};
            sourceStory.sourceId = querySnapshot.data().id;
            sourceStory.id = querySnapshot.id;
          } else {
            sourceStory = querySnapshot.data();
            sourceStory.title = sourceStory.title + ' copy';
          }
          sourceStory.modified = new Date();
          /* Get all the pages and push into an array */
          const sourcePages = [];
          firebase.firestore()
            .collection('users/' + sourceUserId + '/stories/' + payload.storyKey + '/pages').orderBy('order', 'asc')
            .get().then((pages) => {
              pages.forEach(function(page) {
                sourcePages.push({
                  photoLayer: page.data().photoLayer,
                  textLayer: page.data().textLayer,
                  thumb: page.data().thumb ? page.data().thumb : '',
                  // preview: page.data().preview,
                  background: page.data().background,
                  drawingLayer: page.data().drawingLayer,
                  pageSize: page.data().pageSize,
                  order: page.data().order,
                  commit: 0,
                });
              });
              /* Set the modified timestamp */
              const userStories = firebase
                .firestore()
                .collection("users/").doc(payload.user.id);
              userStories.update({
                lastUpdated: new Date(),
              });
              /* Add the story */
              userStories
              .collection('stories').add(sourceStory)
              .then(function(docRef) {
                /* Add each page */
                const newStoryId = docRef.id;
                sourcePages.forEach(page => {
                  docRef
                  .collection('pages').add(_.cloneDeep(page))
                });
                resolve(newStoryId);
              })
              .catch(function(error) {
                  console.error("Error adding document: ", error);
              });
            });
        });
      });
    },

    updateStoryModified({ commit }, payload) {
      const userStory = firebase
        .firestore()
        .collection('users/' + payload.user.id + '/stories/').doc(payload.storyKey);
        userStory.update({
          modified: new Date()
        });
    },

    updateStory({ dispatch, state, commit }, payload) {
      return new Promise((resolve, reject) => {
        const stateStory = _.cloneDeep(state.story);
        let newStory;
        if (!isNaN(payload.planIndex)) {
          newStory = stateStory;
          newStory = JSON.parse(JSON.stringify(newStory));
          newStory.plan[payload.planIndex] = payload.plan;
          newStory.modified = new Date();
        } else if (payload.plan) {
          newStory = stateStory;
          newStory = JSON.parse(JSON.stringify(newStory));
          newStory.plan = payload.plan;
          newStory.modified = new Date();
        } else {
          newStory = _.merge(stateStory, payload.story);
          newStory = JSON.parse(JSON.stringify(newStory));
          newStory.modified = new Date();
        }
        newStory.commit++;
        commit('setStory', newStory);
        const userStory = firebase
        .firestore()
        .collection('users/' + payload.user.id + '/stories/').doc(payload.storyKey);
        userStory.update(newStory)
          .then(docRef => {
            dispatch('updateStoryModified', payload);
          });
        resolve();
      });
    },

    updatePageOrder({ commit, dispatch }, payload) {
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
          index++;
        });
        dispatch('updateStoryModified', payload);
        resolve();
      });
    },

    updatePage( {commit, state, dispatch }, payload) {
      const statePage = _.cloneDeep(state.page);
      const newState = _.merge(statePage, payload.page);
      newState.commit++;
      commit('setPage', {page: newState, restoreIndex: payload.restoreIndex});
      return new Promise((resolve, reject) => {

        const userPage = firebase
          .firestore()
          .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages/').doc(payload.pageKey);
          if (payload.page.drawingLayer) {
            userPage.update({
              commit: newState.commit,
              drawingLayer: payload.page.drawingLayer,
            });
          }
          if (payload.page.background){
            userPage.update({
              commit: newState.commit,
              background: payload.page.background
            });
          }
          if (payload.page.photoLayer){
            userPage.update({
              commit: newState.commit,
              photoLayer: payload.page.photoLayer
            });
          }
          if (payload.page.textLayer){
            userPage.update({
              commit: newState.commit,
              textLayer: payload.page.textLayer
            });
          }
          dispatch('updateStoryModified', payload);
        resolve();
      });
    },

    updatePageText( {commit, state, dispatch }, payload) {
      dispatch('updateStoryModified', payload);
      const newState = _.cloneDeep(state.page);
      if (newState.textLayer[payload.index]) {
        if (payload.textLayer) {
          newState.textLayer[payload.index] = _.merge(newState.textLayer[payload.index], payload.textLayer);
        } else {
          newState.textLayer.splice(payload.index, 1);
          const newSetting = {
            activeEditor: newState.textLayer.length - 1
          };
          commit('setSettings', newSetting);
        }
      } else {
        newState.textLayer.push(payload.textLayer);

      }

      newState.commit++;
      commit('setPage', {page: newState, restoreIndex: true});
      return new Promise((resolve, reject) => {
        const userStory = firebase
          .firestore()
          .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages/').doc(payload.pageKey);
          userStory.update({
            commit: newState.commit,
            textLayer: newState.textLayer
          });
        resolve();
      });
    },

    addPage( { dispatch }, payload) {
      return new Promise((resolve, reject) => {
        dispatch('updateStoryModified', payload);
        let newId = null;
        const newOrder = payload.order;
        let page = payload.page
        if (!page) {
          /** Set default */
          page = {
            commit: 0,
            photoLayer: {},
            drawingLayer: {},
            textLayer: [/* {
              text: ' ',
              x: 50,
              y: 25,
              width: (595 - 100),
              height: (150),
              borderWidth: 0,
              borderColor: '#ffffff00',
              backgroundColor: '#ffffffff',
              opacity: 0,
              delta: []
            } */],
            background: {
              color: '#ffffff',
              image: false,
            },
            order: newOrder,
            pageSize: {
              width: 595,
              height: 842,
            }
          }
        }
        const userStory = firebase
          .firestore()
          .collection('users/' + payload.user.id + '/stories/' + payload.storyKey + '/pages/');
          userStory.add(page).then(function(docRef) {
            newId = docRef.id;
            resolve(newId);
          });
      });
    },

    deletePage( { dispatch }, payload) {
      const payloadRef = payload;
      return new Promise((resolve, reject) => {
        dispatch('updateStoryModified', payload);
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

    setImages({ commit }, payload) {
      firebase
        .firestore()
        .collection('users/').doc(payload)
        .onSnapshot(function(querySnapshot) {
          let sortedArray = [];
          if (querySnapshot.exists && querySnapshot.data().images) {
            sortedArray = querySnapshot.data().images.sort((a,b) => {
               return new Date(b.created.toDate()) - new Date(a.created.toDate());
            })
          }
          commit('setImages', sortedArray);
      });
    },

    setStories({ commit, dispatch }, payload) {
      return new Promise((resolve, reject) => {
        firebase
            .firestore()
            .collection('users/' + payload + '/stories/')
            .orderBy('modified', 'desc')
            .onSnapshot(function(querySnapshot) {
              const stories = [];
              querySnapshot.forEach(function(doc) {
                stories.push({
                  id: doc.id,
                  title: doc.data().title,
                  thumb: doc.data().thumb,
                  profile: doc.data().profile,
                  description: doc.data().description,
                  plan: doc.data().plan,
                  modified: doc.data().modified.toDate(),
                  publishId: doc.data().publishId,
                });
              });
              commit('setStories', stories);
          });
        resolve();
      });
    },

    setStory({ commit, state}, payload) {
      return new Promise((resolve, reject) => {
        firebase
          .firestore()
          .collection('users/' + payload.user.id + '/stories/').doc(payload.storyKey)
          .onSnapshot(function(querySnapshot) {
            if(!state.story.commit
              || !querySnapshot.data().commit
              || querySnapshot.data().commit === 0
              || querySnapshot.data().commit > state.story.commit
            ) {
              const storyObj = JSON.parse(JSON.stringify(querySnapshot.data()));
              storyObj['id'] = querySnapshot.id;
              if (!storyObj['playback']) {
                storyObj.playback = {
                  currentVideoIndex: 0
                }
              }
              commit('setStory', storyObj);
              if (!state.story || state.story.id !== querySnapshot.id) {
                if (querySnapshot.data().publishId) {
                  commit('setPlan', true);
                } else {
                  commit('setPlan', false);
                }
              }
            }
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
              thumb: doc.data().thumb,
              preview: doc.data().preview,
              background: doc.data().background,
              pageSize: doc.data().pageSize,
              page: {
                photoLayer: doc.data().photoLayer,
                textLayer: doc.data().textLayer,
                id: doc.id,
                thumb: doc.data().thumb,
                preview: doc.data().preview,
                background: doc.data().background,
                drawingLayer: doc.data().drawingLayer,
                pageSize: doc.data().pageSize,
                order: doc.data().order,
                commit: doc.data().commit,
              }
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

    setPage({ commit, state }, payload) {
      const _payload = payload;
      let newSetting;
      commit('setNextPage', _payload.pageKey)
      firebase
        .firestore()
        .collection('users/' + _payload.user.id + '/stories/' + _payload.storyKey + '/pages').orderBy('order', 'asc')
        .onSnapshot(function(querySnapshot) {
          let page;
          if (state.nextPage) {
            querySnapshot.docs.forEach(doc => {
              if (
                (doc.id === state.nextPage)
                && (!state.page
                  || state.page.id !== doc.id
                  || doc.data().commit > state.page.commit
                  || state.page.commit == 0)
                ) {
                page = {
                  photoLayer: doc.data().photoLayer,
                  textLayer: doc.data().textLayer,
                  id: doc.id,
                  thumb: doc.data().thumb,
                  preview: doc.data().preview,
                  background: doc.data().background,
                  drawingLayer: doc.data().drawingLayer,
                  pageSize: doc.data().pageSize,
                  order: doc.data().order,
                  commit: doc.data().commit,
                };
                page = _.cloneDeep(page);
                newSetting = {
                  activeEditor: page.textLayer.length -1
                }
                commit('setSettings', newSetting);

                commit('setPage', {page: page, restoreIndex: true});
              }
            });

          } else if (state.story &&
            (!state.page
            || state.page.id !== querySnapshot.docs[0].id
            || querySnapshot.docs[0].data().commit > state.page.commit
            || state.page.commit == 0)) {
            /** cater for index without id */
            page = {
              photoLayer : querySnapshot.docs[0].data().photoLayer,
              textLayer : querySnapshot.docs[0].data().textLayer,
              id: querySnapshot.docs[0].id,
              thumb: querySnapshot.docs[0].data().thumb,
              preview: querySnapshot.docs[0].data().preview,
              background: querySnapshot.docs[0].data().background,
              drawingLayer: querySnapshot.docs[0].data().drawingLayer,
              pageSize: querySnapshot.docs[0].data().pageSize,
              order: querySnapshot.docs[0].data().order,
              commit: querySnapshot.docs[0].data().commit,
            };
            page = _.cloneDeep(page);
            newSetting = {
              activeEditor: page.textLayer.length -1
            }
            commit('setSettings', newSetting);
            commit('setPage', {page: page, restoreIndex: true});
          }

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

    addImage({ commit, state }, payload) {
      const ref = firebase.storage().ref();
      const path = 'images/' + payload.user.id + '/' + uuid();
      const metadata = {
        contentType: payload.image.type
      };
      const task = ref.child(path).put(payload.image.dataUrl, metadata);
      task
        .then(snapshot => snapshot.ref.getDownloadURL())
        .then((url) => {
          let imagePath = url;
          if (url.indexOf('?token=') !== -1) {
            imagePath = url.substring(0, indexOf('?token='));
          }
          const imgObj = {
            webformatURL: imagePath,
            webformatWidth: payload.image.dimensions.w,
            webformatHeight: payload.image.dimensions.h,
          };
          commit('setInsertImage', imgObj);
          commit('addImage', imagePath);
        })
        .catch(console.error);
    },

    searchImages({ commit, state }, payload) {
      if (state.imageSearchResults.str !== payload.str) {
        commit('clearImageSearchResults');
      }
      if (payload.str && payload.str.length > 0) {
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
      }
    },

    historyAdd({ commit, state }, payload) {
      commit('setHistoryAddStates', payload);
      commit('setHistoryRestoreIndex', state.history.restoreIndex + 1);
    },

    historySlice({ commit, state }, payload) {
      commit('setHistorySliceStates', payload);
      commit('setHistoryRestoreIndex', state.history.restoreIndex + 1);
    },

    addPublishStory( {commit, state, dispatch }, payload) {
      return new Promise((resolve, reject) => {
        const _payload = payload
        const publishStory = firebase
          .firestore()
          .collection('projects/');
          publishStory.add(payload).then(function(docRef) {
            const newId = docRef.id;
            const storyPayload = {
              story: {
                publishId: newId,
              },
              user: {
                id: _payload.projectUserId,
              },
              storyKey: _payload.projectId
            }
            dispatch('updateStory', storyPayload);
            resolve(newId);
          });
      });
    },

    updatePublishStory( {commit, state, dispatch }, payload) {
      return new Promise((resolve, reject) => {
        const _payload = payload
        const publishStory = firebase
          .firestore()
          .collection('projects/').doc(payload.publishId);
          publishStory.set(payload).then(function(docRef) {
            resolve();
          });
      });
    },

    setProjects({ commit }) {
      firebase
        .firestore()
        .collection('projects/').orderBy('dateCreated', 'asc')
        .onSnapshot(function(querySnapshot) {
          const projects = [];
          querySnapshot.forEach(function(doc) {
            projects.push(doc.data());
          });
          commit('setProjects', projects);
        });
    }
  },

  getters: {
    getStories(state) {
      return state.stories;
    },
    getStoriesByActiveProfile (state, getters, rootState) {
      if (!rootState.user || !rootState.user.activeProfile) {
        return null;
      }
      let profileStories = state.stories.filter(story => {
        return story.profile === rootState.user.activeProfile.id;
      });
      return profileStories;
    },
    getStory(state) {
      return state.story;
    },
    getPlan(state) {
      return state.story.plan
    },
    getStoryById: (state) => (id) => {
      let activeStory;
      state.stories.forEach(story => {
        if (story.id === id) {
          activeStory = story;
        }
      });
      return activeStory;
    },
    getPublishedProjectsById: (state) => (id) => {
      if (!id) {
        return null;
      }
      let activePublished;
      state.projects.forEach(project => {
        if (project.id === id) {
          activePublished = project;
        }
      });
      return activePublished;
    },
    getPublishedProjectsByCategory: (state) => (cat) => {
      if (!cat) {
        return null;
      }
      let categoryProjects = state.projects.filter(project => {
        return project.category === cat;
      });
      return categoryProjects;
    },
    getPublishedProjectsByKeyword: (state) => (keyword) => {
      if (!keyword) {
        return null;
      }
      let keywordProjects = state.projects.filter(project => {
        return project.keywords.includes(keyword);
      });
      return keywordProjects;
    },
    getPublishedProjects (state) {
      return state.projects;
    },
    getStoryPlan(state) {
      return state.story ? state.story.plan : null;
    },
    getPages(state) {
      return state.pages;
    },
    getPage(state) {
      return state.page;
    },
    getPageTextLayer(state) {
      if (state.page && state.page.textLayer) {
        return state.page.textLayer;
      } else {
        return 'Loading';
      }
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
      return state.pageDimensions;
    },
    getSettings(state) {
      return state.settings;
    },
    getToolAction(state) {
      return state.toolAction;
    },
    getPageImageById: (state) => (id) => {
      return state.pageImages[id];
    },
    getPageImages(state) {
      return state.pageImages;
    },
    getAllImages(state) {
      return state.images;
    }
  }
};
