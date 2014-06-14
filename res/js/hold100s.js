document.addEventListener("DOMContentLoaded", function(e) {

    var config = {
        path: {
            js: "../res/js/",
            data: "../res/data/",
            img: "../res/img/"
        }
    };

    // 增加类型，用来碰撞检测
    var SPRITE_SPACESHIP = 1;

    // 把用到的模块包含进来
    var Q = Q || Quintus().include("Sprites, Scenes, Input, Touch, 2D, Anim");
    // 定义一个全屏的 canvas，并对类型为 SPRITE_FRIENDLY 的精灵支持 touch
    Q.setup({ maximize: true }).touch(Q.SPRITE_FRIENDLY);

    var impony = impony || {};

    impony.direction = function (playerPos, side) {
        var playerPos = playerPos || {x: 0, y: 0};
        var x = 0,
            y = 0,
            radian = 0,
            speed = Math.random() * 4 + 1,
            vx = 0,
            vy = 0;
        switch(side) {
            case 1:
                x = Math.random() * Q.width >> 0;
                y = 0;
                break;
            case 2:
                x = Math.random() * Q.width >> 0;
                y = Q.height;
                break;
            case 3:
                x = 0;
                y = Math.random() * Q.height >> 0;
                break;
            case 4:
                x = Q.width;
                y = Math.random() * Q.height >> 0;
                break;
            default:
                x = Math.random() * Q.width >> 0;
                y = 0;
        }
        // 求出子弹和飞机之间的弧度
        radian = Math.atan2(playerPos.y - y, playerPos.x - x);
        // 求出不同座标轴上的速度
        vx = speed * Math.cos(radian) >> 0;
        vy = speed * Math.sin(radian) >> 0;
        return {x: x, y: y, vx: vx, vy: vy};
    };

    Q.Sprite.extend("Circle", {
        init: function (p, stage) {
            this._super(p, {
                collisionMask: SPRITE_SPACESHIP,
                color: "red",
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
                this.stage.insert(new Q.Circle(impony.direction({x: this.player.x, y: this.player.y}, Math.random() * 4 + 1 >> 0), this.stage));
                this.destroy();
            }
        }
    });

    // 制造一个全屏精灵，负责映射飞机的行动，以防止手指遮挡住飞机
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
        // 获得场景中飞机的座标
        touch: function (touch) {
            this.playerX = Q("Player").items[0].p.x;
            this.playerY = Q("Player").items[0].p.y;
        },
        // 在拖动的时候改变飞机的座标
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
                x: 100,
                y: 100,
                // 用座标描述不规则图形，座标系原点是精灵中心点
                points: [[-2, -24], [-6, -16], [-6, -4], [-10, -1], [-10, 7], [11, 7], [11, -1], [8, -4], [8, -16], [4, -24]],
                type: SPRITE_SPACESHIP
            });
            this.add("animation");
            this.on("hit", this, "collision");
        },
        collision: function(col) {
            //TODO 爆炸动画并跳到结束场景
            // 第二个参数用来控制优先级
            this.play("explode", 1);
        },
        step: function (dt) {
            this.play("spaceship");
            this.stage.collide(this);
        }
    });

    Q.scene("start", new Q.Scene(function (stage) {
        stage.insert(new Q.Mask({w: Q.width * 2, h: Q.height * 2}, stage));
        stage.insert(new Q.Player());
        var player = Q("Player").items[0].p;
        for(var i = 12; i--;) {
            stage.insert(new Q.Circle(impony.direction({x: player.x, y: player.y}, Math.random() * 4 + 1 >> 0), stage));
        }
    }));

    Q.load([
        config.path.data + "spaceship.json",
        config.path.img + "spaceship.png",
        config.path.img + "bg.png"
    ], function() {
        Q.compileSheets(config.path.img + "spaceship.png", config.path.data + "spaceship.json");
        // 飞船精灵动画
        Q.animations("spaceship", {
            spaceship: {
                frames: [0, 1, 2, 3],
                rate: 1/15
            },
            explode: {
                frames: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
                rate: 1/17
            }
        });
        Q.stageScene("start");
    });

    Q.debug = false;
    Q.debugFill = true;

});