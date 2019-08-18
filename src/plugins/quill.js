// import something here
import VueQuillEditor from 'vue-quill-editor';
import BlotFormatter from 'quill-blot-formatter';
import QuillCursors from 'quill-cursors';
import QuillBetterTable from 'quill-better-table';

// require styles
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'
import 'quill-better-table/dist/quill-better-table.css'
// leave the export, even if you don't use it
export default ({ app, router, Vue }) => {
  Vue.use(VueQuillEditor);

  var Font = VueQuillEditor.Quill.import('formats/font');
  // We do not add Aref Ruqaa since it is the default
  Font.whitelist = ["schoolbell"];
  VueQuillEditor.Quill.register(Font, true);

  VueQuillEditor.Quill.register('modules/blotFormatter', BlotFormatter);
  VueQuillEditor.Quill.register('modules/cursors', QuillCursors);
  VueQuillEditor.Quill.register('modules/better-table', QuillBetterTable);
};
