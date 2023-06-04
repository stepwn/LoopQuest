(function() {
    var self = this;
    window.dpadcontrol = self;
    // Check if the device is mobile
    self.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if(self.isMobile) {
        // Create dpad element
        var canvas = document.getElementById('canvas');
        var dpad = document.createElement('div');
        dpad.id = 'dpad';
        dpad.style.position = 'absolute';
        dpad.style.right = '20vw'; // 10% from the right side of the viewport
        dpad.style.bottom = '20vh'; // 10% from the bottom of the viewport
        dpad.style.width = '100px'; // Set your desired size
        dpad.style.height = '100px';
        dpad.style.zIndex = '9999';
        dpad.style.display = 'flex';
        dpad.style.flexDirection = 'column';
        dpad.style.alignItems = 'center';
        dpad.style.justifyContent = 'center';
        dpad.style.borderRadius = '50%';
        dpad.style.backgroundColor = 'rgba(0,0,0,0.5)'; // Set your desired style
        dpad.style.display = "none";

        // Create buttons for each direction
        var directions = ['^', '<', '>', 'v'];
        var buttonStyles = {
            '^':    { position: 'absolute', top: '5px', left: '35px' },
            'v':  { position: 'absolute', bottom: '5px', left: '35px' },
            '<':  { position: 'absolute', left: '5px', top: '35px' },
            '>': { position: 'absolute', right: '5px', top: '35px' }
        };

        directions.forEach(function(direction) {
            var button = document.createElement('button');
            button.id = 'dpad-' + direction;
            button.textContent = direction;
            button.style.position = buttonStyles[direction].position;
            button.style.top = buttonStyles[direction].top || null;
            button.style.bottom = buttonStyles[direction].bottom || null;
            button.style.left = buttonStyles[direction].left || null;
            button.style.right = buttonStyles[direction].right || null;
            button.style.backgroundColor = 'rgba(255,255,255,0.5)';
            button.style.borderRadius = '50%';
            button.style.width = '30px';
            button.style.height = '30px';
            button.addEventListener('touchstart', function(event) {
                event.preventDefault();
                console.log('Attack: ' + direction);
                var x = 0,
                    y = 0;
                switch(direction){
                    case '<':
                        x = -1;
                        break;
                    case '>':
                        x = 1;
                        break;
                    case '^':
                        y = -1;
                        break;
                    case 'v':
                        y = 1;
                        break;
                }
                try{
                    var entity = window.game.getEntityAt(player.gridX+x, player.gridY+y);
                    if(entity.getIsMob && !entity.isPlayer){
                        entity.addAttacker(window.game.player);
                        window.game.makePlayerAttack(entity);
                    }
                }
                catch(error){
                    // there is nothing to attack 
                }
                
            });
            dpad.appendChild(button);
        });

        // Append dpad to body
        canvas.appendChild(dpad);
    }
})();
