
export default (to, from, next) => {
  if (store.getters.user && store.getters.user.isAdmin) {
    next();
  } else {
    next('/');
  }
};
