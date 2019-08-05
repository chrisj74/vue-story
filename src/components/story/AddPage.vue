<template>
  <div>
    <h4>Add Page</h4>
    <q-btn color="primary" icon="mdi-plus-circle" @click="addPage()" />
  </div>
</template>

<script>
export default {
  name: 'AddStory',
  data() {
      return {

      }
  },
  computed: {
      editor() {
          return this.$refs.guideEditor.quill
      },
      user() {
          return this.$store.getters.user;
      },
      loading() {
          return this.$store.getters.loading;
      },
      showPlan() {
          return this.$store.getters.showPlan;
      },
      story() {
          return this.$store.getters.getStory;
      },
      pages: {
          get() {
              return this.$store.getters.getPages;
          },
          set(value) {
              const payload = {
                  user: this.user,
                  storyKey: this.$route.params.id,
                  pageKey: this.$route.params.pageId ? this.$route.params.pageId : null,
                  pages: value
              }
              this.$store.dispatch('updatePageOrder', payload);
          }

      },
      activePage() {
          return this.$store.getters.getPage;
      },
      screen() {
          return this.$store.getters.screen;
      }
  },
  methods: {
    addPage() {
      const newOrder = this.pages.length;
      const page = {
        commit: 0,
        photoLayer: {},
        drawingLayer: {},
        textLayer: [{
          text: ' ',
          x: 50,
          y: 25,
          width: (595 - 100),
          height: (150)
        }],
        background: {
          color: '#ffffff',
          image: false,
        },
        order: newOrder,
        pageSize: {
          width: 842,
          height: 595,
        }
      };
      const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          pageKey: this.$route.params.pageId ? this.$route.params.pageId : null,
          order: this.pages.length,
          page: page,
      }
      const storyKey = this.$route.params.id;
      this.$store.dispatch('addPage', payload)
      .then(newPage => {
        const payload = {
          showAddPage: false,
        };
        this.$store.commit('setSettings', payload);
        this.$router.push({ path: '/story/'+storyKey+'/'+newPage });
      }) ;
    },
  }
}
</script>

<style lang="stylus">
@import '~variables'

</style>