var app = angular.module("app")

app.service("UserService", [
  "$http",
  "API_URL",
  ($http, API_URL) => {
    var service = {}

    // Get all users
    service.getUsers = () => $http.get(API_URL + "/users/")

    // Get employees
    service.getEmployees = () => $http.get(API_URL + "/users/employees/")

    // Get a specific user
    service.getUser = (id) => $http.get(API_URL + "/users/" + id + "/")

    // Create a new user
    service.createUser = (userData) => $http.post(API_URL + "/users/", userData)

    // Update a user
    service.updateUser = (id, userData) => $http.put(API_URL + "/users/" + id + "/", userData)

    // Delete a user
    service.deleteUser = (id) => $http.delete(API_URL + "/users/" + id + "/")

    return service
  },
])

