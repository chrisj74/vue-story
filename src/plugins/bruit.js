import { defineBruitElements } from '../assets/bruit/dist/init';

export default ({ Vue }) => {
  Vue.config.ignoredElements = [/bruit-\w*/];
  defineBruitElements();
};
