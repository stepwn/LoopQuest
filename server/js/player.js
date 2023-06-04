var fs = require('fs');
var path = require('path');
var cls = require("./lib/class"),
    _ = require("underscore"),
    Messages = require("./message"),
    Utils = require("./utils"),
    Properties = require("./properties"),
    Formulas = require("./formulas"),
    check = require("./format").check,
    Types = require("../../shared/js/gametypes"),
    Item = require("./item.js"),
    Inventory = require('./inventory.js');

    module.exports = Player = Character.extend({
        init: function(connection, worldServer,NFTs) {
         console.log('Player created with NFTs:', NFTs);
            
        var self = this;
        this.NFTs = NFTs;
        this.server = worldServer;
        this.connection = connection;

        this.id = connection._id;
        console.log(this.id);
        this._super(this.connection._id, "player", Types.Entities.WARRIOR, 0, 0, "");
        this.inventory = new Inventory();
        try{
            this.nfts = this.connection._session.nfts;
            // Load the integrated NFTs data
            var integratedNFTsPath = path.join(__dirname, '..', '../shared', 'integratedNFTs.json');
            var integratedNFTsData = fs.readFileSync(integratedNFTsPath, 'utf8');
            var integratedNFTs = JSON.parse(integratedNFTsData);
            // Iterate through the user's NFTs and add them to the inventory
            for (var i = 0; i < this.nfts.length; i++) {
                var nft = this.nfts[i];
                var itemKind;
                var nftData = integratedNFTs[nft];
                console.log(nftData);
                console.log(nftData.type);
                // Determine the item kind based on the NFT data
                if (nftData.type === 'music') {
                    console.log("ismusic");
                    itemKind = Types.Entities.MUSICBOX;
                } else {
                    // Handle other types of NFTs
                }
            
                var item = new Item(nft, itemKind, 0, 0);
                this.inventory.addItem(item);
                console.log(this.inventory);
            }
        } catch(error){
            console.log(error);
        }
        this.hasEnteredGame = false;
        this.isDead = false;
        this.haters = {};
        this.lastCheckpoint = null;
        this.formatChecker = new FormatChecker();
        this.disconnectTimeout = null;
        
        this.connection.onMessage(function(message) {
            message = JSON.parse(message);
            var action = parseInt(message[0]);
            if(!action){
                action = message[0];
            }
            
            //console.log("Received: "+message);
            //console.log("Received: "+message);
            if(!check(message)) {
                self.connection.close("Invalid "+Types.getMessageTypeAsString(action)+" message format: "+message);
                return;
            }
            
            if(!self.hasEnteredGame && action !== Types.Messages.HELLO) { // HELLO must be the first message
                self.connection.close("Invalid handshake message: "+message);
                return;
            }
            if(self.hasEnteredGame && !self.isDead && action === Types.Messages.HELLO) { // HELLO can be sent only once
                self.connection.close("Cannot initiate handshake twice: "+message);
                return;
            }
            
            self.resetTimeout();
            
            if(action === Types.Messages.HELLO) {
                var name = Utils.sanitize(message[1]);
                
                // If name was cleared by the sanitizer, give a default name.
                // Always ensure that the name is not longer than a maximum length.
                // (also enforced by the maxlength attribute of the name input element).
                self.name = (name === "") ? "lorem ipsum" : name.substr(0, 15);
                
                self.kind = Types.Entities.WARRIOR;
                console.log(message[2]);
                self.equipArmor(message[2]);
                self.equipSkin(message[4]);
                self.equipWeapon(message[3]);
                console.log("equipping weapon ", message[3]);
                self.orientation = Utils.randomOrientation();
                self.updateHitPoints();
                self.updatePosition();
                
                self.server.addPlayer(self);
                self.server.enter_callback(self);

                self.send([Types.Messages.WELCOME, self.id, self.name, self.x, self.y, self.hitPoints]);
                //self.send([Types.Messages.SYNC_INVENTORY, self.inventory]);
                self.hasEnteredGame = true;
                self.isDead = false;
            }
            else if(action === Types.Messages.WHO) {
                if (Array.isArray(message)) {
                    message.shift();
                    self.server.pushSpawnsToPlayer(self, message);
                } else {
                    console.error('Expected message to be an array, got:', typeof message);
                }
            }
            else if(action === Types.Messages.ZONE) {
                self.zone_callback();
            }
            else if(action === Types.Messages.CHAT) {
                var msg = Utils.sanitize(message[1]);
                
                // Sanitized messages may become empty. No need to broadcast empty chat messages.
                if(msg && msg !== "") {
                    msg = msg.substr(0, 60); // Enforce maxlength of chat input
                    self.broadcastToZone(new Messages.Chat(self, msg), false);
                    // Store the message, sender, and timestamp
                    var chatLogEntry = {
                        message: msg,
                        sender: self.name, // Assuming `self.id` is the sender's identifier
                        timestamp: new Date() // Current time in milliseconds since Unix epoch
                    };
                    self.server.chatLog.push(chatLogEntry);
                }
            }
            else if(action === Types.Messages.MOVE) {
                if(self.move_callback) {
                    var x = message[1],
                        y = message[2];
                    
                    if(self.server.isValidPosition(x, y)) {
                        self.setPosition(x, y);
                        self.clearTarget();
                        
                        self.broadcast(new Messages.Move(self));
                        self.move_callback(self.x, self.y);
                    }
                }
            }
            else if(action === Types.Messages.LOOTMOVE) {
                if(self.lootmove_callback) {
                    self.setPosition(message[1], message[2]);
                    
                    var item = self.server.getEntityById(message[3]);
                    if(item) {
                        self.clearTarget();

                        self.broadcast(new Messages.LootMove(self, item));
                        self.lootmove_callback(self.x, self.y);
                    }
                }
            }
            else if(action === Types.Messages.AGGRO) {
                if(self.move_callback) {
                    self.server.handleMobHate(message[1], self.id, 5);
                }
            }
            else if(action === Types.Messages.ATTACK) {
                var mob = self.server.getEntityById(message[1]);
                
                if(mob) {
                    self.setTarget(mob);
                    self.server.broadcastAttacker(self);
                }
            }
            else if(action === Types.Messages.HIT) {
                var mob = self.server.getEntityById(message[1]);
                if(mob) {
                    var dmg = Formulas.dmg(self.weaponLevel, mob.armorLevel);
                    
                    if(dmg > 0) {
                        mob.receiveDamage(dmg, self.id);
                        self.server.handleMobHate(mob.id, self.id, dmg);
                        self.server.handleHurtEntity(mob, self, dmg);
                    }
                }
            }
            else if(action === Types.Messages.HURT) {
                var mob = self.server.getEntityById(message[1]);
                if(mob && self.hitPoints > 0) {
                    self.hitPoints -= Formulas.dmg(mob.weaponLevel, self.armorLevel);
                    self.server.handleHurtEntity(self);
                    
                    if(self.hitPoints <= 0) {
                        self.isDead = true;
                        if(self.firepotionTimeout) {
                            clearTimeout(self.firepotionTimeout);
                        }
                    }
                }
            }
            else if(action === "swapSkin") {
                if(message[1] in self.NFTs){
                    self.skin = message[1];
                }
            }
            else if(action === Types.Messages.LOOT) {
                var item = self.server.getEntityById(message[1]);
                
                if(item) {
                    var kind = item.kind;
                    
                    if(Types.isItem(kind)) {
                        self.broadcast(item.despawn());
                        //self.server.removeEntity(item);
                        
                       self.inventory.addItem(item);
                    }
                }
            }
            else if(action === Types.Messages.USE) {
                var itemId = message[1];
                var item = null;
                
                // Loop through the inventory to find the item
                for (var i = 0; i < self.inventory.slots.length; i++) {
                    if (self.inventory.slots[i].id === itemId) {
                    item = self.inventory.slots[i];
                    break;
                    }
                }
                
                if (item) {
                    //console.log(item);
                    var kind = item.kind;
                    self.inventory.removeItem(item);
                    //console.log('item used');
                    if(Types.isItem(kind)) {
                        self.broadcast(item.despawn());
                        self.server.removeEntity(item);
                        
                        if(kind === Types.Entities.FIREPOTION) {
                            self.updateHitPoints();
                            self.broadcast(self.equip(Types.Entities.FIREFOX));
                            self.firepotionTimeout = setTimeout(function() {
                                self.broadcast(self.equip(self.armor)); // return to normal after 15 sec
                                self.firepotionTimeout = null;
                            }, 15000);
                            self.send(new Messages.HitPoints(self.maxHitPoints).serialize());
                        } else if(Types.isHealingItem(kind)) {
                            var amount;
                            
                            switch(kind) {
                                case Types.Entities.FLASK: 
                                    amount = 40;
                                    break;
                                case Types.Entities.BURGER: 
                                    amount = 100;
                                    break;
                            }
                            
                            if(!self.hasFullHealth()) {
                                
                                self.regenHealthBy(amount);
                                self.server.pushToPlayer(self, self.health());
                            }
                        } else if(Types.isArmor(kind) || Types.isWeapon(kind)) {
                            self.equipItem(item);
                            self.broadcast(self.equip(kind));
                        }
                    }
                }
            }
            else if(action === Types.Messages.TELEPORT) {
                var x = message[1],
                    y = message[2];
                
                if(self.server.isValidPosition(x, y)) {
                    self.setPosition(x, y);
                    self.clearTarget();
                    
                    self.broadcast(new Messages.Teleport(self));
                    
                    self.server.handlePlayerVanish(self);
                    self.server.pushRelevantEntityListTo(self);
                }
            }
            else if(action === Types.Messages.ATTACKDIRECTION) {
                var direction = message[1];
                
                // Get the coordinates of the grid cell in the direction of the attack
                var targetX = player.x + direction.x;
                var targetY = player.y + direction.y;
                
                // Get the entity at those coordinates
                var targetEntity = self.getEntityAt(targetX, targetY);
                
                if(targetEntity && targetEntity instanceof Mob) {
                    // If there's an entity in the attack direction and it's a Mob, attack it
                    player.attack(targetEntity);
                } else {
                    // If there's no Mob in the direction of the attack, perform an empty attack
                    player.attack(null);
                }
                
            }
            else if(action === Types.Messages.OPEN) {
                var chest = self.server.getEntityById(message[1]);
                if(chest && chest instanceof Chest) {
                    self.server.handleOpenedChest(chest, self);
                }
            }
            else if(action === Types.Messages.CHECK) {
                var checkpoint = self.server.map.getCheckpoint(message[1]);
                if(checkpoint) {
                    self.lastCheckpoint = checkpoint;
                }
            }
            else {
                if(self.message_callback) {
                    self.message_callback(message);
                }
            }
        });
        
        this.connection.onClose(function() {
            if(self.firepotionTimeout) {
                clearTimeout(self.firepotionTimeout);
            }
            clearTimeout(self.disconnectTimeout);
            if(self.exit_callback) {
                self.exit_callback();
            }
        });
        
        this.connection.sendUTF8("go"); // Notify client that the HELLO/WELCOME handshake can start
    },
    
    destroy: function() {
        var self = this;
        
        this.forEachAttacker(function(mob) {
            mob.clearTarget();
        });
        this.attackers = {};
        
        this.forEachHater(function(mob) {
            mob.forgetPlayer(self.id);
        });
        this.haters = {};
    },
    
    getState: function() {
        var basestate = this._getBaseState(),
            state = [this.name, this.orientation, this.armor, this.weapon];
    
        var extendedState = {
            target: this.target,
            skin: this.skin,
            ENS: this.ENS
        };
    
        console.log(basestate.concat(extendedState));
        return {
            state: basestate.concat(state),
            stateobj: extendedState
        };
    },
    
    
    
    send: function(message) {
        //console.log(message);
        //console.log(this.connection);
        this.connection.send(message);
    },
    
    broadcast: function(message, ignoreSelf) {
        if(this.broadcast_callback) {
            this.broadcast_callback(message, ignoreSelf === undefined ? true : ignoreSelf);
        }
    },
    
    broadcastToZone: function(message, ignoreSelf) {
        if(this.broadcastzone_callback) {
            this.broadcastzone_callback(message, ignoreSelf === undefined ? true : ignoreSelf);
        }
    },
    
    onExit: function(callback) {
        this.exit_callback = callback;
    },
    
    onMove: function(callback) {
        this.move_callback = callback;
    },
    
    onLootMove: function(callback) {
        this.lootmove_callback = callback;
    },
    
    onZone: function(callback) {
        this.zone_callback = callback;
    },
    
    onOrient: function(callback) {
        this.orient_callback = callback;
    },
    
    onMessage: function(callback) {
        this.message_callback = callback;
    },
    
    onBroadcast: function(callback) {
        this.broadcast_callback = callback;
    },
    
    onBroadcastToZone: function(callback) {
        this.broadcastzone_callback = callback;
    },
    
    equip: function(item) {
        return new Messages.EquipItem(this, item);
    },
    
    addHater: function(mob) {
        if(mob) {
            if(!(mob.id in this.haters)) {
                this.haters[mob.id] = mob;
            }
        }
    },
    
    removeHater: function(mob) {
        if(mob && mob.id in this.haters) {
            delete this.haters[mob.id];
        }
    },
    
    forEachHater: function(callback) {
        _.each(this.haters, function(mob) {
            callback(mob);
        });
    },
    
    equipArmor: function(kind) {
        this.armor = kind;
        this.armorLevel = Properties.getArmorLevel(kind);
    },

    equipSkin: function(skin) {
        this.skin = skin;
        console.log("euipped skin: ", this.skin);
        //this.armorLevel = Properties.getArmorLevel(kind);
    },
    
    equipWeapon: function(kind) {
        this.weapon = kind;
        this.weaponLevel = Properties.getWeaponLevel(kind);
    },
    
    equipItem: function(item) {
        if(item) {
            //console.log(this.name + " equips " + Types.getKindAsString(item.kind));
            console.log(this.name + " equips " + Types.getKindAsString(item.kind));
            if(Types.isArmor(item.kind)) {
                this.equipArmor(item.kind);
                this.updateHitPoints();
                this.send(new Messages.HitPoints(this.maxHitPoints).serialize());
            } else if(Types.isWeapon(item.kind)) {
                this.equipWeapon(item.kind);
            }
        }
    },
    
    updateHitPoints: function() {
        this.resetHitPoints(Formulas.hp(this.armorLevel));
    },
    
    updatePosition: function() {
        if(this.requestpos_callback) {
            var pos = this.requestpos_callback();
            this.setPosition(pos.x, pos.y);
        }
    },
    
    onRequestPosition: function(callback) {
        this.requestpos_callback = callback;
    },
    
    resetTimeout: function() {
        clearTimeout(this.disconnectTimeout);
        this.disconnectTimeout = setTimeout(this.timeout.bind(this), 1000 * 60 * 15); // 15 min.
    },
    
    timeout: function() {
        this.connection.sendUTF8("timeout");
        this.connection.close("Player was idle for too long");
    }
});