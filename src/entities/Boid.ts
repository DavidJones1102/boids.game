import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { FishGame } from '../scenes/Game';
// import { PhysicsConfig } from '../config/PhysicsConfig';

export class Boid {
  private sprite: Phaser.Physics.Arcade.Image;
  private size: number;
  private scene: FishGame;
  private config: typeof GameConfig;

  private isAlive: boolean = true;

  // Boid behavior parameters
  private static readonly ALIGNMENT_RADIUS = 50;
  private static readonly COHESION_RADIUS = 100;
  private static readonly SEPARATION_RADIUS = 25;
  private static readonly COLLISION_RADIUS = 20;
  private static readonly MIN_SIZE = 10;
  private static readonly MAX_SIZE = 25;
  private static readonly MAX_SPEED = 2;
  private static readonly MAX_FORCE = 0.05;
  private static readonly COLLISION_FORCE = 0.5;
  private static readonly SHARK_AVOIDANCE_RADIUS = 250; // Radius to avoid shark
  private static readonly SHARK_FORCE = 1.8; // Strong avoidance force for shark
  private static readonly BOID_DEATH_TIME = 5;

  private static readonly GRAVITY = 0.2;
  private static readonly WATER_SURFACE_HEIGHT = 500;
  private static readonly WATER_RESISTANCE = 0.92;
  private static readonly AIR_DRAG = 0.99; // Match shark's air drag
  private isAboveWater: boolean = false;

  constructor(scene: FishGame, x: number, y: number) {
    this.config = GameConfig;
    // this.physicsConfig = PhysicsConfig;
    this.scene = scene;
    this.size = Phaser.Math.Between(Boid.MIN_SIZE, Boid.MAX_SIZE);

    // Load fish sprite and add physics
    this.sprite = scene.physics.add.image(x, y, 'fish');
    this.sprite.setScale(this.size / 360); // Adjust scale since SVG is 576x512
    this.sprite.setOrigin(0.5);
    // Generate random bright RGB values between 128-255 for a bright color
    const r = Phaser.Math.Between(80, 150);
    const g = Phaser.Math.Between(80, 150);
    const b = Phaser.Math.Between(80, 150);
    const color = Phaser.Display.Color.GetColor(r, g, b);
    this.sprite.setTintFill(color);
    this.sprite.setAlpha(0.9);

    // Set up physics body
    this.sprite.setCircle(this.sprite.width / 2);
    this.sprite.setBounce(1);
    this.sprite.setVelocity(Phaser.Math.Between(-400, 400), Phaser.Math.Between(-400, 400));

    this.sprite.setCollideWorldBounds(true);
  }

  //   private getNearbyBoids(radius: number): Boid[] {
  //     return (this.scene as any).boids.filter((boid: Boid) => {
  //       if (boid === this || !boid.isAlive) return false;
  //       return (
  //         Phaser.Math.Distance.Between(
  //           this.position.x,
  //           this.position.y,
  //           boid.position.x,
  //           boid.position.y
  //         ) < radius
  //       );
  //     });
  //   }

  //   private align(nearbyBoids: Boid[]): Phaser.Math.Vector2 {
  //     if (nearbyBoids.length === 0) return new Phaser.Math.Vector2();

  //     const steering = new Phaser.Math.Vector2();
  //     nearbyBoids.forEach((boid) => {
  //       steering.add(boid.velocity);
  //     });

  //     steering.divide(new Phaser.Math.Vector2(nearbyBoids.length, nearbyBoids.length));
  //     steering.normalize().scale(Boid.MAX_SPEED);
  //     steering.subtract(this.velocity);
  //     steering.limit(Boid.MAX_FORCE);

  //     return steering;
  //   }

  //   private cohesion(nearbyBoids: Boid[]): Phaser.Math.Vector2 {
  //     if (nearbyBoids.length === 0) return new Phaser.Math.Vector2();

  //     const center = new Phaser.Math.Vector2();
  //     nearbyBoids.forEach((boid) => {
  //       center.add(boid.position);
  //     });

  //     center.divide(new Phaser.Math.Vector2(nearbyBoids.length, nearbyBoids.length));

  //     const steering = center.subtract(this.position);
  //     steering.normalize().scale(Boid.MAX_SPEED);
  //     steering.subtract(this.velocity);
  //     steering.limit(Boid.MAX_FORCE);

  //     return steering;
  //   }

