<template></template>

<script lang="ts" setup>
import { ref } from "vue";

const time = ref<Date | null | string>(null);
const hidden = ref(false);

const setVal = () => {
  time.value = "12:04:04";
};

const hide = () => {
  hidden.value = !hidden.value;
};
</script>
