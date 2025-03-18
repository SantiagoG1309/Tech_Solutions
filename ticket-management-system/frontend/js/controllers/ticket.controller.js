var app = angular.module("helpdesk") // Declare the app variable

app.controller("TicketController", [
  "$scope",
  "$routeParams",
  "$location",
  "AuthService",
  "TicketService",
  "UserService",
  function ($scope, $routeParams, $location, AuthService, TicketService, UserService) {
    

    this.currentUser = AuthService.getCurrentUser()
    this.isAdminOrDirector = AuthService.isAdminOrDirector()
    this.isEmployee = AuthService.isEmployee()
    this.isClient = AuthService.isClient()

    this.tickets = []
    this.ticket = null
    this.comments = []
    this.employees = []
    this.loading = true
    this.error = ""
    this.success = ""

    // New ticket form data
    this.newTicket = {
      title: "",
      description: "",
      category: "software",
      priority: "medium",
    }

    // New comment form data
    this.newComment = {
      content: "",
    }

    // Get all tickets
    this.getTickets = () => {
      this.loading = true
      this.error = ""

      TicketService.getTickets()
        .then((response) => {
          this.tickets = response.data
          this.loading = false
        })
        .catch((error) => {
          this.error = "Failed to load tickets."
          this.loading = false
          console.error(error)
        })
    }

    // Get a specific ticket
    this.getTicket = (id) => {
      this.loading = true
      this.error = ""

      TicketService.getTicket(id)
        .then((response) => {
          this.ticket = response.data

          // Get comments for this ticket
          return TicketService.getComments(id)
        })
        .then((response) => {
          this.comments = response.data

          // If admin or director, get employees for assignment
          if (this.isAdminOrDirector) {
            return UserService.getEmployees()
          }

          return { data: [] }
        })
        .then((response) => {
          this.employees = response.data
          this.loading = false
        })
        .catch((error) => {
          this.error = "Failed to load ticket details."
          this.loading = false
          console.error(error)
        })
    }

    // Create a new ticket
    this.createTicket = () => {
      this.loading = true
      this.error = ""

      TicketService.createTicket(this.newTicket)
        .then((response) => {
          this.success = "Ticket created successfully!"

          // Redirect to the ticket detail page
          $location.path("/tickets/" + response.data.id)
        })
        .catch((error) => {
          if (error.data) {
            // Format validation errors
            var errorMessages = []
            for (var key in error.data) {
              if (error.data.hasOwnProperty(key)) {
                errorMessages.push(key + ": " + error.data[key])
              }
            }
            this.error = errorMessages.join(", ")
          } else {
            this.error = "Failed to create ticket."
          }

          this.loading = false
          console.error(error)
        })
    }

    // Change ticket status
    this.changeStatus = (status) => {
      this.loading = true
      this.error = ""

      TicketService.changeStatus(this.ticket.id, status)
        .then((response) => {
          this.ticket = response.data
          this.success = "Ticket status updated to " + this.ticket.status_display
          this.loading = false

          // Refresh comments to show the status change
          return TicketService.getComments(this.ticket.id)
        })
        .then((response) => {
          this.comments = response.data
        })
        .catch((error) => {
          this.error = "Failed to update ticket status."
          this.loading = false
          console.error(error)
        })
    }

    // Assign ticket to employee
    this.assignTicket = (employeeId) => {
      this.loading = true
      this.error = ""

      TicketService.assignTicket(this.ticket.id, employeeId)
        .then((response) => {
          this.ticket = response.data
          this.success = "Ticket assigned to " + this.ticket.assigned_to_name
          this.loading = false

          // Refresh comments to show the assignment
          return TicketService.getComments(this.ticket.id)
        })
        .then((response) => {
          this.comments = response.data
        })
        .catch((error) => {
          this.error = "Failed to assign ticket."
          this.loading = false
          console.error(error)
        })
    }

    // Add a comment to a ticket
    this.addComment = () => {
      if (!this.newComment.content) {
        this.error = "Comment cannot be empty."
        return
      }

      this.loading = true
      this.error = ""

      TicketService.addComment(this.ticket.id, this.newComment.content)
        .then((response) => {
          // Add the new comment to the list
          this.comments.push(response.data)

          // Clear the form
          this.newComment.content = ""
          this.success = "Comment added successfully!"
          this.loading = false
        })
        .catch((error) => {
          this.error = "Failed to add comment."
          this.loading = false
          console.error(error)
        })
    }

    // Initialize based on route
    if ($routeParams.id) {
      this.getTicket($routeParams.id)
    } else if ($location.path() === "/tickets") {
      this.getTickets()
    }
  },
])

