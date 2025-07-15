// utils/sendRideRequestToDrivers.js

function sendRideRequestToDrivers(nearbyDrivers, rideDetails, io, driverSockets) {
    console.log("driver sockets data", driverSockets);
    console.log("nearby drivers ", nearbyDrivers);
  
    return new Promise((resolve) => {
        let currentIndex = 0;
        let isResolved = false; // Prevent multiple resolutions

        const tryNextDriver = () => {
            if (isResolved) return; // Prevent further execution if already resolved
            
            if (currentIndex >= nearbyDrivers.length) {
                console.log("❌ No drivers accepted the ride");
                isResolved = true;
                return resolve(null);
            }

            const driver = nearbyDrivers[currentIndex];
            console.log(`🔍 Trying driver at index ${currentIndex}:`, driver);

            if (!driver || !driver.id) {
                console.error(`❗ Invalid driver object at index ${currentIndex}`);
                currentIndex++;
                tryNextDriver();
                return;
            }

            const socketId = driverSockets[driver.id];

            if (!socketId) {
                console.log(`⚠️ Driver ${driver.id} is not connected (no socketId). Skipping...`);
                currentIndex++;
                tryNextDriver();
                return;
            }

            // Get the actual socket object
            const driverSocket = io.sockets.sockets.get(socketId);
            
            if (!driverSocket) {
                console.log(`⚠️ Driver socket ${socketId} not found. Skipping...`);
                currentIndex++;
                tryNextDriver();
                return;
            }

            console.log(`📤 Sending ride request to Driver ${driver.id} (Socket: ${socketId})`);
            
            // Send ride request with a unique request ID to avoid conflicts
            const requestId = `${driver.id}_${Date.now()}`;
            driverSocket.emit('rideRequest', { 
                rideDetails: rideDetails, // Wrap in rideDetails object
                requestId,
                driverId: driver.id 
            });

            const timeout = setTimeout(() => {
                if (isResolved) return;
                console.log(`⏰ Driver ${driver.id} did not respond in 30s. Trying next...`);
                
                // Remove the specific listener
                driverSocket.off('rideResponse', responseHandler);
                currentIndex++;
                tryNextDriver();
            }, 30000); // 30 seconds timeout

            const responseHandler = (response) => {
                if (isResolved) return; // Ignore if already resolved
                
                console.log(`📨 Received response from driver:`, response);
                
                if (!response || typeof response !== 'object') {
                    console.error('Invalid response format:', response);
                    return;
                }

                // Verify this response is for the current driver and request
                if (String(response.driverId) !== String(driver.id)) {
                    console.log(`Response from wrong driver. Expected: ${driver.id}, Got: ${response.driverId}`);
                    return;
                }

                clearTimeout(timeout);
                driverSocket.off('rideResponse', responseHandler);
                isResolved = true;

                if (response.accepted) {
                    console.log(`✅ Driver ${driver.id} accepted the ride.`);
                    return resolve(driver);
                } else {
                    console.log(`❌ Driver ${driver.id} rejected the ride.`);
                    currentIndex++;
                    tryNextDriver();
                }
            };

            // Listen on the specific driver's socket, not globally
            driverSocket.on('rideResponse', responseHandler);
        };

        tryNextDriver(); // start the loop
    });
}

module.exports = sendRideRequestToDrivers;