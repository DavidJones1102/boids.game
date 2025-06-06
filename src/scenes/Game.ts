import { Scene } from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { Shark } from '../entities/Shark';
import { Environment } from '../entities/Environment';
import { Counter } from '../entities/Counter';
import { BoidManager } from '../entities/BoidManager';
import { UI } from '../entities/UI';

export class FishGame extends Scene {
  private camera: Phaser.Cameras.Scene2D.Camera;
  private msg_text: Phaser.GameObjects.Text;
  private config: typeof GameConfig;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private fullscreenKey: Phaser.Input.Keyboard.Key;
  private boidManager: BoidManager;
  public ui: UI;
  private gameTimeText: Phaser.GameObjects.Text;
  private gameStartTime: number = 0;
  private totalPausedTime: number = 0;
  private lastPauseTime: number = 0;
  // private groundBodies: Phaser.Physics.Arcade.StaticGroup;

  // ============ public ============
  public environment: Environment;
  public shark: Shark;
  public counter: Counter;

  constructor() {
    super({
      key: 'Game',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: GameConfig.debug,
          debugShowBody: true,
          debugShowVelocity: true,
          debugBodyColor: 0x00ff00,
          isPaused: true,
        },
      },
    });
    this.config = GameConfig;
  }

  // private seededRandom(): number {
  //     this.seed = (this.seed * 9301 + 49297) % 233280;
  //     return this.seed / 233280;
  // }

  preload() {
    this.load.image('shark', 'assets/shark_silhouette.svg');
    this.load.image('fish', 'assets/fish.svg');
    this.load.image('fish-bone', 'assets/fish-bone.png');
    this.load.image('clown_fish', 'assets/clown_fish.svg');
    this.load.image('rock', 'assets/rock.png');
    this.load.image('jellyfish', 'assets/jellyfish.png');
    this.load.image('coral', 'assets/coral.png');
    this.load.image('kelp', 'assets/kelp.svg');

    // Create a circle texture for speed lines
    const graphics = this.make.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('speed_line', 4, 4);
    graphics.destroy();

    // Create a blood particle texture
    const bloodGraphics = this.make.graphics();
    bloodGraphics.fillStyle(0xff0000, 1);
    bloodGraphics.fillCircle(2, 2, 2);
    bloodGraphics.generateTexture('blood_particle', 4, 4);
    bloodGraphics.destroy();
  }

  create() {
    // Set up the world bounds
    this.physics.world.setBounds(0, 0, this.config.worldWidth, this.config.worldHeight);
    this.physics.world.fixedStep = false;

    // Set up the camera with smoother follow
    this.camera = this.cameras.main;
    this.camera
      .setBounds(0, 0, this.config.worldWidth, this.config.worldHeight)
      .setLerp(0.1, 0.1)
      .setDeadzone(100, 100)
      .setFollowOffset(0, 0);

    this.environment = new Environment(this, this.config);

    // // Create shark
    this.shark = new Shark(this, this.config.windowWidth / 2, this.config.surface.height + 100);
    this.shark.getSprite().setDepth(1.1);

    this.camera.startFollow(
      this.shark.getSprite(),
      true,
      this.config.camera.lerpX,
      this.config.camera.lerpY
    );

    this.boidManager = new BoidManager(this, this.config);

    // Add collision between shark and ground
    this.physics.add.collider(this.shark.getSprite(), this.environment.groundBodies);
    this.physics.add.collider(this.environment.jellyfishBodies, this.environment.rocksBodies);
    this.physics.add.collider(this.environment.jellyfishBodies, this.environment.groundBodies);
    this.physics.add.collider(this.shark.getSprite(), this.environment.rocksBodies);
    this.physics.add.collider(
      this.boidManager.fishBoneManager.fishBonesBodies,
      this.environment.groundBodies
    );
    this.physics.add.collider(
      this.boidManager.fishBoneManager.fishBonesBodies,
      this.environment.rocksBodies
    );

    this.cursors = this.input.keyboard.createCursorKeys();

    this.counter = new Counter(this, this.config);

    // Add fullscreen toggle key
    this.fullscreenKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.fullscreenKey.on('down', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });
    this.environment.update();

    // Initialize UI
    this.ui = new UI(this, this.config);

    // Create game time display
    this.gameTimeText = this.add.text(20, 20, 'Time: 00:00', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.gameTimeText.setScrollFactor(0);
    this.gameTimeText.setDepth(3);
    this.gameStartTime = Date.now();
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  update() {
    if (this.ui.isPaused) {
      this.physics.pause();
      if (this.lastPauseTime === 0) {
        this.lastPauseTime = Date.now();
      }
      return;
    }

    this.physics.resume();
    if (this.lastPauseTime !== 0) {
      this.totalPausedTime += Date.now() - this.lastPauseTime;
      this.lastPauseTime = 0;
    }

    // Update game time with pause compensation
    const currentTime = Date.now() - this.gameStartTime - this.totalPausedTime;
    this.gameTimeText.setText(`Time: ${this.formatTime(currentTime)}`);

    // Update shark first
    this.shark.update(this.cursors);

    // Update environment (waves and ground)
    this.environment.update();

    // Update boids
    this.boidManager.update();

    // Update tab title with FPS
    document.title = `Boids Game - ${Math.round(this.game.loop.actualFps)} FPS`;
  }
}
