var app = angular.module("myApp") // Or however your app is defined

app.service("TicketService", [
  "$http",
  "API_URL",
  ($http, API_URL) => {
    var service = {}

    // Get all tickets
    service.getTickets = () => $http.get(API_URL + "/tickets/")

    // Get a specific ticket
    service.getTicket = (id) => $http.get(API_URL + "/tickets/" + id + "/")

    // Create a new ticket
    service.createTicket = (ticketData) => $http.post(API_URL + "/tickets/", ticketData)

    // Update a ticket
    service.updateTicket = (id, ticketData) => $http.put(API_URL + "/tickets/" + id + "/", ticketData)

    // Change ticket status
    service.changeStatus = (id, status) =>
      $http.post(API_URL + "/tickets/" + id + "/change_status/", { status: status })

    // Assign ticket to employee
    service.assignTicket = (id, employeeId) =>
      $http.post(API_URL + "/tickets/" + id + "/assign/", { employee_id: employeeId })

    // Get ticket comments
    service.getComments = (ticketId) => $http.get(API_URL + "/tickets/" + ticketId + "/comments/")

    // Add a comment to a ticket
    service.addComment = (ticketId, content) =>
      $http.post(API_URL + "/tickets/" + ticketId + "/comments/", { content: content })

    // Get dashboard statistics
    service.getDashboardStats = () => $http.get(API_URL + "/dashboard/stats/")

    return service
  },
])

