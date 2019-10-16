import { defineBruitElements } from '@bruit/component/dist/init';

export default ({ Vue }) => {
  Vue.config.ignoredElements = [/bruit-\w*/];
  defineBruitElements();
};
