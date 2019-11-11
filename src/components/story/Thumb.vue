<template>

</template>

<script>
import { fabric } from 'fabric-with-gestures';
import * as b64toBlob from 'b64-to-blob';
import * as _ from 'lodash';
import draggable from 'vuedraggable';
import TextEditor from "./TextEditor";
import DrawingCanvas from './DrawingCanvas';


export default {
    name: 'Thumb',
    components: {
        draggable,
        TextEditor,
        DrawingCanvas
    },
    data() {
        return {

      }
  },
  computed: {
      user() {
          return this.$store.getters.user;
      },
      loading() {
          return this.$store.getters.loading;
      },
      story() {
          return this.$store.getters.getStory;
      },
      screen() {
          return this.$store.getters.screen;
      }
  },
  methods: {

  },
  watch: {

  }
}
</script>

<style lang="stylus">
@import '~variables'

</style>
