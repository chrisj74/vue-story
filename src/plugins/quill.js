// import something here
import VueQuillEditor from 'vue-quill-editor';
import BlotFormatter from 'quill-blot-formatter';

// require styles
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'
// leave the export, even if you don't use it
export default ({ app, router, Vue }) => {
  Vue.use(VueQuillEditor);
  VueQuillEditor.Quill.register('modules/blotFormatter', BlotFormatter);
};
