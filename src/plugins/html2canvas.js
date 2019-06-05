import VueHtml2Canvas from 'vue-html2canvas';
// leave the export, even if you don't use it
export default ({ app, router, Vue }) => {
  Vue.use(VueHtml2Canvas);
};
