// Database Configuration
// Change these settings to connect to different databases
module.exports = {
  database: {
    host: '192.168.1.40',     // IP of your main laptop
    port: 3306,
    user: 'testuser',
    password: 'testpass',
    database: 'ems_dbnew'
  },
  
  // Server Configuration
  server: {
    port: 3000,
    host: '0.0.0.0'  // Listen on all network interfaces (localhost + network)
    //host: '192.168.1.40'  // Listen on all network interfaces (localhost + network)
  },
  
  // ThingsBoard Configuration
  thingsboard: {
    baseUrl: 'https://thingsboard.cloud',
    username: 'rutuja.arekar@samsanlabs.com',
    password: 'Rutuja@Samsan113'
  }
}; 