// Declare the app variable
var app = angular.module("yourAppName") // Replace 'yourAppName' with your actual app name

app.service("AuthService", [
  "$http",
  "$q",
  "$location",
  "API_URL",
  ($http, $q, $location, API_URL) => {
    var service = {}
    var currentUser = null

    // Get the current user from localStorage on service initialization
    var storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      currentUser = JSON.parse(storedUser)
    }

    // Login function
    service.login = (credentials) =>
      $http.post(API_URL + "/token/", credentials).then((response) => {
        // Store the token
        localStorage.setItem("token", response.data.access)
        localStorage.setItem("refreshToken", response.data.refresh)

        // Get user details
        return service.getUserDetails()
      })

    // Get user details
    service.getUserDetails = () =>
      $http.get(API_URL + "/users/me/").then((response) => {
        currentUser = response.data
        localStorage.setItem("currentUser", JSON.stringify(currentUser))
        return currentUser
      })

    // Register function
    service.register = (userData) => $http.post(API_URL + "/users/", userData)

    // Logout function
    service.logout = () => {
      localStorage.removeItem("token")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("currentUser")
      currentUser = null
      $location.path("/")
    }

    // Check if user is authenticated
    service.isAuthenticated = () => !!service.getToken()

    // Get the stored token
    service.getToken = () => localStorage.getItem("token")

    // Get the current user
    service.getCurrentUser = () => currentUser

    // Check if user is admin or director
    service.isAdminOrDirector = () =>
      currentUser && (currentUser.user_type === "admin" || currentUser.user_type === "director")

    // Check if user is employee
    service.isEmployee = () => currentUser && currentUser.user_type === "employee"

    // Check if user is client
    service.isClient = () => currentUser && currentUser.user_type === "client"

    // Check authentication status
    service.checkAuth = () => {
      var deferred = $q.defer()

      if (service.isAuthenticated()) {
        if (!currentUser) {
          service
            .getUserDetails()
            .then(() => {
              deferred.resolve(true)
            })
            .catch(() => {
              service.logout()
              deferred.reject()
              $location.path("/")
            })
        } else {
          deferred.resolve(true)
        }
      } else {
        service.logout()
        deferred.reject()
        $location.path("/")
      }

      return deferred.promise
    }

    // Refresh token
    service.refreshToken = () => {
      var refreshToken = localStorage.getItem("refreshToken")

      if (!refreshToken) {
        return $q.reject("No refresh token available")
      }

      return $http.post(API_URL + "/token/refresh/", { refresh: refreshToken }).then((response) => {
        localStorage.setItem("token", response.data.access)
        return response.data.access
      })
    }

    return service
  },
])

