var scene, camera, renderer;
var globalUniforms;
var mouseX, mouseY;
var cameraRTT;
var w = window.innerWidth;
var h = window.innerHeight;
var time = 0.0;
var mesh;
var meshes = [];
var emitter;
var inc = 0.0;
var addFrames = true;
setup();

function setup(){
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(45, w / h, 1, 100000);
    camera.position.set(0,0, 100);
	cameraRTT = new THREE.OrthographicCamera( w / - 2, w / 2, h / 2, h / - 2, -10000, 10000 );
	cameraRTT.position.z = 0;

    controls = new THREE.OrbitControls(camera);

	renderer = new THREE.WebGLRenderer({antialias: false, preserveDrawingBuffer: true, alpha: true});
    renderer.setSize(w, h);
    renderer.setClearColor(0xffffff, 1);

    container = document.createElement('div');
    document.body.appendChild(container);
    container.appendChild(renderer.domElement);


    globalUniforms = {
		time: { type: "f", value: 0.0 } ,
		resolution: {type: "v2", value: new THREE.Vector2(w,h)},
		step_w: {type: "f", value: 1/w},
		step_h: {type: "f", value: 1/h},
		mouseX: {type: "f", value: 1.0},
		mouseY: {type: "f", value: 1.0},
        texture: {type: "t", value: THREE.ImageUtils.loadTexture("tex/rainbowstripes.png")}
	}
    globalUniforms.texture.value.magFilter = THREE.NearestFilter;
    globalUniforms.texture.value.minFilter = THREE.NearestFilter;
    globalUniforms.texture.value.needsUpdate = true;


    CustomSinCurve = THREE.Curve.create(
        function ( scale ) { //custom curve constructor
            this.scale = (scale === undefined) ? 1 : scale;
        },
        
        function ( t ) { //getPoint: t is between 0-1
            var tx = t * 3 - 1.5,
                // ty = Math.sin( Math.PI * t )*0.4,
                ty = 0,
                tz = 0;
            
            return new THREE.Vector3(tx, ty, tz).multiplyScalar(this.scale);
        }
    );

    fbo = new FBObject({
        w: w,
        h: h,
        scale: 1, 
        texture: "tex/rainbowstripes.png",
        // useVideo:true,
        vertexShader: "vs",
        fragmentShader1: "fs",
        fragmentShader2: "colorFs",
        mainScene: scene
    });
    fbo.uniforms = globalUniforms;
    fbo.init();

    console.log(fbo.renderTargets[1]);
    console.log(globalUniforms.texture);

    for(var i = 0; i< 10; i++){
        path = new CustomSinCurve( 100 ); //length of curve
        var material = new THREE.ShaderMaterial( {
            uniforms: { 
                texture: fbo.renderTargets[1],
                time: globalUniforms.time,
                resolution: globalUniforms.resolution,
                offset: {type: "f", value:Math.random()*100} //offset noise function
            },
            vertexShader: document.getElementById( 'noiseVs' ).textContent, //noise vertex shader
            fragmentShader: document.getElementById( 'fs' ).textContent, //TODO: color shader not cycling thru hues
            // shading: THREE.SmoothShading,
            side: 2,
            // transparent: true,
            // depthWrite: false
            // map: fbo.renderTargets[1]           
        } );
        // var material = new THREE.MeshBasicMaterial({
        //     map: fbo.renderTargets[1],
        //     shading: THREE.SmoothShading,
        //     side: 2,
        //     transparent: true,
        //     depthWrite: false
        // })

        var mesh = new THREE.Mesh( 
            new THREE.TubeGeometry(
                path,
                100, //length segments
                10,  //radius
                10,  //radius segments
                false),
            material 
        );
        meshes.push(mesh);
        var pivot = new THREE.Object3D();
        pivot.position.x = 0;
        mesh.position.x = -150;
        pivot.add( mesh );
        pivot.rotation.set(Math.cos(i)/2, Math.sin(i)/2, 0) // otherwise, pivots in center of tube
        scene.add( pivot );
    }
    
    emitter = new ParticleEmitter();

    window.addEventListener("keydown", onKeyDown); //press space bar to screenshot
    window.addEventListener("mousemove", onDocumentMouseMove);

	draw();

}
function draw(){
	window.requestAnimationFrame(draw);
    for(var j = 0; j < meshes.length; j++){
        meshes[j].geometry.verticesNeedUpdate = true;
        for(var i = 0; i < meshes[j].geometry.vertices.length; i++){
            // meshes[j].geometry.vertices[i].y += Math.sin((i-i/2)/(100) + time*10); //sin wave effect

        }
    }              
              
    emitter.emit(
        scene,                                  //scene 
        new THREE.Vector3(0,0,0),               //position  
        new THREE.Vector3(0,0,0),               //rotation  
        new THREE.Vector3(5,5,5),            //scale
        0.0,                                    //random position     
        Math.PI*2.0,                            //random rotation  
        25.0,                                   //random scale
        new THREE.Vector3(-2.5, Math.random()*2 - 1, Math.random()*2 - 1),   //velocity position
        new THREE.Vector3(-.1+Math.random()*.2,-.1+Math.random()*.2,-.1+Math.random()*.2),//velocity rotation
        new THREE.Vector3(-0.004, -0.004, -0.004)     //velocity scale
    );
    emitter.update();

	time+=0.01;
	globalUniforms.time.value = time;

    fbo.passTex();

    inc++
    if(inc >= 10){
        addFrames = false;
    }
    if(addFrames){
        fbo.getFrame(cameraRTT);
        translate = true;
    }
    fbo.render(cameraRTT);
    renderer.render(scene, camera);
    fbo.cycle();

}
//UTILS & LISTENERS
function loadModel(model, x, y, z, scale, rotX, rotY, rotZ, customMaterial){
    var loader = new THREE.OBJLoader( manager );
    loader.load( model, function ( object ) {

        object.traverse( function ( child ) {

            if ( child instanceof THREE.Mesh ) {

                child.material = customMaterial;

            }

        } );
        object.scale.set(scale,scale,scale);
        scene.add( object );

    }, onProgress, onError );
}
function map(value, max, minrange, maxrange) {
    return ((max - value) / (max)) * (maxrange - minrange) + minrange;
}

function onDocumentMouseMove(event) {
    unMappedMouseX = (event.clientX);
    unMappedMouseY = (event.clientY);
    mouseX = map(unMappedMouseX, window.innerWidth, -1.0, 1.0);
    mouseY = map(unMappedMouseY, window.innerHeight, -1.0, 1.0);
    globalUniforms.mouseX.value = mouseX;
    globalUniforms.mouseY.value = mouseY;
}
function onKeyDown(event) {
    if (event.keyCode == "32") {
        screenshot();

        function screenshot() {
            var blob = dataURItoBlob(renderer.domElement.toDataURL('image/png'));
            var file = window.URL.createObjectURL(blob);
            var img = new Image();
            img.src = file;
            img.onload = function(e) {
                window.open(this.src);
            }
        }

        function dataURItoBlob(dataURI) {
            // convert base64/URLEncoded data component to raw binary data held in a string
            var byteString;
            if (dataURI.split(',')[0].indexOf('base64') >= 0)
                byteString = atob(dataURI.split(',')[1]);
            else
                byteString = unescape(dataURI.split(',')[1]);

            // separate out the mime component
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

            // write the bytes of the string to a typed array
            var ia = new Uint8Array(byteString.length);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            return new Blob([ia], {
                type: mimeString
            });
        }

        function insertAfter(newNode, referenceNode) {
            referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
        }
    }
}

