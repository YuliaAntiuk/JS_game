window.addEventListener('load', function(){
    //anonimus f-ns - f-ns without a name
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 690;
    let enemies = [];
    let score = 0;
    let gameOver = false;
    const fullScreenButton = document.getElementById('fullScreen');

    class InputHandler{
        //store information of all the pressed keys
        constructor(){
            this.keys = [];
            this.touchY = '';
            this.touchTreshold = 50; //to make sure our game reacts only to longer swipes (at least 50px betw end points)
            window.addEventListener('keydown', e => {
                //e stores information about the pressed key
                //the key property represents the name of the pressed key
                if((e.key === 'ArrowDown'||
                    e.key === 'ArrowUp' ||
                    e.key === 'ArrowRight' ||
                    e. key === 'ArrowLeft') && this.keys.indexOf(e.key) === -1)
                {
                    //indexOf returns -1 if the item is not found in the array
                    this.keys.push(e.key);
                } else if (e.key === 'Enter' && gameOver){
                    restartGame();
                }
            })
            window.addEventListener('keyup', e => {
                if((e.key === 'ArrowDown'||
                    e.key === 'ArrowUp' ||
                    e.key === 'ArrowRight' ||
                    e. key === 'ArrowLeft'))
                {
                    this.keys.splice(this.keys.indexOf(e.key), 1);
                    //remove 1 element of this index
                }
            });
            window.addEventListener('touchstart', e => {
                this.touchY = e.changedTouches[0].pageY; //y coord of the touch
            });
            window.addEventListener('touchmove', e => {
                const swipeDistance = e.changedTouches[0].pageY - this.touchY;
                if(swipeDistance < -this.touchTreshold && this.keys.indexOf('swipe up') === -1){ this.keys.push('swipe up');}
                else if(swipeDistance > this.touchTreshold && this.keys.indexOf('swipe down') === -1){
                     this.keys.push('swipe down');
                     if(gameOver) restartGame();
                }
            });
            window.addEventListener('touchend', e => {
                console.log(this.keys);
                this.keys.splice(this.keys.indexOf('swipe up'), 1);
                this.keys.splice(this.keys.indexOf('swipe down'), 1);
            });
        }
    }

    class Player{
        //react to the keys
        constructor(gameWidth, gameHeight){
            //convert parametes to class properties:
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 200;
            this.height = 200;
            this.x = 100;
            this.y = this.gameHeight - this.height;
            this.image = document.getElementById('playerImage');
            this.frameX = 0; //x of 1 img from spritesheet
            this.frameY = 0; //y of 1 img from spritesheet
            this.maxFrame = 8;
            this.fps = 20; //frames-per-second (horizontal navigation betw enemies spritesheet)
            this.frameTimer = 0;
            this.frameInterval = 1000/this.fps;
            this.speed = 0;
            this.vy = 0;
            this.weight = 1;
        }
        restart(){
            this.x = 100;
            this.y = this.gameHeight - this.height;
            this.frameY = 0;
            this.maxFrame = 8;
        }
        draw(contex){//parameter specifies which canvas we want to draw on
            contex.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
        }
        update(input, deltaTime, enemies){ //parameter is our keys
            //collision detection
            enemies.forEach(enemy => {
                const dx = (enemy.x + enemy.width/2 - 20) - (this.x + this.width/2); //offset to move the center points to the middle
                const dy = (enemy.y + enemy.height/2) - (this.y + this.height/2 + 20); //we're just adjusting offsetting circles
                const distance = Math.sqrt(dx * dx + dy * dy);
                if(distance < enemy.width/3 + this.width/3){
                    gameOver = true;
                }
            })
            //sprite animation
            if(this.frameTimer > this.frameInterval){
                if(this.frameX >= this.maxFrame){
                    this.frameX = 0;
                } else {
                    this.frameX++;
                }
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
            //controls
            if(input.keys.indexOf('ArrowRight') > -1){
                //when arrowRight is found
                this.speed = 5;
            } 
            else if(input.keys.indexOf('ArrowLeft') > -1){
                this.speed = -5;
            } else if((input.keys.indexOf('ArrowUp') > -1 || input.keys.indexOf('swipe up') > -1) && this.onGround()){
                this.vy -= 30;
            }
            else {
                this.speed = 0;
            }
            //horizontal movement
            this.x += this.speed;
            if(this.x < 0) this.x = 0;
            else if(this.x > this.gameWidth - this.width) this.x = this.gameWidth - this.width;
            //vertical movement
            this.y += this.vy;
            if(!this.onGround()){
                this.vy += this.weight;
                this.maxFrame = 5;
                this.frameY = 1;
            } else {
                this.vy = 0;
                this.maxFrame = 8;
                this.frameY = 0;
            }
            if(this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height;
        }
        onGround(){
            return this.y >= this.gameHeight - this.height;
        }
    }

    class Background{
        //endlessly scrolling bg
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.image = document.getElementById('backgroundImage');
            this.x = 0;
            this.y = 0;
            this.width = 2400;
            this.height = 720;
            this.speed = 15;
        }
        draw(contex){
            contex.drawImage(this.image, this.x, this.y, this.width, this.height);
            contex.drawImage(this.image, this.x + this.width - this.speed, this.y, this.width, this.height);
        }
        update(){
            this.x -= this.speed;
            if(this.x < 0 - this.width) this.x = 0;
        }
        restart(){
            this.x = 0;
        }
    }

    class Enemy{
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 160;
            this.height = 119;
            this.image = document.getElementById('enemyImage');
            this.x = this.gameWidth;
            this.y = this.gameHeight - this.height;
            this.frameX = 0;
            this.maxFrame = 5;
            this.fps = 20; //frames-per-second (horizontal navigation betw enemies spritesheet)
            this.frameTimer = 0;
            this.frameInterval = 1000/this.fps; //how many ms each frame lasts
            this.speed = 8;
            this.markedForDeletion = false;
        }
        draw(contex){
            contex.drawImage(this.image, this.frameX * this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }
        update(deltaTime){
            if(this.frameTimer > this.frameInterval){
                if(this.frameX >= this.maxFrame){
                    this.frameX = 0;
                } else {
                    this.frameX++;
                }
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
            this.x -= this.speed;
            if(this.x < 0 - this.width){
                this.markedForDeletion = true;  
                score++;
            }
        }
    }

    let enemyTimer = 0;
    let enemyInterval = 1000;
    let randomEnemyInterval = Math.random() * 1000 + 500;

    function handleEnemies(deltaTime){
        //generate and store enemies
        if(enemyTimer > (enemyInterval + randomEnemyInterval)){
            enemies.push(new Enemy(canvas.width, canvas.height));
            enemyTimer = 0;
            randomEnemyInterval = Math.random() * 1000 + 500;
        } else {
            enemyTimer += deltaTime;
        }
        enemies.forEach(enemy => {
            enemy.draw(ctx);
            enemy.update(deltaTime);
        })
        enemies = enemies.filter(enemy => !enemy.markedForDeletion);
    }

    function displayStatusText(context){
        //score and gameover message
        context.textAlign = 'left';
        context.fillStyle = 'black';
        context.font = '30px Helvetica';
        context.fillText('Score: ' + score, 20, 50); //built-in (text, x, y)
        context.fillStyle = 'white';
        context.fillText('Score: ' + score, 22, 50); 
        if(gameOver){
            context.textAlign = 'center';
            context.fillStyle = 'black';
            context.fillText('GAME OVER, press Enter or swipe down to restart!', canvas.width/2, 200);
            context.fillStyle = 'white';
            context.fillText('GAME OVER, press Enter or swipe down to restart!', canvas.width/2 + 2, 202);
        }
    }

    function restartGame(){
        player.restart();
        background.restart();
        enemies = [];
        score = 0;
        gameOver = false;
        animate(0);
    }

    function toggleFullScreen(){
        console.log(document.fullscreenElement);
        if(!document.fullscreenElement){
            canvas.requestFullscreen().catch(err => { //err is auto-gen
                alert(`Error, can't enable fullscreen mode ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    fullScreenButton.addEventListener('click', toggleFullScreen);

    const input = new InputHandler();
    //all the code inside constructor will be executed
    const player = new Player(canvas.width, canvas.height);
    const background = new Background(canvas.width, canvas.height);
    let lastTime = 0;


    function animate(timeStamp){
        const deltaTime = timeStamp - lastTime; //diff betw this loop and prev loop in ms
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        background.draw(ctx);
        background.update();
        player.draw(ctx);
        player.update(input, deltaTime, enemies);
        handleEnemies(deltaTime);
        displayStatusText(ctx);
        if(!gameOver)requestAnimationFrame(animate);
        //here timeStamp is auto generated. reqyestAnimationFrame has a special feature:
        //it auto generate the timeStamp and passes it as an argument to the function it calls
    }
    animate(0); //the first call here does not have a timeStamp as it's not being called by the
    //requestAnimationFrame, so we assume it's 0
});

//document.fullScreenElement - built in read only prop that returns the element
//that is currently being precented in full screen mode. if it's null full screen is not active