  //   private separation(nearbyBoids: Boid[]): Phaser.Math.Vector2 {
  //     if (nearbyBoids.length === 0) return new Phaser.Math.Vector2();

  //     const steering = new Phaser.Math.Vector2();
  //     nearbyBoids.forEach((boid) => {
  //       const diff = new Phaser.Math.Vector2(
  //         this.position.x - boid.position.x,
  //         this.position.y - boid.position.y
  //       );
  //       const distance = diff.length();
  //       diff.normalize().scale(1 / Math.max(distance, 0.1));
  //       steering.add(diff);
  //     });

  //     if (nearbyBoids.length > 0) {
  //       steering.divide(new Phaser.Math.Vector2(nearbyBoids.length, nearbyBoids.length));
  //     }

  //     steering.normalize().scale(Boid.MAX_SPEED);
  //     steering.subtract(this.velocity);
  //     steering.limit(Boid.MAX_FORCE);

  //     return steering;
  //   }

  //   private avoidCollisions(): Phaser.Math.Vector2 {
  //     const collisionNeighbors = this.getNearbyBoids(Boid.COLLISION_RADIUS);
  //     if (collisionNeighbors.length === 0) return new Phaser.Math.Vector2();

  //     const avoidance = new Phaser.Math.Vector2();
  //     collisionNeighbors.forEach((boid) => {
  //       const diff = new Phaser.Math.Vector2(
  //         this.position.x - boid.position.x,
  //         this.position.y - boid.position.y
  //       );
  //       const distance = diff.length();
  //       // Stronger avoidance force for very close boids
  //       const force = (Boid.COLLISION_RADIUS - distance) / Boid.COLLISION_RADIUS;
  //       diff.normalize().scale(force * Boid.COLLISION_FORCE);
  //       avoidance.add(diff);
  //     });

  //     return avoidance;
  //   }

  //   private avoidShark(): Phaser.Math.Vector2 {
  //     const shark = (this.scene as any).shark;
  //     if (!shark) return new Phaser.Math.Vector2();

  //     const distance = Phaser.Math.Distance.Between(
  //       this.position.x,
  //       this.position.y,
  //       shark.position.x,
  //       shark.position.y
  //     );

  //     if (distance > Boid.SHARK_AVOIDANCE_RADIUS) {
  //       return new Phaser.Math.Vector2();
  //     }

  //     const diff = new Phaser.Math.Vector2(
  //       this.position.x - shark.position.x,
  //       this.position.y - shark.position.y
  //     );

  //     const force = (Boid.SHARK_AVOIDANCE_RADIUS - distance) / Boid.SHARK_AVOIDANCE_RADIUS;
  //     diff.normalize().scale(force * Boid.SHARK_FORCE);
  //     return diff;
  //   }

  // private checkSharkCollision(shark: Shark): void {
  //     const sharkBounds = shark.getCollisionBox().getBounds();
  //     const boidBounds = this.collisionBox.getBounds();

  //     this.isColliding = Phaser.Geom.Intersects.RectangleToRectangle(boidBounds, sharkBounds);
  //     if (this.isColliding && this.isAlive) {
  //         this.image.setTintFill(0xff0000);
  //         this.isAlive = false;
  //         // Increment the counter in the Game scene
  //         (this.scene as any).incrementEatenFishCounter();
  //         // Make shark grow and speed up
  //         shark.onFishEaten();
  //     }
  // }

  // private createWaterSurface() {
  //     const graphics = this.scene.add.graphics();
  //     // Use config values
  //     graphics.fillStyle(this.physicsConfig.WATER_COLOR, this.physicsConfig.WATER_ALPHA);
  //     graphics.fillRect(0, this.physicsConfig.WATER_SURFACE_HEIGHT, this.mapWidth, this.mapHeight);

  //     // Create wobbling water line
  //     const waterLine = this.scene.add.graphics();
  //     waterLine.lineStyle(2, this.physicsConfig.WATER_LINE_COLOR);

  //     // Animate water line
  //     this.scene.tweens.addCounter({
  //         from: 0,
  //         to: Math.PI * 2,
  //         duration: 2000,
  //         repeat: -1,
  //         onUpdate: (tween) => {
  //             waterLine.clear();
  //             waterLine.lineStyle(2, this.physicsConfig.WATER_LINE_COLOR);
  //             waterLine.beginPath();

