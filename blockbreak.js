$(function() {
  var Q = window.Q = Quintus({ audioSupported: [ 'mp3', 'ogg' ] })
                     .include('Input,Sprites,Scenes,Audio,Touch,UI')
                     .setup()
                     .enableSound()
                     .controls().touch();

  Q.input.keyboardControls();
  Q.input.touchControls({ 
            controls:  [ ['left','<' ],[],[],[],['right','>' ] ]
  });

  //paddle
  Q.Sprite.extend("Paddle", {     // extend Sprite class to create Q.Paddle subclass
    init: function(p) {
      this._super(p, {
        sheet: 'paddle',
        speed: 200,
        x: 0,
      });
      this.p.x = Q.width/2 - this.p.w/2;
      this.p.y = Q.height - this.p.h;
      if(Q.input.keypad.size) {
        this.p.y -= Q.input.keypad.size + this.p.h;
      }
    },

    step: function(dt) {
      if(Q.inputs['left']) { 
        this.p.x -= dt * this.p.speed;
      } else if(Q.inputs['right']) {
        this.p.x += dt * this.p.speed;
      }
      if(this.p.x < 30) { 
        this.p.x = 30;
      } else if(this.p.x > Q.width - 30) { 
        this.p.x = Q.width - 30;
      }
//      this._super(dt);	      // no need for this call anymore
    }
  });

  //ball
  Q.Sprite.extend("Ball", {
    init: function() {
      this._super({
        sheet: 'ball',
        speed: 200,
        dx: 1,
        dy: -1,
        lives: 3
      });
      this.p.y = Q.height / 2 - this.p.h;
      this.p.x = Q.width / 2 + this.p.w / 2;
	  
	  this.on('hit', this, 'collision');  // Listen for hit event and call the collision method
	  
	  this.on('step', function(dt) {      // On every step, call this anonymous function
		  var p = this.p;
		  Q.stage().collide(this);   // tell stage to run collisions on this sprite

		  p.x += p.dx * p.speed * dt;
		  p.y += p.dy * p.speed * dt;

		  if(p.x < 0) { 
		  	Q.audio.play('wallHit.mp3');
			p.x = 0;
			p.dx = 1;
		  } else if(p.x > Q.width - 2) { 
		  	Q.audio.play('wallHit.mp3');
			p.dx = -1;
			p.x = Q.width - 2;
		  }

		  if(p.y < 0) {
		  	Q.audio.play('wallHit.mp3');
			p.y = 0;
			p.dy = 1;
		  } else if(p.y > Q.height) { //LOSE GAME
			this.p.lives -= 1;
			
			  if(this.p.lives == 0){
			  	this.destroy();
			    Q.stage().trigger('addBall');
			    
			    Q.clearStages();
        		Q.stageScene('loseGame');
			  }
		  }
	  });
    },
	
	collision: function(col) {                // collision method
		if (col.obj.isA("Paddle")) {
//			alert("collision with paddle");
			Q.audio.play('paddleHit.mp3');
			this.p.dy = -1;
		} else if (col.obj.isA("Block")) {
//			alert("collision with block");
			Q.audio.play('blockHit.mp3');
			col.obj.destroy();
			this.p.dy *= -1;
			Q.stage().trigger('removeBlock');
		}
	}
  });


  //block
  Q.Sprite.extend("Block", {
    init: function(props) {
      
      this._super(
        _(props).extend({ sheet: 'block', score:0}));
      this.on('collision',function(ball) { 
        this.destroy();
        ball.p.dy *= -1;
        this.p.score += 1;
        Q.stage().trigger('removeBlock');
      });
    }
  });

//  Q.load(['blockbreak.png','blockbreak.json'], function() {
  Q.load(['blockbreak.png','paddleHit.mp3', 'blockHit.mp3', 'wallHit.mp3', 'yay.mp3',
  		  'jeopardy.mp3','blockbreak.json', 'aww.mp3'], function() {
    Q.compileSheets('blockbreak.png','blockbreak.json');  
	/**Q.sheet("ball", "blockbreak.png", { tilew: 20, tileh: 20, sy: 0, sx: 0 });
	Q.sheet("block", "blockbreak.png", { tilew: 40, tileh: 20, sy: 20, sx: 0 });
	Q.sheet("paddle", "blockbreak.png", { tilew: 60, tileh: 20, sy: 40, sx: 0 });	**/	 		 
    
    
     //game scene
    Q.scene('game', new Q.Scene(function(stage) {
      //Q.audio.play('jeopardy.mp3', {loop:true});
      //Q.clearStages();
      var score = 0;
      var lives = 3; //start with 3 lives
      
      //Q.reset({ score: 0, lives: 2 });
      
      var paddle = stage.insert(new Q.Paddle());
      var ball = stage.insert(new Q.Ball());
      
      var scoreBoard = stage.insert(new Q.UI.Text( { label: "score: ".concat(score), color: 'white', x:40, y:15,  size:16, type: 'Q.SPRITE_UI' } ));
	  var livesBoard = stage.insert(new Q.UI.Text( { label: "lives: ".concat(lives), color: 'white', x:Q.width - 35, y:15,  size:16, type: 'Q.SPRITE_UI' } ));

	  /*if(ball.p.y > Q.height){
        lives--;
        
        ball.destroy();
        var ball2 = stage.insert(new Q.Ball());
        	
        	if(lives == 0){
        		Q.clearStages();
        		Q.stageScene('loseGame');
        	} 
        }*/
        

      var blockCount=0;
      for(var x=0;x<6;x++) {
        for(var y=0;y<5;y++) {
          stage.insert(new Q.Block({ x: x*50+35, y: y*30+40 }));
          blockCount++;
        }
      }
      stage.on('removeBlock',function() {
        blockCount--;
        score++;
        scoreBoard.destroy();
        
        scoreBoard = stage.insert(new Q.UI.Text( { label: "score: ".concat(score), color: 'white', x:40, y:15,  size:16, type: 'Q.SPRITE_UI' } ));
        
        if(blockCount == 0) { // WIN GAME
          //Q.audio.stop();
          Q.clearStages();
          //console.log(blockCount);
          Q.stageScene('winGame');
        }
          
        
       
        
        
      });
      
      stage.on('addBall',function() {
        livesBoard.destroy();
        lives--;
        ball = stage.insert(new Q.Ball());
        
        livesBoard = stage.insert(new Q.UI.Text( { label: "lives: ".concat(lives), color: 'white', x:Q.width - 35, y:15,  size:16, type: 'Q.SPRITE_UI' } ));
      	
      
      
      });
      
      
      
      
      }));
    
    
    //hud scene
    Q.scene('hud', new Q.Scene(function(stage) {
      //Q.audio.play('jeopardy.mp3', {loop:true});
      //Q.clearStages();
      //var score = 0;
      //var lives = 3; //start with 3 lives
      
      
      
     var container = stage.insert(new Q.UI.Container({
        x: Q.width/2-3, y: Q.height/2, fill: "rgba(255,255,255,1)"
        }));
      
      stage.insert(new Q.UI.Text( { label: "score: ", fill: 'white', 
      x:50, y:50,  size:12 } ));

     
       
        
        
      }));
    
    //start screen			
     Q.scene('startScreen', new Q.Scene(function(stage) {
       
      //stage.insert(new Q.UI.Text( { size:25 ,x:50, y:50, fill: "#999999",label: "score: "}));
      	
      Q.reset({ score: 0, lives: 3 });	
    
      var container = stage.insert(new Q.UI.Container({
        x: Q.width/2-3, y: Q.height/2, fill: "rgba(255,255,255,1)"
        }));
    
    
      var buttonPlay = container.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#999999", 
                                           label: "Click to Play" }));    
                                              
      var label = container.insert(new Q.UI.Text({ x:0, y: -10 - buttonPlay.p.h, fill: "#FF0000",
                                        label: "Block Breaker" }));
                                        
      
      
      container.insert(new Q.UI.Text({ x: 0, y: 10 + buttonPlay.p.h, size: 16, align: "center",
                                           label: "Use left and right arrow keys\n to move paddle" }));
                                           
      buttonPlay.on('click',function() { 
        Q.clearStages();
        Q.stageScene('game'); 
      });                                
                                           
      container.fit(20);
    }));
    
    //win scene
    Q.scene("winGame", new Q.Scene(function(stage) {
     Q.audio.play('yay.mp3');
    
   
     var container = stage.insert(new Q.UI.Container({
        x: Q.width/2-3, y: Q.height/2, fill: "rgba(50,255,0,1)"
        }));
    
    
      var buttonPlay = container.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#FFFFFF", 
                                           label: "Click to play again" }));    
                                              
      var label = container.insert(new Q.UI.Text({ x:0, y: -10 - buttonPlay.p.h, fill: "#FF0000",
                                        label: "You win!" }));
                                        
      
      
      container.insert(new Q.UI.Text({ x: 0, y: 10 + buttonPlay.p.h, fill: "#FFFFFF", size: 16, align: "center",
                                           label: "Well done!" }));
                                           
      buttonPlay.on('click',function() { 
        Q.clearStages();
        Q.stageScene('game', 1); 
      });                                
                                           
      container.fit(20);
    }));
    
      
   	//lose scene
   	Q.scene("loseGame", new Q.Scene(function(stage) {
     Q.audio.play('aww.mp3');
    
   
     var container = stage.insert(new Q.UI.Container({
        x: Q.width/2-3, y: Q.height/2, fill: "rgba(255,0,0,1)"
        }));
    
    
      var buttonPlay = container.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#FFFFFF", 
                                           label: "Click to start over" }));    
                                              
      var label = container.insert(new Q.UI.Text({ x:0, y: -10 - buttonPlay.p.h, fill: "#FF0000",
                                        label: "You lose!" }));
                                        
      
      
      var instruct = container.insert(new Q.UI.Text({ x: 0, y: 10 + buttonPlay.p.h, fill: "#FFFFFF", size: 16, align: "center",
                                           label: "Hit the ball with the paddle!" }));
                                           
      buttonPlay.on('click',function() { 
        Q.clearStages();
        Q.stageScene('game'); 
      });                                
                                           
      container.fit(20);
    }));
   	
    //Q.stageScene('hud');
     //Q.stageScene('game');
    Q.stageScene('startScreen');
    //Q.clearStage(0);
    //Q.stageScene('game', 1);
  });
});