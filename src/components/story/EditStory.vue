<template>
  <div class="modal-wrapper">
    <h4>Add Story</h4>
      <q-input type="text" v-model="newStory.title" float-label="Story Name" class="text-input" />
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
      <q-btn color="primary" icon="mdi-plus-circle" @click="addStory()" :disabled="!selectedHeight || !selectedWidth || newStory.title.length === 0">Add Story</q-btn>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddStory',
  data() {
      return {
        selectedWidth: null,
        selectedHeight: null,
        selectedIndex: null,
        newStory: {
          title: ""
        },
        submitting: false,
      }
  },
  computed: {
      user() {
          return this.$store.getters.user;
      },
      loading() {
          return this.$store.getters.loading;
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

    addStory() {
      const page = {
        commit: 0,
        photoLayer: {},
        drawingLayer: {},
        textLayer: [
          {
            backgroundColor: "#ffffff",
            borderColor: "#ffffff",
            borderWidth: 0,
            delta: [{"insert":"Story Title","attributes":{"size":"huge"}},{"insert":"\n","attributes":{"align":"center"}}],
            height: 150,
            opacity: 0,
            text: "<p class=\"ql-align-center\"><span class=\"ql-size-huge\">Story Title</span></p>",
            width: (this.selectedWidth - 100),
            x: 50,
            y: 100,
            range: {"index":1,"length":0}
          }
        ],
        background: {
          color: '#ffffff',
          image: false,
        },
        order: 0,
        pageSize: {
          width: this.selectedWidth,
          height: this.selectedHeight,
        }
      };
      const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          pageKey: this.$route.params.pageId ? this.$route.params.pageId : null,
          newStory: {
            title: this.newStory.title,
            plan: "<p>Plan from db</p>",
            thumb: '',
          },
          page: page,
      }
      this.$store.dispatch('addStory', payload)
        .then((newStoryId) => {
          this.submitting = false;
          this.newStory.title = "";
          const payload = {
            showAddStory: false,
          };
          this.$store.commit('setSettings', payload);
          this.$router.push({ path: '/story/'+newStoryId });
        });
    },
  }
}
</script>

<style lang="stylus">
@import '~variables'
.modal-wrapper {
  padding: 20px;
}
.text-input {
  margin-bottom: 20px;
}
.page-size-wrapper {
  display: flex;
  justify-content: space-evenly;
  margin-bottom: 20px;
  .page-size {
    flex-basis: 30%;
    padding: 10px;
    min-height: 200px;
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
        height: 80%;
      }
      &.landscape {
        width: 80%;
        height: 50%;
      }
      &.square {
        width: 50%;
        height: 50%;
      }
    }
  }
}
.add-actions {
  display: flex;
  justify-content: center;
}

</style>