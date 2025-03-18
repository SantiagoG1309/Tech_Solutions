// Declare the app module if it's not already declared
var app = angular.module("app", [])

app.controller("AuthController", [
  "$scope",
  "$location",
  "AuthService",
  function ($scope, $location, AuthService) {
    

    // Initialize form data
    this.loginData = {
      username: "",
      password: "",
    }

    this.registerData = {
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      user_type: "client",
    }

    this.error = ""
    this.success = ""

    // Login function
    this.login = () => {
      this.error = ""

      AuthService.login(this.loginData)
        .then(() => {
          $location.path("/dashboard")
        })
        .catch((error) => {
          if (error.data && error.data.detail) {
            this.error = error.data.detail
          } else {
            this.error = "Login failed. Please check your credentials."
          }
        })
    }

    // Register function
    this.register = () => {
      this.error = ""
      this.success = ""

      // For client registration
      this.registerData.user_type = "client"

      AuthService.register(this.registerData)
        .then(() => {
          this.success = "Registration successful! You can now login."
          this.registerData = {
            username: "",
            email: "",
            password: "",
            first_name: "",
            last_name: "",
            user_type: "client",
          }

          // Redirect to login after a short delay
          setTimeout(() => {
            $location.path("/")
            $scope.$apply()
          }, 2000)
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
            this.error = "Registration failed. Please try again."
          }
        })
    }
  },
])

