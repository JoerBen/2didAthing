import * as THREE from "three";

import fragment from "./fragment.glsl";
import vertex from "./vertex.glsl";
import GUI from "lil-gui";
import gsap from "gsap";

import img1 from "../../assets/textures/magazine/magazineCovers/1.png";
import img2 from "../../assets/textures/magazine/magazineCovers/2.png";
import img3 from "../../assets/textures/magazine/magazineCovers/3.png";
import img4 from "../../assets/textures/magazine/magazineCovers/4.jpg";
import img5 from "../../assets/textures/magazine/magazineCovers/5.png";
import img6 from "../../assets/textures/magazine/magazineCovers/6.png";
import img7 from "../../assets/textures/magazine/magazineCovers/7.png";
import img8 from "../../assets/textures/magazine/magazineCovers/8.png";
import img9 from "../../assets/textures/magazine/magazineCovers/9.png";
import img10 from "../../assets/textures/magazine/magazineCovers/10.png";
import img11 from "../../assets/textures/magazine/magazineCovers/11.jpg";
import img12 from "../../assets/textures/magazine/magazineCovers/12.png";
import img13 from "../../assets/textures/magazine/magazineCovers/13.png";
import img14 from "../../assets/textures/magazine/magazineCovers/14.jpg";
import img15 from "../../assets/textures/magazine/magazineCovers/15.jpg";
import img16 from "../../assets/textures/magazine/magazineCovers/16.png";
import img17 from "../../assets/textures/magazine/magazineCovers/17.png";
import img18 from "../../assets/textures/magazine/magazineCovers/18.png";
import img19 from "../../assets/textures/magazine/magazineCovers/19.png";
import img20 from "../../assets/textures/magazine/magazineCovers/20.png";

import displace from "../../assets/textures/magazine/displace.jpg";

const images = [
  img1,
  img2,
  img3,
  img4,
  img5,
  img6,
  img7,
  img8,
  img9,
  img10,
  img11,
  img12,
  img13,
  img14,
  img15,
  img16,
  img17,
  img18,
  img19,
  img20,
];
const textures = images.map((img) => new THREE.TextureLoader().load(img));

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scroll = 0;
    this.scrollTarget = 0;
    this.currentScroll = 0;
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
      format: THREE.RGBAFormat,
      magFilter: THREE.NearestFilter,
      minFilter: THREE.NearestFilter,
    });

    this.renderTarget1 = new THREE.WebGLRenderTarget(this.width, this.height, {
      format: THREE.RGBAFormat,
      magFilter: THREE.NearestFilter,
      minFilter: THREE.NearestFilter,
    });

    let frustrumSize = 4;
    let aspect = window.innerWidth / window.innerHeight;
    this.aspect = this.width / this.height;
    this.camera = new THREE.OrthographicCamera(
      (frustrumSize * aspect) / -2,
      (frustrumSize * aspect) / 2,
      frustrumSize / 2,
      frustrumSize / -2,
      -1000,
      1000
    );

    this.camera.position.set(2, 0, 2);

    this.time = 0;

    this.backgroundQuad = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(4 * this.aspect, 4),
      new THREE.MeshBasicMaterial({
        //transparent: true
      })
    );
    this.backgroundQuad.position.set(2, 0, -0.1);
    this.scene.add(this.backgroundQuad);

    this.isPlaying = true;
    this.initQuad();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.scrollEvent();
  }

  scrollEvent() {
    document.addEventListener("mousewheel", (e) => {
      this.scrollTarget = e.wheelDelta * 0.3;
    });

    document.body.addEventListener("touchmove", (e) => {
      this.scrollTarget = (e.touches[0].clientX - startX) * 0.05;
    });
    let startX;
    document.body.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });
  }

  initQuad() {
    this.materialQuad = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        uTexture: { value: null },
        uDisplace: { value: new THREE.TextureLoader().load(displace) },
        speed: { value: 0 },
        dir: { value: 0 },
        resolution: { value: new THREE.Vector4() },
      },
      transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.sceneQuad = new THREE.Scene();

    // this.materialQuad = new THREE.MeshBasicMaterial({
    //  transparent: true
    // });
    this.quad = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(4 * this.aspect, 4),
      this.materialQuad
    );

    this.quad.position.set(2, 0, 0);

    this.sceneQuad.add(this.quad);
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    this.gui = new GUI();
    this, gui.add(this.settings, "progress", 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    this.imageAspect = 853 / 1280;
    let a1;
    let a2;
    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = this.height / this.width / this.imageAspect;
    }

    this.camera.updateProjectionMatrix();
  }
  addObjects() {
    let that = this;

    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    this.meshes = [];
    this.n = 20;
    for (let i = 0; i < this.n; i++) {
      let mesh = new THREE.Mesh(
        this.geometry,

        new THREE.MeshBasicMaterial({
          map: textures[i % textures.length],
        })
      );
      //this.mesh.on('click', openUrl(){})
      this.meshes.push({
        mesh,
        index: i,
      });
      this.scene.add(mesh);
    }
  }
  updateMeshes() {
    this.meshes.forEach((o) => {
      this.margin = 1.2;
      this.wholeWidth = this.n * this.margin;

      o.mesh.position.x =
        ((this.margin * o.index +
          this.currentScroll +
          314159 * this.wholeWidth) %
          this.wholeWidth) -
        2 * this.margin;
    });
  }
  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.scroll += (this.scrollTarget - this.scroll) * 0.1;
    this.scroll *= 0.9;
    this.scrollTarget *= 0.9;
    this.currentScroll += this.scroll * 0.01;
    this.updateMeshes();
    requestAnimationFrame(this.render.bind(this));

    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);

    this.renderer.setRenderTarget(this.renderTarget1);
    //this.renderer.setRenderTarget(null);
    this.materialQuad.uniforms.uTexture.value = this.renderTarget.texture;
    this.materialQuad.uniforms.speed.value = Math.min(0.3, Math.abs(this.scroll));
    this.materialQuad.uniforms.dir.value = Math.sign(this.scroll);
    this.renderer.render(this.sceneQuad, this.camera);

    this.renderer.setRenderTarget(null);
    this.backgroundQuad.material.map = this.renderTarget1.texture;
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container"),
});
