function main()
{
    size(800, 480);

    var levelInfo = {
        level : "test",

        xPos : 0,
        yPos : 0,
        width : width,
        height : height,

        unitWidth : 30,
        unitHeight : 30,

        boundingBox : {},
    }; 

    var keys = [];
    var keyPressed = function()
    {
        keys[keyCode] = true;
        keys[key.toString()] = true;
    };
    var keyReleased = function()
    {
        delete keys[keyCode];
        delete keys[key.toString()];
    };

    var pixelFuncs = {
        safeRead : function(item, col, row)
        {
            return (((col >= 0 && col < item.length) &&
                   (row >= 0 && row < item[col].length)) ? item[col][row] : undefined);
        },
        createPixelImage : function(input)
        {
            var img = createGraphics(input.width, input.height, P2D);
            img.beginDraw();
            img.noStroke();
            img.background(0, 0, 0, 0);
            for(var row = 0; row < input.pixels.length; row++)
            {
                for(var col = 0; col < input.pixels[row].length; col++)
                {
                    var char = pixelFuncs.safeRead(input.pixels, row, col);
                    var toFill = (input.pallete[char] !== undefined) ? 
                                  input.pallete[char] : "clear";
                    if(toFill !== "clear")
                    {
                        img.fill(toFill);
                        img.rect(col * input.pixelSize, row * input.pixelSize,
                        input.pixelSize, input.pixelSize);
                    }
                }
            }
            img.endDraw();
            return img;
        },
    };

    /*Creates an array specifically for an object*/
    var createArray = function(object, array)
    {
        array = array || [];
        array.references = {};

        array.add = function()
        {
            if(object.apply !== undefined)
            {
                //Instatiate
                var oNew = Object.create(object.prototype);
                object.apply(oNew, Array.prototype.slice.call(arguments));
                this.push(oNew);
            }else{
                array.push(Array.prototype.slice.call(arguments)[0]);
            }

            var lastObject = array.last(), index = this.length - 1;
            lastObject.arrayName = array.name;
            lastObject.name = array.tempArg || array.name;
            lastObject.index = index;
        };
        array.addObject = function(name)
        {
            if(this.references[name] === undefined)
            {
                this.references[name] = this.length;
            }else{
                println("Warning: You cannot have multiple objects \n" + 
                        "with the same name \'" + name + "\', Object removed.");
                //Exit the function immediately.
                return;
            }
            
            var args = Array.prototype.slice.call(arguments);
            this.tempArg = args[0];
            args.shift();
            this.add.apply(null, args);
        };
        array.getObject = function(name)
        {
            if(this[this.references[name]] !== undefined)
            {
                return this[this.references[name]];
            }else{
                println("Error referencing object '" + name + "'"); 
            }
        };
        array.removeObject = function(name)
        {
            if(this.references[name] !== undefined)
            {
                this.splice(this.references[name], 1);
                this.references[name] = undefined;
            }
        };
        array.last = function()
        {
            return this[this.length - 1];
        };
        array.draw = function()
        {
            for(var i = 0; i < this.length; i++)
            {
                this[i].draw();
            }
        };
        array.update = function()
        {
            for(var i = 0; i < this.length; i++)
            {
                this[i].update();
            }
        };

        return array;
    };

    var Camera = function(xPos, yPos, width, height)
    {
        this.xPos = xPos;
        this.yPos = yPos;
        this.width = width;
        this.height = height;

        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;
        this.focusXPos = this.halfWidth;
        this.focusYPos = this.halfHeight;

        this.upperLeft = {
            col : 0,
            row : 0,
        };
        this.lowerRight = {
            col : 0,
            row : 0,
        };

        this.boundingBox = {};

        this.speed = 0.06;

        this.getObject = function()
        {
            return this;
        };

        this.attach = function(func, directAttach, time, endFunc)
        {
            if(this.getObject === func)
            {
                return;
            }

            this.lastGetObject = this.getObject;
            this.getObject = func;
            var object = func();
            if(directAttach)
            {
                this.focusXPos = object.boundingBox.minY + (object.halfWidth);
                this.focusYPos = object.boundingBox.minX + (object.halfHeight);
            }
            this.getObject.attachTime = millis();
            this.getObject.time = time;
            this.getObject.endFunc = endFunc;
        };

        this.updateBoundingBox = function()
        {
            this.boundingBox.minX = this.focusXPos - this.halfWidth;
            this.boundingBox.minY = this.focusYPos - this.halfHeight;
            this.boundingBox.maxX = this.focusXPos + this.halfWidth;
            this.boundingBox.maxY = this.focusYPos + this.halfHeight;
        };

        this.updateBoundingBox();

        this.translateXPos = this.xPos;
        this.translateYPos = this.yPos;

        this.view = function(object)
        {
            if(this.getObject.time !== undefined && 
            millis() - this.getObject.attachTime > this.getObject.time)
            {
                (this.getObject.endFunc || function() {})();
                this.getObject = this.lastGetObject || this.getObject;
            }

            if(object === undefined)
            {
                object = this.getObject();
            }

            //Get the camera position
            var xPos = object.boundingBox.minX + (object.halfWidth);
            var yPos = object.boundingBox.minY + (object.halfHeight);

            this.angle = atan2(yPos - this.focusYPos, xPos - this.focusXPos);
            this.distance = dist(this.focusXPos, this.focusYPos, xPos, yPos) * this.speed;

            this.focusXPos += this.distance * cos(this.angle);
            this.focusYPos += this.distance * sin(this.angle);

            //Keep it in the grid
            this.focusXPos = constrain(this.focusXPos, levelInfo.xPos + this.halfWidth, levelInfo.xPos + levelInfo.width - this.halfWidth);
            this.focusYPos = constrain(this.focusYPos, levelInfo.yPos + this.halfHeight, levelInfo.yPos + levelInfo.height - this.halfHeight);

            //Get the corners position on the grid
            // this.upperLeft = cameraGrid.getPlace(this.focusXPos + EPSILON - this.halfWidth, this.focusYPos + EPSILON - this.halfHeight);
            // this.lowerRight = cameraGrid.getPlace(this.focusXPos + this.halfWidth - EPSILON, this.focusYPos + this.halfHeight - EPSILON);

            translate(this.xPos, this.yPos);

            this.translateXPos = this.xPos;
            this.translateYPos = this.yPos;

            if(levelInfo.width >= this.width)
            {
                this.translateXPos += this.halfWidth - this.focusXPos;
                translate(this.halfWidth - this.focusXPos, 0);
            }else{
                this.translateXPos -= levelInfo.xPos;
                translate(-levelInfo.xPos, 0);
            }
            if(levelInfo.height >= this.height)
            {
                this.translateYPos += this.halfHeight - this.focusYPos;
                translate(0, this.halfHeight - this.focusYPos);
            }else{
                this.translateYPos -= levelInfo.yPos;
                translate(0, -levelInfo.yPos);
            }

            this.updateBoundingBox();
        };

        this.untranslate = function()
        {
            translate(-this.focusXPos, -this.focusYPos);
        };

        this.drawOutline = function()
        {
            noFill();
            stroke(0, 0, 0);
            rect(this.xPos, this.yPos, this.width, this.height);
        };
    };
    var cam = new Camera(0, 0, width, height);

    var observer = {
        collisionTypes : {
            "rectrect" : { 
                colliding : function(rect1, rect2)
                {
                    return ((rect1.xPos + rect1.width > rect2.xPos && 
                             rect1.xPos < rect2.xPos + rect2.width) && 
                            (rect1.yPos + rect1.height > rect2.yPos && 
                             rect1.yPos < rect2.yPos + rect2.height));
                },
                getSide : function(rect1, rect2)
                {
                    /*
                        @dx: Difference xPos or the difference between both centers 
                             of rectangles in X-axis.
                             
                        @dy: Difference yPos or the difference between both centers 
                             of rectangles in Y-axis.
                    */
                    var dx = ((rect1.xPos + rect1.halfWidth) - (rect2.xPos + rect2.halfWidth)),
                        dy = ((rect1.yPos + rect1.halfHeight) - (rect2.yPos + rect2.halfHeight));
                    
                    //Important for normalizing differences between our values (vx, vy)
                    var hWidths = (rect1.halfWidth + rect2.halfWidth),
                        hHeights = (rect1.halfHeight + rect2.halfHeight);
                    
                    /*Note that these values can be subsituted 
                      or moved down below (with ox and oy)*/
                    var vx = rect1.xVel + (rect2.xVel || 0),
                        vy = rect1.yVel + (rect2.yVel || 0);
                    
                    var sx = 1, 
                        sy = 1;

                    //Based on the last decided side ignore x or y.
                    if(rect1._side === "up" || rect1._side === "down" || rect1.side === "")
                    {
                        sx = 0;
                    }
                    else if(rect1._side === "left" || rect1._side === "right")
                    {
                        sy = 0;
                    }

                    var ox = hWidths  - Math.abs(dx - vx * sx),
                        oy = hHeights - Math.abs(dy - vy * sy);
                        
                    if(ox < oy)
                    {
                        if(dx < 0)
                        {
                            return "left";
                        }else{
                            return "right";
                        }
                    }else{
                        if(dy < 0)
                        {
                            return "up";  
                        }else{
                            return "down";  
                        }
                    }
                },
                applySide : function(side, rect1, rect2, noZero)
                {
                    switch(side)
                    {
                        case "left" :
                            if(rect1.gravityX !== 0)
                            {
                                rect1.inAir = (rect1.gravityX < 0);
                            }
                            rect1.xVel = (!noZero) ? 0 : rect1.xVel;
                            rect1.xPos = rect2.xPos - rect1.width;
                            break;
                        
                        case "right" :
                            if(rect1.gravityX !== 0)
                            {
                                rect1.inAir = (rect1.gravityX > 0);
                            }
                            rect1.xVel = (!noZero) ? 0 : rect1.xVel;
                            rect1.xPos = rect2.xPos + rect2.width;
                            break;
                                 
                        case "up" :
                            if(rect1.gravityY !== 0)
                            {
                                rect1.inAir = (rect1.gravityY < 0);
                            }
                            rect1.yVel = (!noZero) ? 0 : min(0, rect1.yVel);
                            rect1.yPos = rect2.yPos - rect1.height;
                            break;
                        
                        case "down" :
                            if(rect1.gravityY !== 0)
                            {
                                rect1.inAir = (rect1.gravityY > 0);
                            }
                            rect1.yVel = (!noZero || rect1.yVel < -rect1.upForce) ? 0 : rect1.yVel;
                            rect1.yPos = rect2.yPos + rect2.height;
                            
                            //Enable the double lifting of crates
                            if(noZero && rect2.upForce && rect1.yVel <= 0)
                            {
                                rect2.yVel = min(rect2.yVel, -rect2.upForce); 
                            }
                            break;
                    }
                },
                getSideOneWay : function(side, rect1, oneWay) //For oneways
                {
                    switch(side)
                    {
                        case "left" :
                            if(oneWay.sides.left && rect1.xVel > 0 && 
                            rect1.xPos + rect1.width <= oneWay.xPos + abs(rect1.xVel))
                            {
                                return "left";    
                            }
                            break;
                        
                        case "right" :
                            if(oneWay.sides.right && rect1.xVel < 0 && 
                            rect1.xPos + abs(rect1.xVel) >= oneWay.xPos + oneWay.width)
                            {
                                return "right";    
                            }
                            break;
                            
                        case "up" :
                            if(oneWay.sides.up && rect1.yVel > 0 && 
                            rect1.yPos + rect1.height <= oneWay.yPos + abs(rect1.yVel))
                            {
                                return "up";    
                            }
                            break;
                            
                        case "down" :
                            if(oneWay.sides.down && rect1.yVel < 0 && 
                            rect1.yPos + abs(rect1.yVel) >= oneWay.yPos + oneWay.height)
                            {
                                return "down";    
                            }
                            break;
                    }
                    return "";
                },
                applyVelSide : function(side, rect1, rect2) //For crates
                {
                    switch(side)
                    {
                        case "left" :
                            if(rect1.xVel > 0)
                            {
                                rect2.xVel += rect1.xForce || rect1.xAcl * (rect1.mass || 1);  
                            }
                            return true;
                        
                        case "right" :
                            if(rect1.xVel < 0) 
                            {
                                rect2.xVel -= rect1.xForce || rect1.xAcl * (rect1.mass || 1);  
                            }
                            return true;
                            
                        case "up" :
                            if(rect1.yVel > 0)
                            {
                                rect2.yVel += rect1.yForce || (rect1.yAcl || 2) * (rect1.mass || 1);
                            }
                            return true;
                            
                        case "down" :
                            if(rect1.yVel < 0)
                            {
                                rect2.yVel -= rect1.yForce || (rect1.yAcl || 2) * (rect1.mass || 1); 
                            }
                            return true;
                    }
                    return false;
                },
                solveCollision : function(rect1, rect2)
                {
                    var side = this.getSide(rect1, rect2);
                    
                    if(rect2.sides !== undefined)
                    {
                        side = this.getSideOneWay(side, rect1, rect2);
                    }
                    
                    rect1._side = side;
                    
                    var noZero;
                    if(rect2.physics.movement === "dynamic")
                    {
                        noZero = this.applyVelSide(side, rect1, rect2);
                    }
                    
                    this.applySide(side, rect1, rect2, noZero);

                    return {
                        side : side,
                    };
                }
            }
        },
        access : function(object1, object2, access)
        {
            var info = observer.getType(
                object1.physics.shape,
                object2.physics.shape,
                observer.collisionTypes
            );
            var colliding = false;

            if(!info.flipped)
            {
                colliding = observer.collisionTypes[info.type][access](object1, object2);
            }else{
                colliding = observer.collisionTypes[info.type][access](object2, object1);
            }
            return colliding;
        },
        colliding : function(object1, object2)
        {
            return this.access(object1, object2, "colliding");
        },
        solveCollision : function(object1, object2)
        {
            return this.access(object1, object2, "solveCollision");
        },
        boundingBoxesColliding : function(box1, box2)
        {
            return (box1.minX < box2.maxX && box1.maxX > box2.minX && 
                    box1.minY < box2.maxY && box1.maxY > box2.minY);
        },
        getType : function(name1, name2, delegate)
        {
            var typeToReturn = "blank";
            var flipped = false;
            var type = name1 + name2;
            if(delegate[type] !== undefined)
            {
                typeToReturn = type;
            }else{
                //Flip shapes
                flipped = true;
                type = name2 + name1;
                if(delegate[type])
                {
                    typeToReturn = type;
                }
            }
            return {
                type : typeToReturn,
                flipped : flipped,
            };
        }     
    };

    var gameObjects = createArray([]);
    gameObjects.applyCollision = function(objectA)
    {
        if(objectA.physics.movement === "static")
        {
            return;
        }

        for(var i = 0; i < this.length; i++)
        {
            for(var j = 0; j < this[i].length; j++)
            {
                if(objectA.index === j && objectA.arrayName === this[i][j].arrayName)
                {
                    continue;
                }

                var objectB = this[i][j];

                if(!observer.boundingBoxesColliding(objectA.boundingBox, objectB.boundingBox))
                {
                    continue;        
                }

                if((objectA.physics.shape === "rect" && objectB.physics.shape === "rect") ||
                    observer.colliding(objectA, objectB))
                {
                    var returned = {};

                    if(objectA.physics.solidObject && objectB.physics.solidObject)
                    {
                        returned = observer.solveCollision(objectA, objectB);
                    }

                    objectA.updateBoundingBox();
                    objectB.updateBoundingBox();    

                    //Call on colliding functions!
                    objectA.onCollide(objectB, returned);  
                    objectB.onCollide(objectA, returned);  
                }
            }
        }
    };
    gameObjects.update = function()
    {
        for(var i = 0; i < this.length; i++)
        {
            for(var j = 0; j < this[i].length; j++)
            {
                this[i][j].update();
                this.applyCollision(this[i][j]);
            }
        }
    };


    var GameObject = function(xPos, yPos)
    {
        this.xPos = xPos;
        this.yPos = yPos;

        this.physics = {
            shape : "",
            movement : "static",
            solidObject : true,
        };
        this.boundingBox = {
            minX : xPos,
            minY : yPos,
            maxX : xPos,
            maxY : yPos,
        };

        this.draw = function() {};
        this.update = function() {};

        this.onCollide = function(object, info) {};
        this.avoidCollision = function(object) {};

        this.init = function() {};
        this.remove = function() {};
    };

    var DynamicObject = function()
    {
        this.xVel = 0;
        this.yVel = 0;
        this.maxXVel = 0;
        this.maxYVel = 0;

        this.xAcl = 0;
        this.yAcl = 0;
        this.xDeacl = 0;
        this.yDeacl = 0;

        this.gravityX = 0;
        this.gravityY = 0;

        this.inAir = false;
        this.jumpAmount = 0;

        this.physics.movement = "dynamic";

        this.update = function()
        {
            this.updateVel();
            this.updateBoundingBox();
            this.contain();
        };

        this.updateVel = function()
        {
            this.xVel += this.gravityX;
            this.xVel = constrain(this.xVel, -this.maxXVel, this.maxXVel);
            this.xPos += this.xVel;
                
            this.yVel += this.gravityY;
            this.yVel = constrain(this.yVel, -this.maxYVel, this.maxYVel);
            this.yPos += this.yVel;

            this.inAir = true;
            this.useGravity = true;
        };

        this.contain = function()
        {
            var _lastXPos = this.xPos, _lastYPos = this.yPos;
            this.xPos = constrain(this.xPos, levelInfo.boundingBox.minX - ((this.gravityX < 0) ? Infinity : 0), 
                                  levelInfo.boundingBox.maxX - (this.boundingBox.maxX - this.boundingBox.minX) + ((this.gravityX > 0) ? Infinity : 0));
            this.yPos = constrain(this.yPos, levelInfo.boundingBox.minY - ((this.gravityY < 0) ? Infinity : 0), 
                                  levelInfo.boundingBox.maxY - (this.boundingBox.maxY - this.boundingBox.minY) + ((this.gravityY > 0) ? Infinity : 0));

            if(this.xPos !== _lastXPos)
            {
                this.xVel = 0;
            }
            if(this.yPos !== _lastYPos)
            {
                this.yVel = 0;
            }
        };
    };

    var Rect = function(xPos, yPos, width, height)
    {
        GameObject.call(this, xPos, yPos);

        this.width = width;
        this.height = height;
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;

        this.physics.shape = "rect";

        this.updateBoundingBox = function()
        {
            this.boundingBox.minX = this.xPos;
            this.boundingBox.minY = this.yPos;
            this.boundingBox.maxX = this.xPos + this.width;
            this.boundingBox.maxY = this.yPos + this.height;
        };
        this.updateBoundingBox();

        this.draw = function()
        {
            noStroke();
            fill(this.color);
            rect(this.xPos, this.yPos, this.width, this.height);
        };
    };

    var LifeForm = function()
    {
        this.controls = {};

        this.xAcl = 2;
        this.xDeacl = 0.15;
        this.maxXVel = 3;

        // this.yAcl = 0.3;
        // this.yDeacl = 0.15;
        // this.maxYVel = 3.5;

        // this.xAcl = 0;
        // this.maxXVel = 7;

        // this.gravityX = 0.2;
        // this.jumpAmount = 8;

        this.yAcl = 0;
        this.maxYVel = 7;

        this.gravityY = 0.2;
        this.jumpAmount = 8;

        var _lastUpdate = this.update;
        this.update = function()
        {
            if(this.controls.left())
            {
                this.xVel -= this.xAcl;
            }
            else if(this.controls.right())
            {
                this.xVel += this.xAcl;
            }else{
                var xDeacl = this.xDeacl || this.xAcl;

                if(this.xVel < 0)
                {
                    this.xVel += xDeacl;
                }
                else if(this.xVel > 0)
                {
                    this.xVel -= xDeacl;
                }

                if(Math.abs(this.xVel) <= xDeacl)
                {
                    this.xVel = 0;
                }
            }

            if(this.controls.up())
            {
                this.yVel -= this.yAcl;
            }
            else if(this.controls.down())
            {
                this.yVel += this.yAcl;
            }else{
                var yDeacl = this.yDeacl || this.yAcl;

                if(this.yVel < 0)
                {
                    this.yVel += yDeacl;
                }
                else if(this.yVel > 0)
                {
                    this.yVel -= yDeacl;
                }

                if(Math.abs(this.yVel) <= yDeacl)
                {
                    this.yVel = 0;
                }
            }

            if(!this.inAir)
            {
                if(this.gravityY > 0 && this.controls.up())
                {
                    this.yVel = -this.jumpAmount;
                }
                else if(this.gravityY < 0 && this.controls.down())
                {
                    this.yVel = this.jumpAmount;
                }
                else if(this.gravityX > 0 && this.controls.left())
                {
                    this.xVel = -this.jumpAmount;
                }
                else if(this.gravityX < 0 && this.controls.right())
                {
                    this.xVel = this.jumpAmount;
                }
            }

            _lastUpdate.apply(this, arguments);
        };
    };

    var Block = function(xPos, yPos, width, height, _color)
    {
        Rect.call(this, xPos, yPos, width, height);
        this.color = _color;
    };
    gameObjects.addObject("block", createArray(Block));

    var Player = function(xPos, yPos, width, height, _color)
    {
        //Import class specifically in this order! (Otherwise it might not work)
        Rect.call(this, xPos, yPos, width, height);
        DynamicObject.call(this);
        LifeForm.call(this);

        this.color = _color || color(30, 0, 170);

        this.controls = {
            left : function() 
            {
                return keys[LEFT] || keys.a;
            },
            right : function() 
            {
                return keys[RIGHT] || keys.d;
            },
            up : function() 
            {
                return keys[UP] || keys.w;
            },
            down : function() 
            {
                return keys[DOWN] || keys.s;
            },
        };

        noStroke();
        fill(this.color);
        rect(0, 0, 50, 50);
        this.img = get(0, 0, 50, 50);

        this.draw = function()
        {
            image(this.img, this.xPos, this.yPos, this.width, this.height);
        };

        this.filmColor = color(0, 70, 200);

        this.drawPixelEdges = function()
        {
            if(!this.img.pixelEdges || !keys[" "])
            {
                return;
            }

            stroke(this.filmColor);
            strokeWeight(2);
            for(var i = 0; i < this.img.pixelEdges.length; i++)
            {
                point(this.xPos + this.img.pixelEdges[i].xPos, this.yPos + this.img.pixelEdges[i].yPos);
            }

            noStroke();
        };

        var _lastUpdate = this.update;
        this.update = function()
        {
            if((this.gravityX > 0 && this.boundingBox.minX > levelInfo.boundingBox.maxX) || 
               (this.gravityY > 0 && this.boundingBox.minY > levelInfo.boundingBox.maxY) ||
               (this.gravityX < 0 && this.boundingBox.maxX < levelInfo.boundingBox.minX) || 
               (this.gravityY < 0 && this.boundingBox.maxY < levelInfo.boundingBox.minY))
            {
                this.yPos = yPos;
                this.xPos = xPos;
            }

            _lastUpdate.apply(this, arguments);
        };
    };
    gameObjects.addObject("player", createArray(Player));

    //Re-use code.
    levelInfo.updateBoundingBox = new Rect().updateBoundingBox;
    levelInfo.updateBoundingBox();

    var levels = {
        "test" : {
            plan : [
                "bbbbbbbbbbbbbbbbbbbbbbb                                                                                ",
                "                                                                                                       ",
                "                                                                                                       ",
                "                                              bbb                                                      ",
                "                                                                                                       ",                                                                      
                "                                                  b                                                    ",                                                                      
                "                                                  b                                                    ",                                                                      
                "                                      bbbbbbb     b              bbbbb                                 ",                                                                      
                "                                bbb         b                                                          ",                                                                     
                "                                            b             bbbbbb       bbbbbbbb                        ",                                                                      
                "                              bbb           b                                                          ",                                                                      
                "                                                                                                       ",                                                                      
                "                                                  bbbb                                                 ",                                                                      
                "                                                                                                       ",                                                                      
                "                                                                                                       ",                                                                      
                "                                                                                                       ",                                                                      
            ],
        }
    };
    levels.build = function(plan)
    {
        var level = levels[plan.level];
        
        levelInfo.width = level.plan[0].length * levelInfo.unitWidth;
        levelInfo.height = level.plan.length * levelInfo.unitHeight;
        levelInfo.updateBoundingBox();

        for(var row = 0; row < level.plan.length; row++)
        {
            for(var col = 0; col < level.plan[row].length; col++)
            {
                var xPos = levelInfo.xPos + col * levelInfo.unitWidth,
                    yPos = levelInfo.yPos + row * levelInfo.unitHeight;
                
                var symbol = level.plan[row][col];
                
                switch(symbol)
                {
                    case 'p' :
                            gameObjects.getObject("player").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                        break;
                    
                    case 'b' :
                            gameObjects.getObject("block").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(75, 75, 75));
                        break;
                        
                    case 'x' :
                            
                        break;
                     
                    case '<' :
                            // oneWays.add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight,
                            // color(0, 60, 150, 100),
                            // {
                            //     left : true,
                            // });
                        break; 
                        
                    case '>' :
                            // oneWays.add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight,
                            // color(0, 60, 150, 100),
                            // {
                            //     right : true,
                            // });
                        break; 
                        
                    case '^' :
                            // oneWays.add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                        break;
                        
                    case 'v' :
                            // oneWays.add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight,
                            // color(0, 60, 150, 100),
                            // {
                            //     down : true,
                            // });
                        break;
                }
            }
        }
    };

    var PixelObserver = function(layer, colors, cam)
    {
        this.res = 15;
        this.padding = 1;
        this.offSet = 3;

        this.loopLimit = 500;

        this.conf = {
            layer : layer,
            colors : colors,
            cam : cam,
        };

        this.cache = {
            left : [],
            right : [],
            up : [],
            down : [],
        };

        this.collect = function(object, layer, colors, cam)
        {
            var oBox = object.boundingBox;
            var div = object.padding;
            var setX, setY;

            setY = oBox.minY;

            //Left Collisions
            setX = round(oBox.minX - div);

            for(var i = object.offSet; i <= object.resY - object.offSet; i++)
            {
                this.cache.left[i] = (colors.indexOf(layer.getPixel(setX, round(setY + i * object.heightRes))) === -1);
            }

            //Right Collisions
            setX = round(oBox.maxX + div);

            for(var i = object.offSet; i <= object.resY - object.offSet; i++)
            {
                this.cache.right[i] = (colors.indexOf(layer.getPixel(setX, round(setY + i * object.heightRes))) === -1);
            }

            setX = oBox.minX;

            //Up Collisions
            setY = round(oBox.minY - div);

            for(var i = object.offSet; i <= object.resX - object.offSet; i++)
            {
                this.cache.up[i] = (colors.indexOf(layer.getPixel(round(setX + i * object.widthRes), setY)) === -1);
            }

            //Down Collisions
            setY = round(oBox.maxY + div);    

            for(var i = object.offSet; i <= object.resX - object.offSet; i++)
            {
                this.cache.down[i] = (colors.indexOf(layer.getPixel(round(setX + i * object.widthRes), setY)) === -1);
            }
        };

        this.process = function(object, layer, colors, cam)
        {
            var oBox = object.boundingBox;
            var temp, i, setX, setY;

            setX = oBox.minX;
            setY = oBox.minY;

            if(this.cache.down.indexOf(true) !== -1) 
            {
                object.yVel = 0;
                object.inAir = false;

                i = 0;
                temp = this.cache.down.indexOf(true);

                while(colors.indexOf(layer.getPixel(round(setX + temp * object.widthRes), 
                                         round(object.yPos + object.height))) === -1 && i < this.loopLimit) 
                {
                    object.yPos -= 1;
                    i++;
                }

                i = 0;
                temp = this.cache.down.lastIndexOf(true);


                while(colors.indexOf(layer.getPixel(round(setX + temp * object.widthRes), 
                                         round(object.yPos + object.height))) === -1 && i < this.loopLimit) 
                {
                    object.yPos -= 1;
                    i++;
                }
            }
            else if(this.cache.up.indexOf(true) !== -1) 
            {
                object.yVel = 0;
                object.inAir = true;

                i = 0;
                temp = this.cache.up.indexOf(true);

                while(colors.indexOf(layer.getPixel(round(setX + temp * object.widthRes), 
                                         round(object.yPos))) === -1 && i < this.loopLimit) 
                {
                    object.yPos += 1;
                    i++;
                }

                i = 0;
                temp = this.cache.up.lastIndexOf(true);

                while(colors.indexOf(layer.getPixel(round(setX + temp * object.widthRes), 
                                         round(object.yPos))) === -1 && i < this.loopLimit) 
                {
                    object.yPos += 1;
                    i++;
                }
            }

            if(this.cache.right.indexOf(true) !== -1) 
            {
                object.xVel = 0;

                i = 0;
                temp = this.cache.right.indexOf(true);

                while(colors.indexOf(layer.getPixel(round(object.xPos + object.width), 
                                         round(setY + temp * object.heightRes))) === -1 && i < this.loopLimit) 
                {
                    object.xPos -= 1;
                    i++;
                }

                i = 0;
                temp = this.cache.right.lastIndexOf(true);

                while(colors.indexOf(layer.getPixel(round(object.xPos + object.width), 
                                         round(setY + temp * object.heightRes))) === -1 && i < this.loopLimit) 
                {
                    object.xPos -= 1;
                    i++;
                }
            }
            else if(this.cache.left.indexOf(true) !== -1) 
            {
                object.xVel = 0;

                i = 0;
                temp = this.cache.left.indexOf(true);

                while(colors.indexOf(layer.getPixel(round(object.xPos), 
                                         round(setY + temp * object.heightRes))) === -1 && i < this.loopLimit) 
                {
                    object.xPos += 1;
                    i++;
                }

                i = 0;
                temp = this.cache.left.lastIndexOf(true);

                while(colors.indexOf(layer.getPixel(round(object.xPos), 
                                         round(setY + temp * object.heightRes))) === -1 && i < this.loopLimit) 
                {
                    object.xPos += 1;
                    i++;
                }
            }

            object.updateBoundingBox();
        };

        this.debug = function(object, layer, colors, cam)
        {
            strokeWeight(2);
            stroke(255, 0, 0);

            var oBox = object.boundingBox;
            var minV, maxV;

            if(this.cache.left.indexOf(true) !== -1) 
            {
                minV = this.cache.left.indexOf(true);
                maxV = this.cache.left.lastIndexOf(true);

                line(oBox.minX, oBox.minY + minV * object.heightRes, 
                     oBox.minX, oBox.minY + maxV * object.heightRes);
            }

            if(this.cache.right.indexOf(true) !== -1) 
            {
                minV = this.cache.right.indexOf(true);
                maxV = this.cache.right.lastIndexOf(true);

                line(oBox.maxX, oBox.minY + minV * object.heightRes,
                     oBox.maxX, oBox.minY + maxV * object.heightRes);
            }

            if(this.cache.up.indexOf(true) !== -1) 
            {
                minV = this.cache.up.indexOf(true);
                maxV = this.cache.up.lastIndexOf(true);

                line(oBox.minX + minV * object.widthRes, oBox.minY, 
                     oBox.minX + maxV * object.widthRes, oBox.minY);
            }

            if(this.cache.down.indexOf(true) !== -1) 
            {
                minV = this.cache.down.indexOf(true);
                maxV = this.cache.down.lastIndexOf(true);
                
                line(oBox.minX + minV * object.widthRes, oBox.maxY,
                     oBox.minX + maxV * object.widthRes, oBox.maxY);
            }
        };

        this.clear = function()
        {
            this.cache.left = [];
            this.cache.right = [];
            this.cache.up = [];
            this.cache.down = [];
        };

        this.init = function(object, conf)
        {
            conf = conf || {};

            object.resX = (conf.resX || this.res);
            object.resY = (conf.resY || this.res);

            object.refreshDimRes = function()
            {
                object.widthRes = (object.width / object.resX);
                object.heightRes = (object.height / object.resY);
            };

            object.refreshDimRes();

            object.padding = conf.padding || this.padding;
            object.offSet = conf.offSet || this.offSet;
        };

        this.run = function(object, layer, colors, cam)
        {
            this.collect(object, layer || this.conf.layer, colors || this.conf.colors, cam || this.conf.cam);
            this.process(object, layer || this.conf.layer, colors || this.conf.colors, cam || this.conf.cam);

            if(this.debugMode || object.debugMode) 
            {
                this.debug(object, layer || this.conf.layer, colors || this.conf.colors, cam || this.conf.cam);
            }

            this.clear();
        };
    };

    var PixelObserver2 = function()
    {
        this.collidedAt = {
            xPos : 0,
            yPos : 0,
        };

        this.countCols = function(layer, object, avoidColors, search)
        {
            var x = object.xPos, 
                y = object.yPos;

            var c = 0;

            for(var i = 0; i < object.img.pixelEdges.length; i++)
            {
                var place = object.img.pixelEdges[i];

                if(avoidColors.indexOf(layer.getPixel(x + place.xPos, y + place.yPos)) === -1 && (!search || search(place)))
                {
                    c++;
                }
            }

            return c;
        };

        this.colliding = function(layer, object, avoidColors, search)
        {
            var x = object.xPos, 
                y = object.yPos;

            for(var i = 0; i < object.img.pixelEdges.length; i++)
            {
                var place = object.img.pixelEdges[i];

                if(avoidColors.indexOf(layer.getPixel(x + place.xPos, y + place.yPos)) === -1 && (!search || search(place)))
                {
                    this.collidedAt = {
                        index : i,
                    };
                    return true;
                }
            }

            return false;
        };

        this.solveCollision = function(layer, object, avoidColors)
        {
            /*Calculate the difference between the last safe uncollided position*/
            var tWidth  = object.lastSafeXPos - object.xPos - object.xVel || 0;
            var tHeight = object.lastSafeYPos - object.yPos - object.yVel || 0;

            /*No difference? (The code below wouldn't change the object's position) Skip!*/
            if(tWidth === 0 && tHeight === 0)
            {
                return;
            }

            /* Swap positions, So the player isn't colliding */
            var tempX = object.lastSafeXPos;
            var tempY = object.lastSafeYPos;
            object.xPos = object.lastSafeXPos;
            object.yPos = object.lastSafeYPos;
            object.lastSafeXPos = tempX;
            object.lastSafeYPos = tempY;

            var a = atan2(tHeight, tWidth);
            var c = 0;

            /* Move the object along a line, from not colliding to where it was 
            colliding (before the swap), Until we hit the layer's pixels */
            while(!this.colliding(layer, object, avoidColors) && c < 500)
            {
                /*Move object*/
                object.xPos -= cos(a) || 0;
                object.yPos -= sin(a) || 0;

                /* Recaculate angle and position difference (vector) */
                tWidth  = object.lastSafeXPos - object.xPos || 0;
                tHeight = object.lastSafeYPos - object.yPos || 0;
                a = atan2(tHeight, tWidth);

                c++;
            }

            var downs = this.countCols(layer, object, avoidColors, function(place)
            {
                return place.down;
            });
            ups = this.countCols(layer, object, avoidColors, function(place)
            {
                return place.up;
            });
            var rights = this.countCols(layer, object, avoidColors, function(place)
            {
                return (place.yPos <= object.yPos + object.img.height - 4 && place.right);
            }),
            lefts = this.countCols(layer, object, avoidColors, function(place)
            {
                return (place.yPos <= object.yPos + object.img.height - 4 && place.left);
            });

            var pXVel = object.xVel;
            var pYVel = object.yVel;

            if(downs + ups >= rights + lefts)
            {
                if(downs > ups)
                {
                    if(object.gravityY !== 0)
                    {
                        object.inAir = (object.gravityY < 0);
                    }
                    object.yPos -= object.gravityY;
                    object.yVel = 0;
                }
                else if(downs !== ups)
                {
                    if(object.gravityY !== 0)
                    {
                        object.inAir = (object.gravityY > 0);
                    }
                    object.yPos += object.gravityY;
                    object.yVel = 0;
                }
            }else{
                if(rights > lefts)
                {
                    if(object.gravityX !== 0)
                    {
                        object.inAir = (object.gravityX < 0);
                    }
                    object.xPos += object.gravityX;
                    object.xVel = 0;
                }
                else if(rights !== lefts)
                {
                    if(object.gravityX !== 0)
                    {
                        object.inAir = (object.gravityX > 0);
                    }
                    object.xPos -= object.gravityX;
                    object.xVel = 0;
                }
            }

            /*Go back a little*/
            object.xPos += cos(a) || 0;
            object.yPos += sin(a) || 0;

            // var d = dist(0, 0, pXVel, pYVel);

            // var a2 = atan2(pYVel, pXVel);
            // var a3 = 360;

            // object.xVel = 5;
            // object.xVel = 5;

            // object.xVel = cos(a3) * d;
            // object.yVel = sin(a3) * d;

            /*Unsafe: let's undo what we did!*/
            if(abs(tWidth) > (object.maxXVel || object.width) || abs(tHeight) > (object.maxYVel || object.height))
            {
                var tempX = object.lastSafeXPos;
                var tempY = object.lastSafeYPos;
                object.xPos = object.lastSafeXPos;
                object.yPos = object.lastSafeYPos;
                object.lastSafeXPos = tempX;
                object.lastSafeYPos = tempY;

                return false;
            }

            object.lastSafeXPos = object.xPos;
            object.lastSafeYPos = object.yPos;

            return true;
        };
    };

    var pixelObserver2 = new PixelObserver2();

    gameObjects.getObject("player").add(190, 70, levelInfo.unitWidth, levelInfo.unitHeight * 2);

    levels.build(levelInfo);

    var wp = createGraphics(14000, 600, P2D);

    smooth();

    wp.beginDraw();
        wp.background(0, 0, 0, 0);
        wp.noStroke();

        wp.fill(40, 132, 220);
        wp.ellipse(330, 360, 70, 70);

        wp.triangle(200, 300, 100, 500, 300, 400);
        wp.triangle(400, 300, 200, 500, 500, 400);

        wp.rect(600, 200, 70, 120, 7);

        wp.ellipse(450, 300, 80, 124);

        wp.fill(120, 120, 120);
        wp.rect(20, 400, 1200, 200);

        wp.rect(800, 200, 60, 500);
    wp.endDraw();

    wp.loadPixels();

    levelInfo.width = wp.imageData.width;
    levelInfo.height = wp.imageData.height;
    levelInfo.updateBoundingBox();

    var bgColors = [color(145, 145, 145, 255), color(0, 0, 0, 255), color(0, 0, 0, 0), color(255, 255, 255, 255)];

    var player = gameObjects.getObject("player").last();
    player.img = pixelFuncs.createPixelImage({
        width : 30, 
        height : 60, 
        pixelSize : 3, 
        pixels : [
            "  000000  ",
            "  000000  ",
            "    00    ",
            "   0000   ",
            "  000000  ",
            "0000000000",
            "0000000000",
            "  000000  ",
            "  000000  ",
            "   0000   ",
            "  000000  ",
            " 00000000 ",
            "  000000  ",
            "  000000  ",
            "  000000  ",
            "   0000   ",
            "   0  0   ",
            "  00  00  ",
            "  00  00  ",
            "  00  00  ",
        ],
        pallete : {
            '0' : color(0, 0, 70),
        },
    });

    var checkIfUp = function(img, ix, iy, widthDown, heightDown)
    {
        var value;
        for(var y = 0; y < iy; y++)
        {
            value = alpha(img.getPixel(ix, y));

            if(value !== 0)
            {
                return false;
            }
        }

        return true;
    };

    var loadPixelEdges = function(img)
    {
        var pixelEdges = [];

        if(!img.imageData || !img.imageData.data)
        {
            img.loadPixels();
        }

        var value, left, right, up, down;
        var widthDown = img.imageData.width - 1;
        var heightDown = img.imageData.height - 1;

        for(var x = 1; x < widthDown; x++)
        {
            for(var y = 1; y < heightDown; y++)
            {
                if(alpha(img.getPixel(x, y)) === 0)
                {
                    continue;
                }

                left = alpha(img.getPixel(x + 1, y)), right = alpha(img.getPixel(x - 1, y)),
                up = alpha(img.getPixel(x, y + 1)), down = alpha(img.getPixel(x, y - 1));

                if(left === 0 || up === 0 || 
                   right === 0 || down === 0) //|| 
                   //x === 1 || x === widthDown || y === 1 || y === heightDown)
                {
                    pixelEdges.push({
                        xPos : x,
                        yPos : y,
                        left : left === 0,
                        right : right === 0,
                        up : up === 0,
                        down : down === 0
                    });
                }
            }
        }

        for(var x = 0; x < img.imageData.width; x++)
        {
            if(alpha(img.getPixel(x, 0)) !== 0)
            {
                pixelEdges.push({
                    xPos : x,
                    yPos : 0,
                    up : true,
                });
            }
            if(alpha(img.getPixel(x, heightDown)) !== 0)
            {
                pixelEdges.push({
                    xPos : x,
                    yPos : heightDown,
                    down : true,
                });
            }
        }
        for(var y = 0; y < img.imageData.height; y++)
        {
            if(alpha(img.getPixel(0, y)) !== 0)
            {
                pixelEdges.push({
                    xPos : 0,
                    yPos : y,
                    left : true,
                });
            }
            if(alpha(img.getPixel(widthDown, y)) !== 0)
            {
                pixelEdges.push({
                    xPos : widthDown,
                    yPos : y,
                    right : true,
                });
            }
        }

        img.pixelEdges = pixelEdges;
    };

    function attachImageMethods(img)
    {
        img.getIndex = function(x, y)
        {
            return ((0 | x) + this.imageData.width * (0 | y)) * 4;
        };
        img.setPixel = function(x, y, _color)
        {
            var i = ((0 | x) + this.imageData.width * (0 | y)) * 4;
            this.imageData.data[i] = red(_color); 
            this.imageData.data[i + 1] = green(_color); 
            this.imageData.data[i + 2] = blue(_color); 
            this.imageData.data[i + 3] = alpha(_color); 
        };
        img.getPixel = function(x, y)
        {
            var i = ((0 | x) + this.imageData.width * (0 | y)) * 4;

            return color(this.imageData.data[i], 
                         this.imageData.data[i + 1],
                         this.imageData.data[i + 2], 
                         this.imageData.data[i + 3]);
        };   
    };

    attachImageMethods(wp);

    attachImageMethods(player.img)
    loadPixelEdges(player.img);

    player.lastSafeYPos = player.yPos;
    player.lastSafeXPos = player.xPos;

    var pixelObserver = new PixelObserver(wp, bgColors, cam);
    pixelObserver.debugMode = false;
    
    gameObjects.getObject("player").forEach(p => pixelObserver.init(p));

    function setCircle(xp, yp, r, _color, avoidColors)
    {
        var s = r * r;

        for(var x = xp - r; x < xp + r; x++)
        {
            for(var y = yp - r; y < yp + r; y++)
            {
                var p = wp.getPixel(x, y);

                if(avoidColors.indexOf(p) === -1 && Math.pow(xp - x, 2) + Math.pow(yp - y, 2) < s)
                {
                    wp.setPixel(x, y, _color);
                }
            }
        }
    }

    var fpsCatcher = {
        actualFps : 60,
        lastTime : 0,
        update : function()
        {        
            if(performance.now() % 15 >= 14)
            {
                var delta = (performance.now() - this.lastTime) / 1000;

                this.actualFps = (1 / delta).toFixed(0);
            }

            this.lastTime = performance.now();
        },
    };

    draw = function()
    {
        background(15, 165, 200);

        image(wp.get(cam.boundingBox.minX, cam.boundingBox.minY, cam.width, cam.height), cam.xPos, cam.yPos);
        pushMatrix();
            cam.view(player);

            gameObjects.draw();

            gameObjects.getObject("player").forEach(p => {
                // pixelObserver.run(p),
                p.drawPixelEdges();
            });

            if(pixelObserver2.colliding(wp, player, bgColors))
            {
                player.filmColor = color(190, 50, 60);

                pixelObserver2.solveCollision(wp, player, bgColors);
            }else{
                player.filmColor = color(0, 70, 200);

                player.lastSafeYPos = player.yPos;
                player.lastSafeXPos = player.xPos;
            }

            gameObjects.update();
        popMatrix();

        fill(0, 0, 100);
        text(fpsCatcher.actualFps, 10, 20);

        if(mouseIsPressed && keys[" "])
        {
            if(mouseButton === LEFT)
            {
                setCircle(mouseX + cam.boundingBox.minX, 
                          mouseY + cam.boundingBox.minY, 15, color(0, 160, 120), [color(120, 120, 120)]);
            }
            else if(mouseButton === RIGHT)
            {
                setCircle(mouseX + cam.boundingBox.minX, 
                          mouseY + cam.boundingBox.minY, 15, color(0, 0, 0, 0), [color(120, 120, 120)]);
            }

            wp.updatePixels();
        }

        fpsCatcher.update();
    };
}

createProcessing(main);

var pi = 0;

var tests = [];

var c;
for(var i = 3; i < 100; i += 2)
{
    c = (1 / i).toString().split("");
    c.length = Math.max(3, c.length - 10);

    tests.push(Number(c.join("")));
}

console.log(tests);

pi = 1;

for(var j = 0; j < tests.length; j++)
{
    tests[j] = Number(tests[j].toString() - 3);

    if(j % 2 === 0)
    {
        pi -= tests[j];
    }else{
        pi += tests[j];
    }
}

pi *= tests.length;

console.log(pi);