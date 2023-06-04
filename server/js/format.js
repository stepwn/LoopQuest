
var _ = require('underscore'),
    Types = require("../../shared/js/gametypes");

(function() {
    FormatChecker = Class.extend({
        init: function() {
            this.formats = [];
            this.formats[Types.Messages.HELLO] = ['s', 'n', 'n'],
            this.formats[Types.Messages.MOVE] = ['n', 'n'],
            this.formats[Types.Messages.LOOTMOVE] = ['n', 'n', 'n'],
            this.formats[Types.Messages.AGGRO] = ['n'],
            this.formats[Types.Messages.ATTACK] = ['n'],
            this.formats[Types.Messages.HIT] = ['n'],
            this.formats[Types.Messages.HURT] = ['n'],
            this.formats[Types.Messages.CHAT] = ['s'],
            this.formats[Types.Messages.LOOT] = ['n'],
            this.formats[Types.Messages.TELEPORT] = ['n', 'n'],
            this.formats[Types.Messages.ZONE] = [],
            this.formats[Types.Messages.OPEN] = ['n'],
            this.formats[Types.Messages.CHECK] = ['n'],
            this.formats[Types.Messages.USE] = ['n','n'],
            this.formats[Types.Messages.ATTACKDIRECTION] = ['s'],
            this.formats[Types.Messages.SYNC_INVENTORY] = ['array'];
        },
        
        check: function(msg) {
            //console.log(typeof msg);
            var message = msg;
               // console.log("format.js");
                //console.log(message);
                //console.log(message[0]);
                var type = message[0],
                format = this.formats[type];
                //console.log(format);
                //message.shift();
                var restOfMessage = message.slice(1);
               // console.log(restOfMessage);
                //console.log("/format.js");
            
            if(format) {    
               // console.log('format.js returning true');
                return true;
            }
            else if(type === Types.Messages.WHO) {
                // WHO messages have a variable amount of params, all of which must be numbers.
                return message.length > 0 && _.all(message, function(param) { return _.isNumber(param) });
            }
            else if (type === Types.Messages.SYNC_INVENTORY) {
                return _.isArray(restOfMessage[0]);
            }
            else {
                console.log("format.js Unknown message type: "+type);
                return false;
            }
        }
    });

    var checker = new FormatChecker;
    
    exports.check = checker.check.bind(checker);
})();