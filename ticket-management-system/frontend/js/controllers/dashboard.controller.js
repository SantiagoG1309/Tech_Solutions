var app = angular.module("app") // Declare the app module

app.controller("DashboardController", [
  "$scope",
  "AuthService",
  "TicketService",
  function ($scope, AuthService, TicketService) {
    

    this.currentUser = AuthService.getCurrentUser()
    this.stats = null
    this.recentTickets = []
    this.loading = true
    this.error = ""

    // Initialize charts data
    this.statusChartData = {
      labels: ["Open", "In Progress", "Resolved", "Closed"],
      datasets: [
        {
          data: [0, 0, 0, 0],
          backgroundColor: ["#3498db", "#f39c12", "#2ecc71", "#34495e"],
        },
      ],
    }

    this.priorityChartData = {
      labels: ["Low", "Medium", "High", "Urgent"],
      datasets: [
        {
          data: [0, 0, 0, 0],
          backgroundColor: ["#3498db", "#f39c12", "#e67e22", "#e74c3c"],
        },
      ],
    }

    this.categoryChartData = {
      labels: ["Hardware", "Software", "Network", "Account", "Other"],
      datasets: [
        {
          data: [0, 0, 0, 0, 0],
          backgroundColor: ["#3498db", "#2ecc71", "#9b59b6", "#f1c40f", "#95a5a6"],
        },
      ],
    }

    // Load dashboard data
    this.loadDashboard = () => {
      this.loading = true
      this.error = ""

      TicketService.getDashboardStats()
        .then((response) => {
          this.stats = response.data

          // Update status chart data
          this.statusChartData.datasets[0].data = [
            this.stats.open_tickets,
            this.stats.in_progress_tickets,
            this.stats.resolved_tickets,
            this.stats.closed_tickets,
          ]

          // Update priority chart data
          this.priorityChartData.datasets[0].data = [
            this.stats.tickets_by_priority.low || 0,
            this.stats.tickets_by_priority.medium || 0,
            this.stats.tickets_by_priority.high || 0,
            this.stats.tickets_by_priority.urgent || 0,
          ]

          // Update category chart data
          this.categoryChartData.datasets[0].data = [
            this.stats.tickets_by_category.hardware || 0,
            this.stats.tickets_by_category.software || 0,
            this.stats.tickets_by_category.network || 0,
            this.stats.tickets_by_category.account || 0,
            this.stats.tickets_by_category.other || 0,
          ]

          // Get recent tickets
          return TicketService.getTickets()
        })
        .then((response) => {
          // Sort tickets by creation date (newest first) and take the first 5
          this.recentTickets = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

          this.loading = false
        })
        .catch((error) => {
          this.error = "Failed to load dashboard data."
          this.loading = false
          console.error(error)
        })
    }

    // Initialize dashboard
    this.loadDashboard()
  },
])

