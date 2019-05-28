// https://github.com/michael-ciniawsky/postcss-load-config
const { styles } = require( '@ckeditor/ckeditor5-dev-utils' );

const config = styles.getPostCssConfig({
  themeImporter: {
      themePath: require.resolve('@ckeditor/ckeditor5-theme-lark')
  },
  minify: true
});

config.plugins.push( require('autoprefixer')() );

module.exports = config