  //             for (let x = 0; x < this.mapWidth; x += 5) {
  //                 const y = this.physicsConfig.WATER_SURFACE_HEIGHT +
  //                     Math.sin(x * 0.02 + tween.getValue()) * 5;
  //                 if (x === 0) {
  //                     waterLine.moveTo(x, y);
  //                 } else {
  //                     waterLine.lineTo(x, y);
  //                 }
  //             }
  //             waterLine.strokePath();
  //         }
  //     });

  //     this.scene.data.set('waterSurface', true);
  // }

  update(): void {
    // Set angular velocity based on velocity direction
    const angle = Math.atan2(this.sprite.body.velocity.y, this.sprite.body.velocity.x);
    this.sprite.setRotation(angle);

    if (this.sprite.y < this.config.surface.height) {
      this.sprite.setGravityY(1000);
    } else {
      this.sprite.setGravityY(0);
    }
    return;

    if (!this.isAlive) {
      // Apply friction to slow down dead fish
      const friction = 0.98;
      this.velocity.scale(friction);

      // Update position with reduced velocity
      this.position.add(this.velocity);
      // Gradually fade out over 10 seconds
      const fadeRate = 1 / (Boid.BOID_DEATH_TIME * 60); // 10 seconds * 60 fps
      this.sprite.setAlpha(Math.max(0, this.sprite.alpha - fadeRate));

      // Once fully faded, destroy the boid
      if (this.sprite.alpha <= 0) {
        // Remove this boid from the scene and array
        this.destroy();
      }
    } else {
      // Update water check to use config
      this.isAboveWater = this.position.y < this.physicsConfig.WATER_SURFACE_HEIGHT;

      if (this.isAboveWater) {
        this.velocity.y += this.physicsConfig.GRAVITY;
        this.velocity.x *= this.physicsConfig.AIR_DRAG;
      } else {
        if (this.velocity.y > 0) {
          this.velocity.y *= this.physicsConfig.WATER_RESISTANCE;
        }

        // Normal flocking behavior
        const alignmentBoids = this.getNearbyBoids(Boid.ALIGNMENT_RADIUS);
        const cohesionBoids = this.getNearbyBoids(Boid.COHESION_RADIUS);
        const separationBoids = this.getNearbyBoids(Boid.SEPARATION_RADIUS);

        const alignment = this.align(alignmentBoids);
        const cohesion = this.cohesion(cohesionBoids);
        const separation = this.separation(separationBoids);
        const collisionAvoidance = this.avoidCollisions();
        const sharkAvoidance = this.avoidShark();

        this.velocity.add(alignment);
        this.velocity.add(cohesion);
        this.velocity.add(separation.scale(1.5));
        this.velocity.add(collisionAvoidance);
        this.velocity.add(sharkAvoidance);
      }

      // Check collision with shark
      this.checkSharkCollision(shark);

      // Limit speed
      this.velocity.limit(Boid.MAX_SPEED);

      // Update position
      this.position.add(this.velocity);

      // Wrap around world bounds
      if (this.position.x > this.mapWidth) this.position.x = 0;
      if (this.position.x < 0) this.position.x = this.mapWidth;
      if (this.position.y > this.mapHeight) this.position.y = 0;
      if (this.position.y < 0) this.position.y = this.mapHeight;
    }

    // Update visual elements
    this.sprite.setPosition(this.position.x, this.position.y);
    this.sprite.setRotation(Math.atan2(this.velocity.y, this.velocity.x)); // Add PI to point in direction of movement

    // Update collision box
    // this.collisionBox.setPosition(this.position.x, this.position.y);
    // this.collisionBox.setRotation(Math.atan2(this.velocity.y, this.velocity.x));
    // this.collisionBox.setVisible(this.config.debug);
  }

  // destroy() {
  //     this.image.destroy();
  //     this.collisionBox.destroy();
  //     const boidIndex = (this.scene as any).boids.indexOf(this);
  //     if (boidIndex > -1) {
  //         (this.scene as any).boids.splice(boidIndex, 1);
  //     }
  // }

  dieAnimation(): void {
    // Make the fish red
    this.sprite.setTintFill(0xff0000);

    // Increment the counter
    this.scene.counter.updateCounter();
    // Fade out the fish
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.2,
      duration: 1000,
    });
    this.sprite.setDrag(500);
    // (boid as Phaser.Physics.Arcade.Image).setAngularDrag(1000);
    // Remove the fish after a short delay
  }

  getSprite(): Phaser.Types.Physics.Arcade.ArcadeColliderType {
    return this.sprite;
  }
}
