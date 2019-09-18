export default {
  state: {
    loading: false,
    error: null,
    screen: {
      width: 1024,
      height: 768
    },
    showPlan: false,
    leftDrawerOpen: false,
  },
  mutations: {
    setLoading (state, payload) {
      state.loading = payload;
    },
    setError (state, payload) {
      state.error = payload;
    },
    clearError (state) {
      state.error = null;
    },
    setScreen (state, payload) {
      state.screen.width = payload.width;
      state.screen.height = payload.height;
    },
    setPlan(state, payload) {
      state.showPlan = payload;
    },
    setLeftDrawerOpen(state, payload) {
      state.leftDrawerOpen = payload;
    }
  },
  actions: {
    clearError ({commit}) {
      commit('clearError');
    },
    setScreen ({commit}) {
      const screenSizes = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      commit('setScreen', screenSizes);
    },
    toggleShowPlan({commit, state}) {
      commit('setPlan', !state.showPlan);
    },
    toggleLeftDrawerOpen({commit, state}) {
      commit('setLeftDrawerOpen', !state.leftDrawerOpen);
    },
  },
  getters: {
    loading (state) {
      return state.loading;
    },
    error (state) {
      return state.error;
    },
    screen (state) {
      return state.screen;
    },
    showPlan (state) {
      return state.showPlan;
    },
    getLeftDrawerOpen (state) {
      return state.leftDrawerOpen;
    }
  }
};
