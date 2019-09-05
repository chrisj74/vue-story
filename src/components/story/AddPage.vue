<template>
  <div class="modal-wrapper">
    <h4>Add Page</h4>
    <div class="page-size-wrapper">
      <div class="page-size" @click="setSize(595, 842, 0)" :class="{selected: selectedIndex === 0}">
        <div class="portrait outline"></div>
        portrait
      </div>
      <div class="page-size" @click="setSize(842, 595, 1)" :class="{selected: selectedIndex === 1}">
        <div class="landscape outline"></div>
        landscape
      </div>
      <div class="page-size" @click="setSize(595, 595, 2)" :class="{selected: selectedIndex === 2}">
        <div class="square outline"></div>
        square
      </div>
    </div>
    <div class="add-actions">
      <q-btn color="primary" icon="mdi-plus-circle" @click="addPage()" :disabled="!selectedHeight || !selectedWidth">Add Page</q-btn>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddPage',
  data() {
      return {
        selectedWidth: null,
        selectedHeight: null,
        selectedIndex: null
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
    setSize(width, height, index) {
      this.selectedWidth = width;
      this.selectedHeight = height;
      this.selectedIndex = index;
    },

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
          width: (this.selectedWidth - 100),
          height: (150),
          borderWidth: 0,
          borderColor: '#ffffff',
          opacity: 0,
          backgroundColor: '#ffffff',
          delta: []
        }],
        background: {
          color: '#ffffff',
          image: false,
        },
        order: newOrder,
        pageSize: {
          width: this.selectedWidth,
          height: this.selectedHeight,
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
.modal-wrapper {
  padding: 20px;
}
.page-size-wrapper {
  display: flex;
  justify-content: space-evenly;
  margin-bottom: 10px;
  .page-size {
    flex-basis: 30%;
    padding: 10px;
    box-shadow: 0 1px 5px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12);
    border: solid 3px transparent;
    border-radius: 3px;
    background: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    &.selected {
      border: solid 3px $primary;
      .outline {
        border: solid 2px $primary;
      }
    }
    .outline {
      border: solid 2px #666;
      border-radius: 3px;
      margin-bottom: 5px;
      &.portrait {
        width: 50%;
        &:after {
          content: "";
          padding-top: 150%;
          position: relative;
          display: block;
        }
      }
      &.landscape {
        width: 80%;
        &:after {
          content: "";
          padding-top: 50%;
          position: relative;
          display: block;
        }
      }
      &.square {
        width: 50%;
        &:after {
          content: "";
          padding-top: 100%;
          position: relative;
          display: block;
        }
      }
    }
  }
}
.add-actions {
  display: flex;
  justify-content: center;
}

</style>