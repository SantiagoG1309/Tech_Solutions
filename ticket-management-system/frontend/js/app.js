// Declare angular before using it
var angular = window.angular

// Define the AngularJS application
var app = angular.module("ticketApp", ["ngRoute"])

// Configure routes
app.config([
  "$routeProvider",
  ($routeProvider) => {
    $routeProvider
      .when("/", {
        templateUrl: "templates/login.html",
        controller: "AuthController",
        controllerAs: "auth",
      })
      .when("/register", {
        templateUrl: "templates/register.html",
        controller: "AuthController",
        controllerAs: "auth",
      })
      .when("/dashboard", {
        templateUrl: "templates/dashboard.html",
        controller: "DashboardController",
        controllerAs: "dashboard",
        resolve: {
          auth: ["AuthService", (AuthService) => AuthService.checkAuth()],
        },
      })
      .when("/tickets", {
        templateUrl: "templates/tickets.html",
        controller: "TicketController",
        controllerAs: "ticket",
        resolve: {
          auth: ["AuthService", (AuthService) => AuthService.checkAuth()],
        },
      })
      .when("/tickets/new", {
        templateUrl: "templates/ticket-form.html",
        controller: "TicketController",
        controllerAs: "ticket",
        resolve: {
          auth: ["AuthService", (AuthService) => AuthService.checkAuth()],
        },
      })
      .when("/tickets/:id", {
        templateUrl: "templates/ticket-detail.html",
        controller: "TicketController",
        controllerAs: "ticket",
        resolve: {
          auth: ["AuthService", (AuthService) => AuthService.checkAuth()],
        },
      })
      .when("/users", {
        templateUrl: "templates/users.html",
        controller: "UserController",
        controllerAs: "user",
        resolve: {
          auth: ["AuthService", (AuthService) => AuthService.checkAuth()],
          adminOrDirector: [
            "AuthService",
            "$location",
            (AuthService, $location) => {
              if (!AuthService.isAdminOrDirector()) {
                $location.path("/dashboard")
                return false
              }
              return true
            },
          ],
        },
      })
      .when("/profile", {
        templateUrl: "templates/profile.html",
        controller: "UserController",
        controllerAs: "user",
        resolve: {
          auth: ["AuthService", (AuthService) => AuthService.checkAuth()],
        },
      })
      .otherwise({
        redirectTo: "/",
      })
  },
])

// HTTP Interceptor for authentication
app.factory("AuthInterceptor", [
  "$q",
  "$location",
  "AuthService",
  ($q, $location, AuthService) => ({
    request: (config) => {
      config.headers = config.headers || {}
      var token = AuthService.getToken()
      if (token) {
        config.headers.Authorization = "Bearer " + token
      }
      return config
    },
    responseError: (response) => {
      if (response.status === 401) {
        AuthService.logout()
        $location.path("/")
      }
      return $q.reject(response)
    },
  }),
])

// Add the interceptor to the $httpProvider
app.config([
  "$httpProvider",
  ($httpProvider) => {
    $httpProvider.interceptors.push("AuthInterceptor")
  },
])

// Constants
app.constant("API_URL", "http://localhost:8000/api")

