
define(['player', 'entityfactory', 'lib/bison', 'lqentityfactory'], function(Player, EntityFactory, BISON, LQEntityFactory) {

    var GameClient = Class.extend({
        init: function(host, port) {
            this.connection = null;
            this.host = host;
            this.port = port;
    
            this.connected_callback = null;
            this.spawn_callback = null;
            this.movement_callback = null;
        
            this.handlers = [];
            this.handlers[Types.Messages.WELCOME] = this.receiveWelcome;
            this.handlers[Types.Messages.MOVE] = this.receiveMove;
            this.handlers[Types.Messages.LOOTMOVE] = this.receiveLootMove;
            this.handlers[Types.Messages.ATTACK] = this.receiveAttack;
            this.handlers[Types.Messages.SPAWN] = this.receiveSpawn;
            this.handlers[Types.Messages.DESPAWN] = this.receiveDespawn;
            this.handlers[Types.Messages.SPAWN_BATCH] = this.receiveSpawnBatch;
            this.handlers[Types.Messages.HEALTH] = this.receiveHealth;
            this.handlers[Types.Messages.CHAT] = this.receiveChat;
            this.handlers[Types.Messages.EQUIP] = this.receiveEquipItem;
            this.handlers[Types.Messages.DROP] = this.receiveDrop;
            this.handlers[Types.Messages.TELEPORT] = this.receiveTeleport;
            this.handlers[Types.Messages.DAMAGE] = this.receiveDamage;
            this.handlers[Types.Messages.POPULATION] = this.receivePopulation;
            this.handlers[Types.Messages.LIST] = this.receiveList;
            this.handlers[Types.Messages.DESTROY] = this.receiveDestroy;
            this.handlers[Types.Messages.KILL] = this.receiveKill;
            this.handlers[Types.Messages.HP] = this.receiveHitPoints;
            this.handlers[Types.Messages.BLINK] = this.receiveBlink;
        
            this.useBison = false;
            this.enable();
        },
    
        enable: function() {
            this.isListening = true;
        },
    
        disable: function() {
            this.isListening = false;
        },
        
        connect: function(dispatcherMode) {
            //var url = "wss://play.loopquest.io:8443";
            var url = "ws://"+ this.host +":"+ this.port +"/",
                self = this;
            
            console.log("Trying to connect to server : "+url);

            if(window.MozWebSocket) {
                this.connection = new MozWebSocket(url);
            } else {
                this.connection = new WebSocket(url);
            }
            
            if(dispatcherMode) {
                this.connection.onmessage = function(e) {
                    var reply = JSON.parse(e.data);

                    if(reply.status === 'OK') {
                        self.dispatched_callback(reply.host, reply.port);
                    } else if(reply.status === 'FULL') {
                        alert("LoopQuest is currently at maximum player population. Please retry later.");
                    } else {
                        alert("Unknown error while connecting to LoopQuest.");
                    }
                };
            } else {
                this.connection.onopen = function(e) {
                    console.log("Connected to server "+self.host+":"+self.port);
                };

                this.connection.onmessage = function(e) {
                    if(e.data === "go") {
                        if(self.connected_callback) {
                            self.connected_callback();
                        }
                        return;
                    }
                    if(e.data === 'timeout') {
                        self.isTimeout = true;
                        return;
                    }
                    
                    self.receiveMessage(e.data);
                };

                this.connection.onerror = function(e) {
                    console.log(e, true);
                };

                this.connection.onclose = function() {
                    console.log("Connection closed");
                    $('#container').addClass('error');
                    
                    if(self.disconnected_callback) {
                        if(self.isTimeout) {
                            self.disconnected_callback("You have been disconnected for being inactive for too long");
                        } else {
                            self.disconnected_callback("The connection to LoopQuest has been lost");
                        }
                    }
                };
            }
        },

        sendMessage: function(json) {
            var data;
            if(this.connection.readyState === 1) {
                if(this.useBison) {
                    data = BISON.encode(json);
                } else {
                    data = JSON.stringify(json);
                }
                console.log("gameclient.js");
                console.log(data);
                console.log(json);
                this.connection.send(data);
                console.log('/gameclient.js');
            }
        },

        receiveMessage: function(message) {
            var action;
            //console.log(message);
            if(this.isListening) {
                if(this.useBison) {
                    var data = BISON.decode(message);
                    this.handleData(data);
                } 
                else if (message instanceof Blob) {
                    var reader = new FileReader();
                    reader.onload = function() {
                        var text = reader.result;
                        //console.log(text);
                    };
                    reader.readAsText(message);
                } else {
                    // Existing code to handle non-Blob messages
                    try {
                        var data = JSON.parse(message);
                        this.handleData(data);
                    } catch (e) {
                        console.error("Error parsing JSON:", e);
                    }
                }
            }
        },
        
        handleData: function(data) {
            console.log("data: ");
            console.log(data);
            if(data instanceof Array) {
                if(data[0] instanceof Array) {
                    // Multiple actions received
                    this.receiveActionBatch(data);
                } else {
                    // Only one action received
                    this.receiveAction(data);
                }
            }
        },
    
        receiveAction: function(data) {
            var action = data[0];
            if(this.handlers[action] && _.isFunction(this.handlers[action])) {
                this.handlers[action].call(this, data);
            }
            else {
                console.log("Unknown action : " + action);
            }
        },
    
        receiveActionBatch: function(actions) {
            var self = this;

            _.each(actions, function(action) {
                self.receiveAction(action);
            });
        },
    
        receiveWelcome: function(data) {
            var id = data[1],
                name = data[2],
                x = data[3],
                y = data[4],
                hp = data[5];
        
            if(this.welcome_callback) {
                this.welcome_callback(id, name, x, y, hp);
            }
        },
    
        receiveMove: function(data) {
            var id = data[1],
                x = data[2],
                y = data[3];
        
            if(this.move_callback) {
                this.move_callback(id, x, y);
            }
        },
    
        receiveLootMove: function(data) {
            var id = data[1], 
                item = data[2];
        
            if(this.lootmove_callback) {
                this.lootmove_callback(id, item);
            }
        },
    
        receiveAttack: function(data) {
            var attacker = data[1], 
                target = data[2];
        
            if(this.attack_callback) {
                this.attack_callback(attacker, target);
            }
        },
    
        receiveSpawn: function(data) {
            console.log("gameCLient data spawn: ", data);
            try{
                var stateData = data[1].stateobj;
                //console.log(stateData);
                if(stateData != undefined){
                    console.log(stateData);
                    var data = data[1].state;
                    var id = data[0],
                        kind = data[1],
                        x = data[2],
                        y = data[3],
                        skin,
                        entityType;
                    if(stateData.type != undefined){
                        entityType = stateData.type;
                    }
                }else{
                    var data = data;
                    var id = data[1],
                    kind = data[2],
                    x = data[3],
                    y = data[4],
                    skin,
                    entityType;
                }
            } catch(e){
                var id = data[1],
                kind = data[2],
                x = data[3],
                y = data[4],
                skin,
                entityType;
            }
            console.log("data",data);
            // handle new items
            if(entityType != undefined && entityType != null){
                console.log("New Item!");
                var item = LQEntityFactory.createEntity(kind, id);
                if(this.spawn_item_callback) {
                    this.spawn_item_callback(item, x, y);
                }
            } // handle legacy
            else if(Types.isItem(kind)) {
                var item = EntityFactory.createEntity(kind, id);
            
                if(this.spawn_item_callback) {
                    this.spawn_item_callback(item, x, y);
                }
            } else if(Types.isChest(kind)) {
                var item = EntityFactory.createEntity(kind, id);
            
                if(this.spawn_chest_callback) {
                    this.spawn_chest_callback(item, x, y);
                }
            } else {
                var name, orientation, target, weapon, armor;
            
                if (Types.isPlayer(kind)) {
                    console.log("its a player");
                    name = data[4];
                    orientation = data[5];
                    armor = data[6];
                    weapon = data[7];
                    
                    target = stateData.target;
                    skin = stateData.skin;
                    ens = stateData.ENS;
                    
                    console.log("gameclient player data:", data);
                  }
                else if(Types.isMob(kind)) {
                    orientation = data[5];
                    if(data.length > 6) {
                        target = data[6];
                    }
                }

                var character = EntityFactory.createEntity(kind, id, name);
            
                if(character instanceof Player) {
                    character.weaponName = Types.getKindAsString(weapon);
                    character.spriteName = Types.getKindAsString(armor);
                    if(skin != undefined && skin != null && skin != ""){
                        console.log("creating character with skin ", skin);
                        character.skin = (skin);
                        character.switchSkin(skin);
                    }
                }
            
                if(this.spawn_character_callback) {
                    this.spawn_character_callback(character, x, y, orientation, target,skin);
                }
            }
        },
    
        receiveDespawn: function(data) {
            var id = data[1];
        
            if(this.despawn_callback) {
                this.despawn_callback(id);
            }
        },
    
        receiveHealth: function(data) {
            var points = data[1],
                isRegen = false;
        
            if(data[2]) {
                isRegen = true;
            }
        
            if(this.health_callback) {
                this.health_callback(points, isRegen);
            }
        },
    
        receiveChat: function(data) {
            var id = data[1],
                text = data[2];
            window.ChatLog.addMessage(text,window.game.entities[id].name);
            if(this.chat_callback) {
                this.chat_callback(id, text);
            }
        },
    
        receiveEquipItem: function(data) {
            var id = data[1],
                itemKind = data[2];
        
            if(this.equip_callback) {
                this.equip_callback(id, itemKind);
            }
        },
    
        receiveDrop: function(data) {
            var mobId = data[1],
                id = data[2],
                kind = data[3];
        
            var item = EntityFactory.createEntity(kind, id);
            item.wasDropped = true;
            item.playersInvolved = data[4];
        
            if(this.drop_callback) {
                this.drop_callback(item, mobId);
            }
        },
    
        receiveTeleport: function(data) {
            var id = data[1],
                x = data[2],
                y = data[3];
        
            if(this.teleport_callback) {
                this.teleport_callback(id, x, y);
            }
        },
    
        receiveDamage: function(data) {
            var id = data[1],
                dmg = data[2];
        
            if(this.dmg_callback) {
                this.dmg_callback(id, dmg);
            }
        },
    
        receivePopulation: function(data) {
            var worldPlayers = data[1],
                totalPlayers = data[2];
        
            if(this.population_callback) {
                this.population_callback(worldPlayers, totalPlayers);
            }
        },
    
        receiveKill: function(data) {
            var mobKind = data[1];
        
            if(this.kill_callback) {
                this.kill_callback(mobKind);
            }
        },
    
        receiveList: function(data) {
            data.shift();
        
            if(this.list_callback) {
                this.list_callback(data);
            }
        },
    
        receiveDestroy: function(data) {
            var id = data[1];
        
            if(this.destroy_callback) {
                this.destroy_callback(id);
            }
        },
    
        receiveHitPoints: function(data) {
            var maxHp = data[1];
        
            if(this.hp_callback) {
                this.hp_callback(maxHp);
            }
        },
    
        receiveBlink: function(data) {
            var id = data[1];
        
            if(this.blink_callback) {
                this.blink_callback(id);
            }
        },
        
        onDispatched: function(callback) {
            this.dispatched_callback = callback;
        },
        onSyncInventory: function(callback) {
            this.syncInventory_callback = callback;
          },
        onConnected: function(callback) {
            this.connected_callback = callback;
        },
        
        onDisconnected: function(callback) {
            this.disconnected_callback = callback;
        },

        onWelcome: function(callback) {
            this.welcome_callback = callback;
        },

        onSpawnCharacter: function(callback) {
            this.spawn_character_callback = callback;
        },
    
        onSpawnItem: function(callback) {
            this.spawn_item_callback = callback;
        },
    
        onSpawnChest: function(callback) {
            this.spawn_chest_callback = callback;
        },

        onDespawnEntity: function(callback) {
            this.despawn_callback = callback;
        },

        onEntityMove: function(callback) {
            this.move_callback = callback;
        },

        onEntityAttack: function(callback) {
            this.attack_callback = callback;
        },
    
        onPlayerChangeHealth: function(callback) {
            this.health_callback = callback;
        },
    
        onPlayerEquipItem: function(callback) {
            this.equip_callback = callback;
        },
    
        onPlayerMoveToItem: function(callback) {
            this.lootmove_callback = callback;
        },
    
        onPlayerTeleport: function(callback) {
            this.teleport_callback = callback;
        },
    
        onChatMessage: function(callback) {
            this.chat_callback = callback;
        },
    
        onDropItem: function(callback) {
            this.drop_callback = callback;
        },
    
        onPlayerDamageMob: function(callback) {
            this.dmg_callback = callback;
        },
    
        onPlayerKillMob: function(callback) {
            this.kill_callback = callback;
        },
    
        onPopulationChange: function(callback) {
            this.population_callback = callback;
        },
    
        onEntityList: function(callback) {
            this.list_callback = callback;
        },
    
        onEntityDestroy: function(callback) {
            this.destroy_callback = callback;
        },
    
        onPlayerChangeMaxHitPoints: function(callback) {
            this.hp_callback = callback;
        },
    
        onItemBlink: function(callback) {
            this.blink_callback = callback;
        },

        sendHello: function(player) {
            this.sendMessage([Types.Messages.HELLO,
                              player.name,
                              Types.getKindFromString(player.getSpriteName()),
                              Types.getKindFromString(player.getWeaponName()),
                            player.skin]);
        },

        sendMove: function(x, y) {
            this.sendMessage([Types.Messages.MOVE,
                              x,
                              y]);
        },
    
        sendLootMove: function(item, x, y) {
            this.sendMessage([Types.Messages.LOOTMOVE,
                              x,
                              y,
                              item.id]);
        },
    
        sendAggro: function(mob) {
            this.sendMessage([Types.Messages.AGGRO,
                              mob.id]);
        },
    
        sendAttack: function(mob) {
            this.sendMessage([Types.Messages.ATTACK,
                              mob.id]);
        },

        sendAttackDirection: function(direction) {
            this.sendMessage([Types.Messages.ATTACKDIRECTION,
                              direction]);
        },
    
        sendHit: function(mob) {
            this.sendMessage([Types.Messages.HIT,
                              mob.id]);
        },
    
        sendHurt: function(mob) {
            this.sendMessage([Types.Messages.HURT,
                              mob.id]);
        },
    
        sendChat: function(text) {
            this.sendMessage([Types.Messages.CHAT,
                              text]);
        },
    
        sendLoot: function(item) {
            this.sendMessage([Types.Messages.LOOT,
                              item.id]);
        },

        sendUse: function(item) {
            console.log("using item");
            this.sendMessage([Types.Messages.USE,
                              item.id]);
        },
        sendSkinSwap: function(skin) {
            console.log("swapping Skin");
            this.sendMessage(["skinSwap",
                              skin]);
        },
        sendTeleport: function(x, y) {
            this.sendMessage([Types.Messages.TELEPORT,
                              x,
                              y]);
        },
    
        sendWho: function(ids) {
            ids.unshift(Types.Messages.WHO);
            this.sendMessage(ids);
        },
    
        sendZone: function() {
            this.sendMessage([Types.Messages.ZONE]);
        },
    
        sendOpen: function(chest) {
            this.sendMessage([Types.Messages.OPEN,
                              chest.id]);
        },
    
        sendCheck: function(id) {
            this.sendMessage([Types.Messages.CHECK,
                              id]);
        }
    });
    
    return GameClient;
});