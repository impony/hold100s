window.addEventListener("load", function(e) {

    var config = {
        path: {
            js: "../res/js/",
            data: "../res/data/",
            img: "../res/img/"
        },
        author: "impony@vip.qq.com",
        version: "v0.1.3"
    };

    // 增加类型，用来碰撞检测
    var SPRITE_SPACESHIP = 1;

    // 把用到的模块包含进来
    var Q = Q || Quintus().include("Sprites, Scenes, Input, Touch, 2D, Anim, UI");

    // 定义一个全屏的 canvas，并对类型为 SPRITE_FRIENDLY 的精灵支持 touch
    Q.setup({ maximize: true }).touch(Q.SPRITE_FRIENDLY);

    // 缩放画布，以适应视网膜屏等
    var ratio = window.devicePixelRatio || 1;
    if (ratio > 1) {
        Q.el.width = Q.width * ratio;
        Q.el.height = Q.height * ratio;
        Q.el.style.width = Q.width + "px";
        Q.el.style.height = Q.height + "px";
        Q.ctx.scale(ratio, ratio);
    }

    var impony = impony || {};

    // 用来记录游戏开始时间，存储的为时间戳
    impony.time = {
        start: 0
    };

    // 根据飞船位置，从屏幕四边随机生成一些随机座标和随机速度并返回
    impony.direction = function (playerPos, side) {
        var playerPos = playerPos || {x: 0, y: 0},
            x = 0,
            y = 0,
            randomX = Math.random() * Q.width >> 0,
            randomY = Math.random() * Q.height >> 0,
            radian = 0,
            speed = Math.random() * 4 + 1 >> 0,
            vx = 0,
            vy = 0;
        switch(side) {
            case 1:
                x = randomX;
                y = 0;
                break;
            case 2:
                x = randomX;
                y = Q.height;
                break;
            case 3:
                x = 0;
                y = randomY;
                break;
            case 4:
                x = Q.width;
                y = randomY;
                break;
            default:
                x = Q.width;
                y = randomY;
        }
        // 求出子弹和飞船之间的弧度
        radian = Math.atan2(playerPos.y - y, playerPos.x - x);
        // 求出不同座标轴上的速度
        vx = speed * Math.cos(radian) >> 0;
        vy = speed * Math.sin(radian) >> 0;
        return {x: x, y: y, vx: vx, vy: vy};
    };

    // 没有比较好的锁定屏幕方向的办法，所以只好退而求其次当屏幕旋转时重载页面
    impony.reload = function () {
        var t = setTimeout(function () {
            location.reload();
        }, 100);
    }

    Q.Sprite.extend("Bullet", {
        init: function (p, stage) {
            this._super(p, {
                collisionMask: SPRITE_SPACESHIP,
                sheet: "bullet",
                sprite: "bullet",
                w: 5,
                h: 5,
                x: 0,
                y: 0,
                type: Q.SPRITE_ENEMY //enemy sprite type: SPRITE_ENEMY
            });
            this.stage = stage;
            this.player = Q("Player").items[0].p;
        },
        step: function (dt) {
            this.p.x += this.p.vx;
            this.p.y += this.p.vy;
            if (this.p.x - 2 <= 0 || this.p.x + 2 >= Q.width || this.p.y - 2 <= 0 || this.p.y + 2 >= Q.height) {
                this.stage.insert(new Q.Bullet(impony.direction({x: this.player.x, y: this.player.y}, Math.random() * 4 + 1 >> 0), this.stage));
                this.destroy();
            }
        }
    });

    // 制造一个全屏精灵，负责映射飞船的行动，以防止手指遮挡住飞船
    Q.Sprite.extend("Mask", {

        init: function (p, stage) {
            this._super(p, {
                w: 0,
                h: 0,
                x: 0,
                y: 0,
                type: Q.SPRITE_FRIENDLY //friendly sprite type: SPRITE_FRIENDLY
            });
            this.stage = stage;
            this.playerX = 0;
            this.playerY = 0;
            this.on("touch");
            this.on("drag");
            this.on("touchEnd");
        },
        // 获得场景中飞船的座标
        touch: function (touch) {
            this.playerX = Q("Player").items[0].p.x;
            this.playerY = Q("Player").items[0].p.y;
        },
        // 在拖动的时候改变飞船的座标
        drag: function (touch) {
            this.p.dragging = true;
            Q("Player").set("x", this.playerX + touch.dx);
            Q("Player").set("y", this.playerY + touch.dy);
            // 防止溢出边界
            var player = Q("Player").items[0].p;
            player.x = player.x < 22 ? 22 : player.x > Q.width ? Q.width : player.x;
            player.y = player.y < 24 ? 24 : player.y > Q.height ? Q.height : player.y;
        },
        touchEnd: function (touch) {
            this.p.dragging = false;
        }

    });

    Q.Sprite.extend("Player", {

        init: function (p) {
            this._super(p, {
                sheet: "spaceship",
                sprite: "spaceship",
                collisionMask: Q.SPRITE_ENEMY,
                w: 50,
                h: 50,
                x: Q.width / 2,
                y: Q.height / 2,
                // 用座标描述不规则图形，座标系原点是精灵中心点
                points: [[-2, -24], [-6, -16], [-6, -4], [-10, -1], [-10, 7], [11, 7], [11, -1], [8, -4], [8, -16], [4, -24]],
                type: SPRITE_SPACESHIP
            });
            this.add("animation");
            this.play("spaceship");
            this.on("hit", this, "collision");
        },
        collision: function(col) {
            var endTime = + new Date();
            Q("Bullet").destroy();
            // 第二个参数用来控制优先级
            this.play("explode", 1);
            // 因为还没有研究明白如何播放动画后回调，所以只好用了一个延迟代替
            var t = setTimeout(function () {
                Q.stageScene("endGame", 1, {label: "坚持了 " + (endTime - impony.time.start) / 1000 + " 秒"});
            }, 500);
        },
        step: function (dt) {
            this.stage.collide(this);
        }

    });

    Q.Sprite.extend("Title", {

        init: function (p) {
            this._super(p, {
                sheet: "title",
                sprite: "title",
                w: 300,
                h: 100,
                x: Q.width / 2,
                y: Q.height / 2 - 100,
            });
        }

    });

    Q.scene("start", new Q.Scene(function (stage) {

        var w = Q.width;
        var h = Q.height;
        impony.time.start = 0;

        // 刚进游戏时，“坚持　百秒”字中间那个飞船动画
        stage.insert(new Q.Player({y: h / 2 - 95}));
        stage.insert(new Q.Title());

        var container = stage.insert(new Q.UI.Container({
            x: w / 2, y: h / 2, w: w, h: h, fill: "rgba(0, 0, 0, .1)"
        }));
        var startGame = container.insert(new Q.UI.Button({
            x: 0, y: 0, fill: "rgba(255, 255, 255, .7)", label: "开始游戏", type: Q.SPRITE_FRIENDLY
        }));
        var author = container.insert(new Q.UI.Text({
            x: 0, y: h / 2 - 50, size: 12, color: "#333", align: "center", label: config.author
        }));
        var version = container.insert(new Q.UI.Text({
            x: 0, y: h / 2 - 30, size: 10, color: "#333", align: "center", label: config.version
        }));

        startGame.on("click", function () {
            Q.clearStages();
            impony.time.start = + new Date();
            Q.stageScene("level1");
        });

    }));

    Q.scene("level1", new Q.Scene(function (stage) {

        var w = Q.width;
        var h = Q.height;
        var num = w * h / 8000 >> 0;
        var player = new Q.Player();

        stage.insert(new Q.Mask({w: w * 2, h: h * 2}, stage));
        stage.insert(player);
        // 在窗口四个边随机生成一些目标是飞船的子弹
        for(var i = num; i--;) {
            stage.insert(new Q.Bullet(impony.direction({x: player.x, y: player.y}, Math.random() * 4 + 1 >> 0), stage));
        }

    }));

    Q.scene("endGame", function (stage) {

        Q.stageScene(null);
        var w = Q.width;
        var h = Q.height;

        var container = stage.insert(new Q.UI.Container({
            x: w / 2, y: h / 2, w: w, h: h, fill: "rgba(0, 0, 0, .1)"
        }));
        var tryAgain = container.insert(new Q.UI.Button({
            x: 0, y: 0, fill: "rgba(255, 255, 255, .7)", label: "再试一次", type: Q.SPRITE_FRIENDLY
        }));
        var mainMenu = container.insert(new Q.UI.Button({
            x: 0, y: 20 + tryAgain.p.h, fill: "rgba(255, 255, 255, .7)", label: "回主菜单", type: Q.SPRITE_FRIENDLY
        }));
        var label = container.insert(new Q.UI.Text({
            x: 0, y: -20 - tryAgain.p.h, color: "#CCC", align: "center", label: stage.options.label
        }));
        var author = container.insert(new Q.UI.Text({
            x: 0, y: h / 2 - 50, size: 12, color: "#333", align: "center", label: config.author
        }));
        var version = container.insert(new Q.UI.Text({
            x: 0, y: h / 2 - 30, size: 10, color: "#333", align: "center", label: config.version
        }));

        tryAgain.on("click", function () {
            Q.clearStages();
            impony.time.start = + new Date();
            Q.stageScene("level1");
        });
        mainMenu.on("click", function () {
            Q.clearStages();
            Q.stageScene("start");
        });

    });

    Q.load([
        config.path.data + "title.json",
        config.path.img + "title.png",
        config.path.data + "bullet.json",
        config.path.img + "bullet.png",
        config.path.data + "spaceship.json",
        config.path.img + "spaceship.png",
        config.path.img + "bg.png"
    ], function() {
        Q.compileSheets(config.path.img + "title.png", config.path.data + "title.json");
        Q.compileSheets(config.path.img + "bullet.png", config.path.data + "bullet.json");
        Q.compileSheets(config.path.img + "spaceship.png", config.path.data + "spaceship.json");
        // 飞船精灵动画
        Q.animations("spaceship", {
            spaceship: {
                frames: [0, 1, 2, 3],
                rate: 1/15
            },
            explode: {
                frames: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
                rate: 1/17,
                loop: false
            }
        });
        Q.stageScene("start");
    });

    window.addEventListener("orientationchange", impony.reload, false);
    window.addEventListener("resize", impony.reload, false);

    Q.debug = false;
    Q.debugFill = false;

});