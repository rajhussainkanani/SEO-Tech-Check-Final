const http = require('http');
const os = require('os');

// Configuration
const config = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: '/health',
  method: 'GET',
  timeout: 5000,
  thresholds: {
    memory: 90, // Memory usage threshold (percentage)
    cpu: 80,    // CPU usage threshold (percentage)
    disk: 85    // Disk usage threshold (percentage)
  }
};

// Get system metrics
const getSystemMetrics = () => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

  const cpuUsage = os.loadavg()[0] * 100 / os.cpus().length;

  return {
    memory: {
      usage: memoryUsage.toFixed(2),
      total: (totalMemory / 1024 / 1024 / 1024).toFixed(2),
      free: (freeMemory / 1024 / 1024 / 1024).toFixed(2),
      status: memoryUsage < config.thresholds.memory ? 'healthy' : 'unhealthy'
    },
    cpu: {
      usage: cpuUsage.toFixed(2),
      status: cpuUsage < config.thresholds.cpu ? 'healthy' : 'unhealthy'
    },
    uptime: process.uptime()
  };
};

// Perform health check
const performHealthCheck = () => {
  const metrics = getSystemMetrics();
  
  const req = http.request(config, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          checks: {
            api: {
              status: 'healthy',
              statusCode: res.statusCode
            },
            system: metrics
          }
        }, null, 2));
        process.exit(0);
      } else {
        console.log(JSON.stringify({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          checks: {
            api: {
              status: 'unhealthy',
              statusCode: res.statusCode
            },
            system: metrics
          }
        }, null, 2));
        process.exit(1);
      }
    });
  });

  req.on('error', (err) => {
    console.log(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        api: {
          status: 'unhealthy',
          error: err.message
        },
        system: metrics
      }
    }, null, 2));
    process.exit(1);
  });

  req.on('timeout', () => {
    console.log(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        api: {
          status: 'unhealthy',
          error: 'Request timed out'
        },
        system: metrics
      }
    }, null, 2));
    req.destroy();
    process.exit(1);
  });

  // Handle process termination
  const cleanup = () => {
    req.destroy();
    process.exit(1);
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);

  req.end();
};

// Execute health check
performHealthCheck();
