// Declare the app module if it's not already declared
var app = angular.module("app", []) // Or however your app is defined

app.controller("UserController", [
  "$scope",
  "$location",
  "AuthService",
  "UserService",
  function ($scope, $location, AuthService, UserService) {
    

    this.currentUser = AuthService.getCurrentUser()
    this.isAdminOrDirector = AuthService.isAdminOrDirector()

    this.users = []
    this.loading = true
    this.error = ""
    this.success = ""

    // New user form data
    this.newUser = {
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      user_type: "employee",
      department: "",
    }

    // Get all users
    this.getUsers = () => {
      this.loading = true
      this.error = ""

      UserService.getUsers()
        .then((response) => {
          this.users = response.data
          this.loading = false
        })
        .catch((error) => {
          this.error = "Failed to load users."
          this.loading = false
          console.error(error)
        })
    }

    // Create a new user
    this.createUser = () => {
      this.loading = true
      this.error = ""

      UserService.createUser(this.newUser)
        .then((response) => {
          this.success = "User created successfully!"

          // Clear the form
          this.newUser = {
            username: "",
            email: "",
            password: "",
            first_name: "",
            last_name: "",
            user_type: "employee",
            department: "",
          }

          // Refresh the user list
          return UserService.getUsers()
        })
        .then((response) => {
          this.users = response.data
          this.loading = false
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
            this.error = "Failed to create user."
          }

          this.loading = false
          console.error(error)
        })
    }

    // Delete a user
    this.deleteUser = (id) => {
      if (!confirm("Are you sure you want to delete this user?")) {
        return
      }

      this.loading = true
      this.error = ""

      UserService.deleteUser(id)
        .then(() => {
          this.success = "User deleted successfully!"

          // Refresh the user list
          return UserService.getUsers()
        })
        .then((response) => {
          this.users = response.data
          this.loading = false
        })
        .catch((error) => {
          this.error = "Failed to delete user."
          this.loading = false
          console.error(error)
        })
    }

    // Update user profile
    this.updateProfile = () => {
      this.loading = true
      this.error = ""

      var userData = {
        first_name: this.currentUser.first_name,
        last_name: this.currentUser.last_name,
        email: this.currentUser.email,
        phone: this.currentUser.phone,
      }

      UserService.updateUser(this.currentUser.id, userData)
        .then((response) => {
          // Update the current user in AuthService
          this.currentUser = response.data
          localStorage.setItem("currentUser", JSON.stringify(this.currentUser))

          this.success = "Profile updated successfully!"
          this.loading = false
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
            this.error = "Failed to update profile."
          }

          this.loading = false
          console.error(error)
        })
    }

    // Initialize based on route
    if ($location.path() === "/users" && this.isAdminOrDirector) {
      this.getUsers()
    }
  },
])

