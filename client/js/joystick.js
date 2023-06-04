// joystick.js
(function() {
    var self = this;
    window.jscontrol = self;
    // Check if the device is mobile
    self.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    //self.isMobile = true;
    if(self.isMobile) {
        // Create joystick element
        var joystick = document.createElement('div');
        joystick.id = 'joystick';
        joystick.style.position = 'fixed';
        joystick.style.left = '25vw'; // 10% from the left side of the viewport
        joystick.style.bottom = '25vh'; // 10% from the bottom of the viewport
        joystick.style.width = '50px'; // Set your desired size
        joystick.style.height = '50px';
        joystick.style.zIndex = '9999';
        joystick.style.backgroundColor = 'rgba(0,0,0,0.5)'; // Set your desired style
        joystick.style.borderRadius = '50%';
        joystick.style.display = 'none';
        // Time of the last sent move
        self.lastMoveTime = 0;

        // Minimum time between moves (in milliseconds)
        self.moveRate = 33;

        // Append joystick to body
        document.body.appendChild(joystick);

        // The original coordinates of the joystick.
        self.originalX = 0;
        self.originalY = 0;
        // Remember the original position of the joystick.
        self.rect = joystick.getBoundingClientRect();
        self.originalX = rect.left;
        self.originalY = rect.top;
        self.constantY;

        // The maximum distance the joystick can move in any direction.
        self.maxDistance = 50;

        // Determine the direction of the joystick movement.
        self.direction = "";

        function handleTouchStart(event) {
            // Prevent the window from scrolling.
            event.preventDefault();

            
        }

        function handleTouchMove(event) {
            // Prevent the window from scrolling.
            event.preventDefault();
        
            // Calculate the new position of the joystick.
            var touch = event.touches[0];
            
            // Calculate the delta from the joystick's center
            var x = touch.clientX - self.originalX - joystick.offsetWidth / 2;
            var y = touch.clientY - self.originalY - joystick.offsetHeight / 2;
            
            // Calculate the distance from the center
            var distance = Math.sqrt(x*x + y*y);
            
            // Check if the touch event is beyond the joystick's boundary
            if (distance > maxDistance) {
                x = (x / distance) * maxDistance;
                y = (y / distance) * maxDistance;
            }
            
            // Determine the direction of the movement
            var deadzone = 40;
            if (distance > deadzone) {
                var absX = Math.abs(x);
                var absY = Math.abs(y);
                var diagZone = 0; // Ratio to define the diagonal zone. Adjust this as needed.

                if (absY > absX * (1 + diagZone)) {
                    // Y dominant (up or down)
                    self.direction = y > 0 ? 'down' : 'up';
                } else if (absX > absY * (1 + diagZone)) {
                    // X dominant (left or right)
                    self.direction = x > 0 ? 'right' : 'left';
                } else {
                    // Diagonal area, set direction to ""
                    self.direction = "";
                }
            } else {
                self.direction = "";
            }

            
                //console.log(self.direction);
            
            // Move the joystick
            joystick.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        }

        function handleTouchEnd(event) {
            // Return the joystick to its original position.
            joystick.style.transform = 'translate(0px, 0px)';
            self.direction = "";

            // Send a stop command to the game client.
           // window.client.sendMove(window.player.gridX, window.player.gridY);
        }


        // Add event listeners
        joystick.addEventListener('touchstart', handleTouchStart);
        joystick.addEventListener('touchmove', handleTouchMove);
        joystick.addEventListener('touchend', handleTouchEnd);
        console.log("added joystick");
    }
})();
