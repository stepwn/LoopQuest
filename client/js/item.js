
define(['entity'], function(Entity) {

    var Item = Entity.extend({
        init: function(id, kind, type) {
    	    this._super(id, kind);

            this.itemKind = Types.getKindAsString(kind);
    	    this.type = type;
    	    this.wasDropped = false;
        },

        hasShadow: function() {
            return true;
        },
        use: function(player){
            window.client.sendUse(this);
            if(this.type === "weapon") {
                player.switchWeapon(this.itemKind);
                document.getElementById("weaponinventorybutton").src = this.sprite.b64icon;
            }
            else if(this.type === "armor") {
                player.armorloot_callback(this.itemKind);
                document.getElementById("armorinventorybutton").src = this.sprite.b64icon;
            }
            else{
                
            }
        },
        onLoot: function(player) {
            player.Inventory.addItem(this);
        },

        getSpriteName: function() {
            return "item-"+ this.itemKind;
        },

        getLootMessage: function() {
            return this.lootMessage;
        }
    });
    
    return Item;
});