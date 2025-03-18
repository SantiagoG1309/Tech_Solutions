import { Chart } from "@/components/ui/chart"
;("use strict")

// Declare the app variable
var app = angular.module("myApp") // Replace 'myApp' with your actual module name

app.directive("chartJs", [
  () => ({
    restrict: "E",
    scope: {
      chartData: "=",
      chartType: "@",
      chartOptions: "=",
    },
    link: (scope, element) => {
      // Create canvas element
      var canvas = document.createElement("canvas")
      element[0].appendChild(canvas)

      // Default chart options
      var defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
      }

      // Create the chart
      var chart = new Chart(canvas, {
        type: scope.chartType || "bar",
        data: scope.chartData,
        options: scope.chartOptions || defaultOptions,
      })

      // Watch for data changes
      scope.$watch(
        "chartData",
        (newValue, oldValue) => {
          if (newValue !== oldValue) {
            chart.data = newValue
            chart.update()
          }
        },
        true,
      )

      // Clean up on directive destroy
      scope.$on("$destroy", () => {
        chart.destroy()
      })
    },
  }),
])

