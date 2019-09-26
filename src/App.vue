<template>
  <div id="q-app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  created() {
    const _this = this;
    window.addEventListener('resize', function(event) {
      _this.$store.dispatch('setScreen');
    });
    this.$store.dispatch('setScreen');
  }
}
</script>

<style>
</style>
