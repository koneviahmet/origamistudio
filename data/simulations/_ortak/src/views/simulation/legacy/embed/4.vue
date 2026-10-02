<template>
  <div ref="chart"></div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import * as d3 from "d3";

const chart = ref(null);

onMounted(() => {
  const data = [10, 20, 30, 40, 50];

  const svg = d3
    .select(chart.value)
    .append("svg")
    .attr("width", 400)
    .attr("height", 200);

  svg
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d, i) => i * 50)
    .attr("y", (d) => 200 - d * 4)
    .attr("width", 40)
    .attr("height", (d) => d * 4)
    .attr("fill", "steelblue");
});
</script>
