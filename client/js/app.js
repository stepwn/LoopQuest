
define(['jquery', 'storage'], function($, Storage) {

    var App = Class.extend({
        init: function() {
            this.currentPage = 1;
            this.blinkInterval = null;
            this.previousState = null;
            this.isParchmentReady = true;
            this.ready = false;
            this.storage = new Storage();
            this.watchNameInputInterval = setInterval(this.toggleButton.bind(this), 100);
            this.$playButton = $('.play'),
            this.$playDiv = $('.play div');
        },
        
        setGame: function(game) {
            this.game = game;
            window.game = game;
            this.isMobile = this.game.renderer.mobile;
            //this.isMobile = false;
            this.isTablet = this.game.renderer.tablet;
            //this.isTablet = false;
            this.isDesktop = !(this.isMobile || this.isTablet);
            this.supportsWorkers = !!window.Worker;
            this.ready = true;
        },
    
        center: function() {
            window.scrollTo(0, 1);
        },
        
        canStartGame: function() {
            if(this.isDesktop) {
                return (this.game && this.game.map && this.game.map.isLoaded);
            } else {
                return this.game;
            }
        },
        
        tryStartingGame: function(username, starting_callback) {
            var self = this,
                $play = this.$playButton;
            
            if(username !== '') {
                if(!this.ready || !this.canStartGame()) {
                    if(!this.isMobile) {
                        // on desktop and tablets, add a spinner to the play button
                        $play.addClass('loading');
                    }
                    this.$playDiv.unbind('click');
                    var watchCanStart = setInterval(function() {
                        console.log("waiting...");
                        if(self.canStartGame()) {
                            setTimeout(function() {
                                if(!self.isMobile) {
                                    $play.removeClass('loading');
                                }
                            }, 1500);
                            clearInterval(watchCanStart);
                            document.getElementById('lq_logo').style.display="none";
                            self.startGame(username, starting_callback);
                        }
                    }, 100);
                } else {
                    this.$playDiv.unbind('click');
                    document.getElementById('lq_logo').style.display="none";
                    this.startGame(username, starting_callback);
                }      
            }
        },
        
        startGame: function(username, starting_callback) {
            var self = this;

            // Create a new image element
            var loadingImage = document.createElement('img');

            // Set the source of the image
            loadingImage.src = '../img/common/loading.png';

            // Apply styles to center the image in the viewport
            loadingImage.style.position = 'fixed';
            loadingImage.style.top = '50%';
            loadingImage.style.left = '50%';
            loadingImage.style.transform = 'translate(-50%, -50%)';

            // Append the image to the body of the document
            document.body.appendChild(loadingImage);
            
            if(starting_callback) {
                starting_callback();
            }
            this.hideIntro(function() {
                if(!self.isDesktop) {
                    // On mobile and tablet we load the map after the player has clicked
                    // on the PLAY button instead of loading it in a web worker.
                    self.game.loadMap();
                }
                self.start(username);
            });
        },

        start: function(username) {
            var self = this,
                firstTimePlaying = !self.storage.hasAlreadyPlayed();
            
            if(username && !this.game.started) {
                var optionsSet = false,
                    config = this.config;

                //>>includeStart("devHost", pragmas.devHost);
                if(config.local) {
                    console.log("Starting game with local dev config.");
                    this.game.setServerOptions(config.local.host, config.local.port, username);
                } else {
                    console.log("Starting game with default dev config.");
                    this.game.setServerOptions(config.dev.host, config.dev.port, username);
                }
                optionsSet = true;
                //>>includeEnd("devHost");
                
                //>>includeStart("prodHost", pragmas.prodHost);
                if(!optionsSet) {
                    console.log("Starting game with build config.");
                    this.game.setServerOptions(config.build.host, config.build.port, username);
                }
                //>>includeEnd("prodHost");

                this.center();
                this.game.run(function() {
                    var joystick = document.getElementById("dpad-walk");
                    joystick.style.display = 'block';
                    joystick.style.position = 'absolute';
                    joystick.style.left = '1vw'; // 10% from the left side of the viewport
                    joystick.style.bottom = '10vh'; // 10% from the bottom of the viewport
                    //var rect = joystick.getBoundingClientRect();
                    //window.jscontrol.originalX = rect.left;
                    //window.jscontrol.originalY = rect.top;
                    //var dpad = document.getElementById("dpad");
                    //dpad.style.display = 'block';
                    //dpad.style.position = 'absolute';
                    //dpad.style.right = '3vw'; // 10% from the right side of the viewport
                    //dpad.style.bottom = '10vh'; // 10% from the bottom of the viewport
                    
                    // set gui
                    // if body has upscaled class
                    var inv = document.getElementById('inventorybutton');
                    //inv.style.backgroundImage = "url(../img/new/invbutton.png)";
                    //inv.style.backgroundPosition = "-851px -145px";
                    //inv.style.bottom = "5vw";
                    //inv.style.right = "0px";
                    // endif

                    $('body').addClass('started');
                	if(firstTimePlaying) {
                	    self.toggleInstructions();
                	}
            	});
            }
        },

        setMouseCoordinates: function(event) {
            var mouse = this.game.mouse;
            var bc = document.getElementById("canvas");
            var scalex = this.game.renderer.scaleFactorX,
            scaley = this.game.renderer.scaleFactorY;
            // Dividing by the scale factor to get the right coordinates
            //console.log(event);
            mouse.x = (event.pageX-bc.getBoundingClientRect().x)/scalex;
            mouse.y = (event.pageY-bc.getBoundingClientRect().y)/scaley;
            

        	

            //console.log(mouse.x,mouse.y);
        },

        initHealthBar: function() {
                healthMaxWidth = document.getElementById("healthbar").clientWidth-12;
                $("#hitpoints").css('width', healthMaxWidth-12 + "px");
        	this.game.onPlayerHealthChange(function(hp, maxHp) {
        	    var barWidth = Math.round((healthMaxWidth / maxHp) * (hp > 0 ? hp : 0));
        	    $("#hitpoints").css('width', barWidth-12 + "px");
        	});

        	this.game.onPlayerHurt(this.blinkHealthBar.bind(this));
        },

        blinkHealthBar: function() {
            var $hitpoints = $('#hitpoints');

            $hitpoints.addClass('white');
            setTimeout(function() {
                $hitpoints.removeClass('white');
            }, 500)
        },

        toggleButton: function() {
            var name = $('#parchment input').val(),
                $play = $('#createcharacter .play');
    
            if(name && name.length > 0) {
                $play.removeClass('disabled');
                $('#character').removeClass('disabled');
            } else {
                $play.addClass('disabled');
                $('#character').addClass('disabled');
            }
        },

        hideIntro: function(hidden_callback) {
            clearInterval(this.watchNameInputInterval);
            $('body').removeClass('intro');
            setTimeout(function() {
                $('body').addClass('game');
                hidden_callback();
            }, 1000);
        },

        showChat: function() {
            console.log('click');
            if(this.game.started) {
                document.getElementById("chatbox").style.display = "block";
                //$('#chatbox').addClass('active');
                $('#chatinput').focus();
                //$('#chatbutton').addClass('active');
            }
        },

        hideChat: function() {
            if(this.game.started) {
                document.getElementById("chatbox").style.display = "none";
                //$('#chatbox').removeClass('active');
                $('#chatinput').blur();
                //$('#chatbutton').removeClass('active');
            }
        },

        toggleInstructions: function() {
            if($('#achievements').hasClass('active')) {
        	    this.toggleAchievements();
        	    $('#achievementsbutton').removeClass('active');
        	}
            $('#instructions').toggleClass('active');
        },

        toggleAchievements: function() {
        	if($('#instructions').hasClass('active')) {
        	    this.toggleInstructions();
        	    $('#helpbutton').removeClass('active');
        	}
            this.resetPage();
            $('#achievements').toggleClass('active');
        },

        resetPage: function() {
            var self = this,
                $achievements = $('#achievements');

            if($achievements.hasClass('active')) {
                $achievements.bind(TRANSITIONEND, function() {
                    $achievements.removeClass('page' + self.currentPage).addClass('page1');
                    self.currentPage = 1;
                    $achievements.unbind(TRANSITIONEND);
                });
            }
        },

        initEquipmentIcons: function() {
            var scale = this.game.renderer.getScaleFactor();
            var getIconPath = function(spriteName) {
              return 'img/'+ scale +'/item-' + spriteName + '.png';
            };
          
            var weapon = this.game.player.getWeaponName();
            var armor = this.game.player.getSpriteName();
          
            var weaponPath = getIconPath(weapon);
            var armorPath = getIconPath(armor);
          
            console.log(weaponPath);
          
            // Set the weapon icon
            var weaponImage = new Image();
            weaponImage.src = weaponPath;
            weaponImage.onload = function() {
              var canvas = document.createElement('canvas');
              canvas.width = 32;
              canvas.height = 32;
          
              var ctx = canvas.getContext('2d');
              ctx.drawImage(weaponImage, 0, 0, 32, 32, 0, 0, 32, 32);
          
              var weaponIconPath = canvas.toDataURL();
              document.getElementById('weaponinventorybutton').src = weaponIconPath;
            };
          
            // Set the armor icon if it is not 'firefox'
            if (armor !== 'firefox') {
              var armorImage = new Image();
              armorImage.src = armorPath;
              armorImage.onload = function() {
                var canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 32;
          
                var ctx = canvas.getContext('2d');
                ctx.drawImage(armorImage, 0, 0, 32, 32, 0, 0, 32, 32);
          
                var armorIconPath = canvas.toDataURL();
                document.getElementById('armorinventorybutton').src = armorIconPath;
              };
            }
          },
          

        hideWindows: function() {
            if($('#achievements').hasClass('active')) {
        	    this.toggleAchievements();
        	    $('#achievementsbutton').removeClass('active');
        	}
        	if($('#instructions').hasClass('active')) {
        	    this.toggleInstructions();
        	    $('#helpbutton').removeClass('active');
        	}
        	if($('body').hasClass('credits')) {
        	    this.closeInGameCredits();
        	}
        	if($('body').hasClass('about')) {
        	    this.closeInGameAbout();
        	}
            if($('body').hasClass('inventory')) {
        	    this.closeInGameInventory();
        	}
        },

        showAchievementNotification: function(id, name) {
            var $notif = $('#achievement-notification'),
                $name = $notif.find('.name'),
                $button = $('#achievementsbutton');

            $notif.removeClass().addClass('active achievement' + id);
            $name.text(name);
            if(this.game.storage.getAchievementCount() === 1) {
                this.blinkInterval = setInterval(function() {
                    $button.toggleClass('blink');
                }, 500);
            }
            setTimeout(function() {
                $notif.removeClass('active');
                $button.removeClass('blink');
            }, 5000);
        },

        displayUnlockedAchievement: function(id) {
            var $achievement = $('#achievements li.achievement' + id);

            var achievement = this.game.getAchievementById(id);
            if(achievement && achievement.hidden) {
                this.setAchievementData($achievement, achievement.name, achievement.desc);
            }
            $achievement.addClass('unlocked');
        },

        unlockAchievement: function(id, name) {
            this.showAchievementNotification(id, name);
            this.displayUnlockedAchievement(id);

            var nb = parseInt($('#unlocked-achievements').text());
            $('#unlocked-achievements').text(nb + 1);
        },

        initAchievementList: function(achievements) {
            var self = this,
                $lists = $('#lists'),
                $page = $('#page-tmpl'),
                $achievement = $('#achievement-tmpl'),
                page = 0,
                count = 0,
                $p = null;

            _.each(achievements, function(achievement) {
                count++;
    
                var $a = $achievement.clone();
                $a.removeAttr('id');
                $a.addClass('achievement'+count);
                if(!achievement.hidden) {
                    self.setAchievementData($a, achievement.name, achievement.desc);
                }
                $a.find('.twitter').attr('href', 'http://twitter.com/share?url=https%3A%2F%2FLoopQuest.io&text=I%20unlocked%20the%20%27'+ achievement.name +'%27%20achievement%20on%20LoopQuest');
                $a.show();
                $a.find('a').click(function() {
                     var url = $(this).attr('href');

                    self.openPopup('twitter', url);
                    return false;
                });
    
                if((count - 1) % 4 === 0) {
                    page++;
                    $p = $page.clone();
                    $p.attr('id', 'page'+page);
                    $p.show();
                    $lists.append($p);
                }
                $p.append($a);
            });

            $('#total-achievements').text($('#achievements').find('li').length);
        },

        initUnlockedAchievements: function(ids) {
            var self = this;
            
            _.each(ids, function(id) {
                self.displayUnlockedAchievement(id);
            });
            $('#unlocked-achievements').text(ids.length);
        },

        setAchievementData: function($el, name, desc) {
            $el.find('.achievement-name').html(name);
            $el.find('.achievement-description').html(desc);
        },

        toggleCredits: function() {
            var currentState = $('#parchment').attr('class');

            if(this.game.started) {
                $('#parchment').removeClass().addClass('credits');
                
                $('body').toggleClass('credits');
                    
                if(!this.game.player) {
                    $('body').toggleClass('death');
                }
                if($('body').hasClass('about')) {
                    this.closeInGameAbout();
                    $('#helpbutton').removeClass('active');
                }
                if($('body').hasClass('inventory')) {
                    this.closeInGameInventory();
                    $('#helpbutton').removeClass('active');
                }
            } else {
                if(currentState !== 'animate') {
                    if(currentState === 'credits') {
                        this.animateParchment(currentState, this.previousState);
                    } else {
            	        this.animateParchment(currentState, 'credits');
            	        this.previousState = currentState;
            	    }
                }
            }
        },
        
        toggleAbout: function() {
            var currentState = $('#parchment').attr('class');

            if(this.game.started) {
                $('#parchment').removeClass().addClass('about');
                $('body').toggleClass('about');
                if(!this.game.player) {
                    $('body').toggleClass('death');
                }
                if($('body').hasClass('credits')) {
                    this.closeInGameCredits();
                }
            } else {
                if(currentState !== 'animate') {
                    if(currentState === 'about') {
                        if(localStorage && localStorage.data) {
                            this.animateParchment(currentState, 'loadcharacter');
                        } else {
                            this.animateParchment(currentState, 'createcharacter');
                        }
                    } else {
            	        this.animateParchment(currentState, 'about');
            	        this.previousState = currentState;
            	    }
                }
            }
        },

        toggleInventory: function() {
            var currentState = $('#parchment').attr('class');
            if (currentState === 'inventory') {
                // Close inventory
                this.closeInGameInventory();
            } else {
                // Open inventory
                if (this.game.started) {
                    //$('#parchment').removeClass().addClass('inventory');
                    $('body').toggleClass('inventory');
                    if (!this.game.player) {
                        $('body').toggleClass('death');
                    }
                    if ($('body').hasClass('credits')) {
                        this.closeInGameCredits();
                    }
                }
            }
        },
        

        closeInGameCredits: function() {
            $('body').removeClass('credits');
            $('#parchment').removeClass('credits');
            if(!this.game.player) {
                $('body').addClass('death');
            }
        },
        
        closeInGameAbout: function() {
            $('body').removeClass('about');
            $('#parchment').removeClass('about');
            if(!this.game.player) {
                $('body').addClass('death');
            }
            $('#helpbutton').removeClass('active');
        },
        closeInGameInventory: function() {
            $('body').removeClass('inventory');
            $('#parchment').removeClass('inventory');
            if(!this.game.player) {
                $('body').addClass('death');
            }
            $('#helpbutton').removeClass('active');
        },
        
        togglePopulationInfo: function() {
            $('#population').toggleClass('visible');
        },

        openPopup: function(type, url) {
            var h = $(window).height(),
                w = $(window).width(),
                popupHeight,
                popupWidth,
                top,
                left;

            switch(type) {
                case 'twitter':
                    popupHeight = 450;
                    popupWidth = 550;
                    break;
                case 'facebook':
                    popupHeight = 400;
                    popupWidth = 580;
                    break;
            }

            top = (h / 2) - (popupHeight / 2);
            left = (w / 2) - (popupWidth / 2);

        	newwindow = window.open(url,'name','height=' + popupHeight + ',width=' + popupWidth + ',top=' + top + ',left=' + left);
        	if (window.focus) {newwindow.focus()}
        },

        animateParchment: function(origin, destination) {
            var self = this,
                $parchment = $('#parchment'),
                duration = 1;

            if(this.isMobile) {
                $parchment.removeClass(origin).addClass(destination);
            } else {
                if(this.isParchmentReady) {
                    if(this.isTablet) {
                        duration = 0;
                    }
                    this.isParchmentReady = !this.isParchmentReady;
        
                    $parchment.toggleClass('animate');
                    $parchment.removeClass(origin);

                    setTimeout(function() {
                        $('#parchment').toggleClass('animate');
                        $parchment.addClass(destination);
                    }, duration * 1000);
        
                    setTimeout(function() {
                        self.isParchmentReady = !self.isParchmentReady;
                    }, duration * 1000);
        	    }
            }
        },

        animateMessages: function() {
            var $messages = $('#notifications div');

            $messages.addClass('top');
        },

        resetMessagesPosition: function() {
            var message = $('#message2').text();

            $('#notifications div').removeClass('top');
            $('#message2').text('');
            $('#message1').text(message);
        },

        showMessage: function(message) {
            if(this.game.renderer.isMobile){
                this.showChatLog(message);
            }
            var $wrapper = $('#notifications div'),
                $message = $('#notifications #message2');

            this.animateMessages();
            $message.text(message);
            if(this.messageTimer) {
                this.resetMessageTimer();
            }

            this.messageTimer = setTimeout(function() {
                    $wrapper.addClass('top');
            }, 5000);
            //console.log(message);
            
        },

        resetMessageTimer: function() {
            clearTimeout(this.messageTimer);
        },

        showChatLog: function(message) {
            // Show the message in the chat log
            window.ChatLog.showMessage(message);
          
            
          },
          
        
        resizeUi: function() {
            if(this.game) {
                if(this.game.started) {
                    //this.game.resize();
                    this.initHealthBar();
                    this.game.updateBars();
                } else {
                    //var newScale = this.game.renderer.getScaleFactor();
                    //this.game.renderer.rescale(newScale);
                }
            } 
        }
    });

    return App;
});