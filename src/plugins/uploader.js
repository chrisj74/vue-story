import ImageUploader from 'vue-image-upload-resize';

// leave the export, even if you don't use it
export default ({ app, router, Vue }) => {
  Vue.use(ImageUploader);
};
